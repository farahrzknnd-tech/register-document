import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const app = readFileSync('src/App.tsx', 'utf8');
const auth = readFileSync('src/lib/auth.tsx', 'utf8');
const toast = readFileSync('src/components/Toast.tsx', 'utf8');
const gitignore = readFileSync('.gitignore', 'utf8');

describe('final integration hardening', () => {
  it('surfaces initial load failures with retry and logout recovery', () => {
    expect(app).toContain('Gagal memuat data aplikasi');
    expect(app).toContain('retryLoadAll');
    expect(app).toContain('AppErrorState');
    expect(app).not.toContain("console.error('Failed to load data:");
  });

  it('keeps provider files focused on component exports for fast refresh', () => {
    expect(auth).not.toContain('export function useAuth');
    expect(toast).not.toContain('export function useToast');
  });

  it('ignores Supabase local link state', () => {
    expect(gitignore).toContain('supabase/.temp/');
  });
});
