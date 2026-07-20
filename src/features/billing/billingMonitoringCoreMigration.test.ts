import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  'supabase/migrations/20260719190000_add_billing_monitoring_core_rpcs.sql',
  'utf8',
);

describe('billing monitoring core migration', () => {
  it('provides secure create, update, and delete RPCs', () => {
    expect(migration).toContain('create or replace function public.create_spk_billing');
    expect(migration).toContain('create or replace function public.update_spk_billing');
    expect(migration).toContain('create or replace function public.delete_spk_billing');
    expect(migration.match(/if not public\.current_user_admin\(\)/g)).toHaveLength(3);
    expect(migration).toContain("set search_path = ''");
  });

  it('prevents direct browser mutations and records activity snapshots', () => {
    expect(migration).toContain('revoke insert, update, delete on public.spk_billings from authenticated');
    expect(migration).toContain('revoke insert on public.billing_activity_log from authenticated');
    expect(migration).toContain("'created'");
    expect(migration).toContain("'updated'");
    expect(migration).toContain('to_jsonb(v_existing)');
    expect(migration).toContain('to_jsonb(v_updated)');
  });
});
