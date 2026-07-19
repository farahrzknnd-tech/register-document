import { describe, expect, it, vi } from 'vitest';
import { requireEnv } from './env';

describe('environment validation', () => {
  it('fails when env missing', () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    expect(() => requireEnv('VITE_SUPABASE_URL')).toThrow(/wajib/);
    vi.unstubAllEnvs();
  });

  it('rejects service-role key in frontend', () => {
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'service_role.secret');
    expect(() => requireEnv('VITE_SUPABASE_ANON_KEY')).toThrow(/Service-role/);
    vi.unstubAllEnvs();
  });
});
