import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface PresenceContextType {
  onlineUserIds: Set<string>;
  onlineCount: number;
  isUserOnline: (userId?: string | null) => boolean;
}

const PresenceContext = createContext<PresenceContextType | undefined>(undefined);

export const PresenceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Local mode fallback
      if (profile?.id) {
        setOnlineUserIds(new Set([profile.id]));
      }
      return;
    }

    const currentId = profile?.id || user?.id || `anon-${Math.random().toString(36).substring(2, 8)}`;

    const channel = supabase.channel('room:online-presence', {
      config: {
        presence: {
          key: currentId,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const activeIds = new Set<string>();
        Object.keys(state).forEach((key) => {
          activeIds.add(key);
        });
        if (profile?.id) activeIds.add(profile.id);
        setOnlineUserIds(activeIds);
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        setOnlineUserIds((prev) => new Set([...prev, key]));
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineUserIds((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            online_at: new Date().toISOString(),
            user_id: currentId,
            full_name: profile?.full_name || 'Anonymous Peer',
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id, profile?.id, profile?.full_name]);

  const onlineCount = useMemo(() => {
    return Math.max(onlineUserIds.size, user || profile ? 1 : 1);
  }, [onlineUserIds.size, user, profile]);

  const isUserOnline = (userId?: string | null): boolean => {
    if (!userId) return false;
    if (profile?.id && userId === profile.id) return true;
    if (onlineUserIds.has(userId)) return true;
    // For realistic feel, peers created or active in recent slots are considered active
    return false;
  };

  return (
    <PresenceContext.Provider value={{ onlineUserIds, onlineCount, isUserOnline }}>
      {children}
    </PresenceContext.Provider>
  );
};

export const usePresence = () => {
  const context = useContext(PresenceContext);
  if (!context) {
    throw new Error('usePresence must be used within a PresenceProvider');
  }
  return context;
};
