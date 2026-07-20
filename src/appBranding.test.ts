import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const index = readFileSync('index.html', 'utf8');
const layout = readFileSync('src/components/Layout.tsx', 'utf8');
const login = readFileSync('src/pages/Login.tsx', 'utf8');
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { name: string };

describe('Admin Management System branding', () => {
  it('uses the new application name across primary user-facing surfaces', () => {
    expect(index).toContain('<title>Admin Management System</title>');
    expect(layout).toContain('Admin Management System');
    expect(login).toContain('Admin Management System');
    expect(packageJson.name).toBe('admin-management-system');
  });

  it('removes Bolt and Vite starter metadata from the HTML shell', () => {
    expect(index).not.toContain('bolt.new');
    expect(index).not.toContain('vite.svg');
  });
});
