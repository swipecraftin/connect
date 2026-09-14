import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { InAppNotification, NotificationType } from '../types/notification';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface NotificationContextType {
  notifications: InAppNotification[];
  unreadCount: number;
  addNotification: (item: {
    title: string;
    message: string;
    type: NotificationType;
    actionTab?: 'marketplace' | 'my-sessions' | 'profile';
    slotId?: string;
  }) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode; userId?: string | null }> = ({
  children,
  userId: propUserId,
}) => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(propUserId || null);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const currentUserIdRef = useRef<string | null>(propUserId || null);

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  // Clean up legacy mock storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('peermock_notifications_v1');
      } catch {}
    }
  }, []);

  // Sync with propUserId if provided
  useEffect(() => {
    if (propUserId !== undefined) {
      setCurrentUserId(propUserId);
    }
  }, [propUserId]);

  // Listen to Supabase auth session changes
  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      const uid = session?.user?.id || null;
      setCurrentUserId(uid);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id || null;
      setCurrentUserId(uid);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // When currentUserId changes, load notifications strictly for that account
  useEffect(() => {
    if (!currentUserId) {
      // User is logged out: no notifications should show
      setNotifications([]);
      return;
    }

    // User is logged in: load their account-scoped notifications
    if (typeof window !== 'undefined') {
      try {
        const key = `peermock_notifications_${currentUserId}`;
        const saved = localStorage.getItem(key);
        if (saved) {
          setNotifications(JSON.parse(saved));
        } else {
          setNotifications([]);
        }
      } catch {
        setNotifications([]);
      }
    }
  }, [currentUserId]);

  // Save changes to localStorage when notifications update and user is logged in
  const saveNotifications = (newNotifs: InAppNotification[]) => {
    setNotifications(newNotifs);
    const uid = currentUserIdRef.current;
    if (uid && typeof window !== 'undefined') {
      try {
        localStorage.setItem(`peermock_notifications_${uid}`, JSON.stringify(newNotifs));
      } catch {}
    }
  };

  const unreadCount = currentUserId ? notifications.filter((n) => !n.read).length : 0;

  const addNotification = (item: {
    title: string;
    message: string;
    type: NotificationType;
    actionTab?: 'marketplace' | 'my-sessions' | 'profile';
    slotId?: string;
  }) => {
    const uid = currentUserIdRef.current;
    // Strictly show and record notifications only when logged in
    if (!uid) return;

    const newItem: InAppNotification = {
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      title: item.title,
      message: item.message,
      timestamp: new Date().toISOString(),
      read: false,
      type: item.type,
      actionTab: item.actionTab,
      slotId: item.slotId,
    };

    setNotifications((prev) => {
      const updated = [newItem, ...prev];
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`peermock_notifications_${uid}`, JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
  };

  const markAsRead = (id: string) => {
    saveNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    saveNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    saveNotifications([]);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications: currentUserId ? notifications : [],
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
