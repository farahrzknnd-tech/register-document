import { createContext, useContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import type { UserRole } from './types';

export type Profile = {
  user_id: string;
  email: string | null;
  role: UserRole;
  active: boolean;
};

export type AuthContextValue = {
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

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
