import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const app = readFileSync('src/App.tsx', 'utf8');
const layout = readFileSync('src/components/Layout.tsx', 'utf8');
const navigation = readFileSync('src/lib/pageNavigation.ts', 'utf8');
const page = readFileSync('src/features/billing/pages/BillingLegacyImport.tsx', 'utf8');
const migration = readFileSync('supabase/migrations/20260720150000_add_legacy_billing_import_and_hardening.sql', 'utf8');

describe('legacy billing import integration', () => {
  it('adds an admin-only refresh-safe import page', () => {
    expect(navigation).toContain("'billingImport'");
    expect(layout).toContain("id: 'billingImport'");
    expect(layout).toContain('adminOnly: true');
    expect(app).toContain("page === 'billingImport'");
    expect(page).toContain('Validasi Import');
    expect(page).toContain('Import Data Monitoring Legacy');
  });

  it('uses a dry-run and additive secure database import boundary', () => {
    expect(migration).toContain('p_dry_run boolean default true');
    expect(migration).toContain('if not public.current_user_admin()');
    expect(migration).toContain('SPK %s sudah ada dan akan dilewati');
    expect(migration).not.toContain('truncate table');
    expect(migration).not.toContain('delete from public.spk_billings');
  });
});
