export function requireEnv(name: 'VITE_SUPABASE_URL' | 'VITE_SUPABASE_ANON_KEY'): string {
  const value = import.meta.env[name];
  if (!value) throw new Error(`${name} wajib diisi di .env`);
  if (name === 'VITE_SUPABASE_ANON_KEY' && /service_role/i.test(value)) throw new Error('Service-role key tidak boleh dipakai di frontend');
  return value;
}
