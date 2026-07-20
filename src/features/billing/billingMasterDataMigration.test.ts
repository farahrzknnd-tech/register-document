import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  'supabase/migrations/20260719173000_add_billing_master_data_rpcs.sql',
  'utf8',
);

describe('billing master data migration', () => {
  it('provides an atomic admin-only termin template save function', () => {
    expect(migration).toContain('create or replace function public.save_billing_termin_template');
    expect(migration).toContain('if not public.current_user_admin()');
    expect(migration).toContain('delete from public.billing_termin_template_items');
    expect(migration).toContain('insert into public.billing_termin_template_items');
    expect(migration).toContain('set search_path =');
  });

  it('keeps browser execution restricted to authenticated users', () => {
    expect(migration).toContain('from public, anon');
    expect(migration).toContain('to authenticated');
  });
});
