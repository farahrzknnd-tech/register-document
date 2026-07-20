import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  'supabase/migrations/20260720090000_add_billing_approval_and_termin_management.sql',
  'utf8',
);
const detail = readFileSync('src/features/billing/components/BillingDetail.tsx', 'utf8');


describe('billing approval and termin management', () => {
  it('provides secure stage and termin RPC mutation boundaries', () => {
    expect(migration).toContain('create function public.update_billing_stage_progress');
    expect(migration).toContain('create function public.sync_billing_stage_progress');
    expect(migration).toContain('create function public.save_billing_termin');
    expect(migration).toContain('create function public.delete_billing_termin');
    expect(migration.match(/if not public\.current_user_admin\(\)/g)).toHaveLength(4);
    expect(migration).toContain("set search_path = ''");
  });

  it('blocks direct browser writes and records stage/termin activities', () => {
    expect(migration).toContain('revoke insert, update, delete on public.billing_stage_progress from authenticated');
    expect(migration).toContain('revoke insert, update, delete on public.billing_termins from authenticated');
    expect(migration).toContain("'stage_updated'");
    expect(migration).toContain("'termin_created'");
    expect(migration).toContain("'termin_updated'");
    expect(migration).toContain("'termin_deleted'");
  });

  it('makes approval and termin controls available only to admins in billing detail', () => {
    expect(detail).toContain("role === 'admin'");
    expect(detail).toContain('Sinkronkan Tahapan');
    expect(detail).toContain('Tambah Termin');
    expect(detail).toContain('BillingStageEditor');
    expect(detail).toContain('BillingTerminEditor');
  });
});
