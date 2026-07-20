import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const foundation = readFileSync(
  'supabase/migrations/20260719160000_add_billing_monitoring_foundation.sql',
  'utf8',
);
const registerPage = readFileSync('src/pages/RegisterSuratPenunjukan.tsx', 'utf8');
const billingPage = readFileSync('src/features/billing/pages/BillingMonitoring.tsx', 'utf8');

describe('Surat Penunjukan billing integration wiring', () => {
  it('keeps database-level duplicate prevention for one billing per Surat Penunjukan', () => {
    expect(foundation).toContain('create unique index spk_billings_surat_penunjukan_unique');
    expect(foundation).toContain('where surat_penunjukan_id is not null');
  });

  it('exposes create and view monitoring actions from Surat Penunjukan detail', () => {
    expect(registerPage).toContain('Buat Monitoring Tagihan');
    expect(registerPage).toContain('Lihat Monitoring Tagihan');
    expect(registerPage).toContain('fetchBillingLinkForSuratPenunjukan');
  });

  it('opens prefilled billing creation and existing billing detail from navigation intents', () => {
    expect(billingPage).toContain('buildBillingInputFromSuratPenunjukan');
    expect(billingPage).toContain('initialCreateFrom');
    expect(billingPage).toContain('initialDetailBillingId');
  });
});
