import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QueryBuilder = any;
const authDb = supabase as never as { from: (table: string) => QueryBuilder };
import type { UserRole } from './types';

type Profile = { user_id: string; email: string | null; role: UserRole; active: boolean };
type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: UserRole | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function loadProfile(userId: string): Promise<Profile> {
  const { data, error } = await authDb.from('app_users').select('user_id,email,role,active').eq('user_id', userId).single();
  if (error) throw error;
  if (!data.active) throw new Error('Account inactive');
  return data;
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
      try { if (alive) setProfile(await loadProfile(nextSession.user.id)); }
      catch (err) { if (alive) setError(err instanceof Error ? err.message : String(err)); }
    }
    supabase.auth.getSession().then(({ data }) => sync(data.session).finally(() => alive && setLoading(false)));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => { void sync(nextSession); });
    return () => { alive = false; sub.subscription.unsubscribe(); };
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
    signOut: async () => { await supabase.auth.signOut(); setSession(null); setProfile(null); },
  }), [error, loading, profile, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
