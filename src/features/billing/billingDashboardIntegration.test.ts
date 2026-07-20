import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const app = readFileSync('src/App.tsx', 'utf8');
const layout = readFileSync('src/components/Layout.tsx', 'utf8');
const navigation = readFileSync('src/lib/pageNavigation.ts', 'utf8');
const dashboard = readFileSync('src/features/billing/pages/BillingDashboard.tsx', 'utf8');

describe('billing dashboard integration', () => {
  it('adds a dedicated refresh-safe billing dashboard page', () => {
    expect(navigation).toContain("'billingDashboard'");
    expect(layout).toContain("id: 'billingDashboard'");
    expect(layout).toContain("label: 'Dashboard Tagihan'");
    expect(app).toContain("page === 'billingDashboard'");
    expect(app).toContain('<BillingDashboard');
  });

  it('opens monitoring detail and list from dashboard actions', () => {
    expect(dashboard).toContain('onOpenBilling(item.billing.id)');
    expect(dashboard).toContain('onOpenMonitoring');
    expect(dashboard).toContain('Lihat Monitoring');
  });

  it('provides financial KPI, breakdown, filter, and attention sections', () => {
    expect(dashboard).toContain('Progress Finansial');
    expect(dashboard).toContain('Nilai Tagihan per Project');
    expect(dashboard).toContain('Distribusi Status Billing');
    expect(dashboard).toContain('Posisi Tahapan Approval');
    expect(dashboard).toContain('Perlu Perhatian');
    expect(dashboard).toContain('Filter Dashboard');
  });
});
