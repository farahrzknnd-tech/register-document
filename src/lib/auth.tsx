import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { mapAppError } from './errors';
import { AuthContext, type AuthContextValue, type Profile } from './authContext';

async function loadProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('app_users')
    .select('user_id,email,role,active')
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  if (!data.active) throw new Error('Account inactive');
  if (data.role !== 'admin' && data.role !== 'viewer') {
    throw new Error('Unsupported application role');
  }
  return { ...data, role: data.role };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function sync(nextSession: Session | null) {
      setSession(nextSession);
      setProfile(null);
      setError(null);

      if (!nextSession?.user) return;

      try {
        const nextProfile = await loadProfile(nextSession.user.id);
        if (alive) setProfile(nextProfile);
      } catch (syncError) {
        if (alive) setError(mapAppError(syncError));
      }
    }

    supabase.auth.getSession()
      .then(({ data }) => sync(data.session))
      .catch((sessionError) => {
        if (alive) setError(mapAppError(sessionError));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void sync(nextSession);
    });

    return () => {
      alive = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    user: session?.user ?? null,
    profile,
    role: profile?.role ?? null,
    isAdmin: profile?.role === 'admin',
    loading,
    error,
    signIn: async (email, password) => {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
    },
    signOut: async () => {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      setSession(null);
      setProfile(null);
      setError(null);
    },
  }), [error, loading, profile, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
