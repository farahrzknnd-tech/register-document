import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { requireEnv } from './env';

export const supabase = createClient<Database>(
  requireEnv('VITE_SUPABASE_URL'),
  requireEnv('VITE_SUPABASE_ANON_KEY'),
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } },
);
