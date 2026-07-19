import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const migrationPath =
  'supabase/migrations/20260719160000_add_billing_monitoring_foundation.sql';
const migration = readFileSync(migrationPath, 'utf8');

describe('billing monitoring database foundation', () => {
  it('creates normalized billing tables without legacy duplicates', () => {
    for (const table of [
      'contractors',
      'billing_statuses',
      'billing_stage_definitions',
      'billing_termin_templates',
      'billing_termin_template_items',
      'spk_billings',
      'billing_stage_progress',
      'billing_termins',
      'billing_activity_log',
    ]) {
      expect(migration).toContain(`create table public.${table}`);
    }

    expect(migration).not.toContain('create table public.master_projects');
    expect(migration).not.toContain('create table public.spk_records');
    expect(migration).not.toContain('project_cluster text');
  });

  it('keeps anonymous access disabled and follows host RLS helpers', () => {
    expect(migration).toContain('alter table public.spk_billings enable row level security');
    expect(migration).toContain('using (public.current_user_active())');
    expect(migration).toContain('with check (public.current_user_admin())');
    expect(migration).toContain('revoke all on public.spk_billings from public, anon');
    expect(migration).not.toMatch(/to anon, authenticated/i);
  });

  it('uses derived financial totals and normalized stage and termin records', () => {
    expect(migration).toContain('create view public.spk_billing_financial_summary');
    expect(migration).toContain('create table public.billing_stage_progress');
    expect(migration).toContain('create table public.billing_termins');
    expect(migration).toContain('Billing termin percentage exceeds 100 percent');
  });
});
