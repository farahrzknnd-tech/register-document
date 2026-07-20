import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const app = readFileSync('src/App.tsx', 'utf8');
const layout = readFileSync('src/components/Layout.tsx', 'utf8');
const navigation = readFileSync('src/lib/pageNavigation.ts', 'utf8');
const reports = readFileSync('src/features/billing/pages/BillingReports.tsx', 'utf8');
const exports = readFileSync('src/features/billing/utils/reportExport.ts', 'utf8');

describe('billing reports integration', () => {
  it('adds a dedicated refresh-safe billing reports page', () => {
    expect(navigation).toContain("'billingReports'");
    expect(layout).toContain("id: 'billingReports'");
    expect(layout).toContain("label: 'Laporan Tagihan'");
    expect(app).toContain("page === 'billingReports'");
    expect(app).toContain('<BillingReports');
  });

  it('provides monitoring and termin reports with independent filters', () => {
    expect(reports).toContain('Semua Project');
    expect(reports).toContain('Semua Cluster');
    expect(reports).toContain('Detail Monitoring');
    expect(reports).toContain('Detail Termin');
    expect(reports).toContain('Export Excel');
    expect(reports).toContain('Export PDF');
    expect(reports).toContain('Print');
  });

  it('lazy-loads heavy export libraries', () => {
    expect(exports).toContain("await import('xlsx')");
    expect(exports).toContain("import('jspdf')");
    expect(exports).toContain("import('jspdf-autotable')");
  });
});
