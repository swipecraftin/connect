import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Profile } from '../types/database';

export function useAuth() {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      try {
        const stored = localStorage.getItem('peermock_profile');
        if (stored) {
          const parsed = JSON.parse(stored);
          setProfile(parsed);
          setUser({ id: parsed.id, email: parsed.email });
        } else {
          const defaultProfile: Profile = {
            id: 'dev-user-host',
            email: 'swipecraft.in@gmail.com',
            full_name: 'Satya Kiran',
            headline: 'Full Stack Engineer · PeerMock',
            primary_domain: 'Systems Design',
            skills_tags: ['Systems Design', 'Backend', 'Distributed Systems'],
            years_of_experience: 'Senior (6-9y)',
            reliability_score: 100,
            total_sessions_completed: 6,
            no_show_count: 0,
            karma_score: 385,
            onboarding_completed: true,
            created_at: new Date().toISOString(),
          };
          setProfile(defaultProfile);
          setUser({ id: defaultProfile.id, email: defaultProfile.email });
          localStorage.setItem('peermock_profile', JSON.stringify(defaultProfile));
        }
      } catch {}
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        syncAndFetchProfile(session.user);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      if (session?.user) {
        setUser(session.user);
        await syncAndFetchProfile(session.user);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    let profileChannel: any = null;
    if (isSupabaseConfigured) {
      try {
        const channelName = `profile-sync-${Math.random().toString(36).substring(2, 9)}`;
        profileChannel = supabase
          .channel(channelName)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'profiles' },
            (payload) => {
              const updated = payload.new as Profile;
              if (updated && updated.id) {
                setProfile((prev) => {
                  if (prev && prev.id === updated.id) {
                    return { ...prev, ...updated };
                  }
                  return prev;
                });
              }
            }
          )
          .subscribe();
      } catch (err) {
        console.warn('Realtime profile sync registration warning:', err);
      }
    }

    return () => {
      subscription.unsubscribe();
      if (profileChannel) {
        supabase.removeChannel(profileChannel);
      }
    };
  }, []);

  const syncAndFetchProfile = async (authUser: any) => {
    try {
      // 1. Try to fetch existing profile
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (data) {
        const enriched: Profile = {
          ...data,
          email: data.email || authUser.email,
        };
        setProfile(enriched);

        if (!data.email && authUser.email) {
          supabase
            .from('profiles')
            .update({ email: authUser.email })
            .eq('id', authUser.id)
            .then(() => {});
        }
        return;
      }

      // 2. If no profile exists, upsert one immediately using auth user metadata
      const fallbackProfile: Profile = {
        id: authUser.id,
        email: authUser.email,
        full_name:
          authUser.user_metadata?.full_name ||
          authUser.user_metadata?.name ||
          authUser.email?.split('@')[0] ||
          'Peer Member',
        avatar_url:
          authUser.user_metadata?.avatar_url ||
          authUser.user_metadata?.picture ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
        headline: 'Software Engineer',
        primary_domain: 'Fullstack Engineering',
        skills_tags: [],
        years_of_experience: 'Mid (3-5y)',
        reliability_score: 100,
        total_sessions_completed: 0,
        no_show_count: 0,
        late_cancel_count: 0,
        given_mocks_count: 0,
        taken_mocks_count: 0,
        karma_score: 300,
        onboarding_completed: false,
        created_at: new Date().toISOString(),
      };

      setProfile(fallbackProfile);

      // Persist to database
      await supabase.from('profiles').upsert(fallbackProfile);
    } catch (err) {
      console.error('Error syncing profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured) return;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
  };

  const signOut = async () => {
    if (!isSupabaseConfigured) return;
    await supabase.auth.signOut();
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    const targetId = profile?.id || user?.id;
    if (!targetId) {
      throw new Error('Cannot update profile: No active user authenticated');
    }

    // Optimistic update
    setProfile((prev) => (prev ? { ...prev, ...updates } : null));

    if (!isSupabaseConfigured) {
      if (profile) {
        const merged = { ...profile, ...updates };
        localStorage.setItem('peermock_profile', JSON.stringify(merged));
      }
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', targetId);

    if (error) {
      console.error('Error updating profile in Supabase:', error);
      throw error;
    }
  };

  const refetchProfile = async () => {
    const targetId = user?.id || profile?.id;
    if (!targetId || !isSupabaseConfigured) return;
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetId)
        .maybeSingle();
      if (data) {
        setProfile((prev) => ({
          ...prev,
          ...data,
          email: data.email || user?.email || prev?.email,
        }));
      }
    } catch (err) {
      console.error('Error refetching profile:', err);
    }
  };

  return {
    user,
    profile,
    loading,
    signInWithGoogle,
    signOut,
    updateProfile,
    refetchProfile,
  };
}
