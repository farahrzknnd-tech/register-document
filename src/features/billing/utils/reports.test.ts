import { describe, expect, it } from 'vitest';
import type { BillingTermin, SpkBillingListItem } from '../types';
import {
  buildBillingReportRows,
  buildBillingTerminReportRows,
  calculateBillingReportSummary,
  filterBillingReportItems,
  initialBillingReportFilters,
} from './reports';

function billing(overrides: Partial<SpkBillingListItem> = {}): SpkBillingListItem {
  const base: SpkBillingListItem = {
    id: 'billing-1',
    surat_penunjukan_id: null,
    project_id: 'project-a',
    cluster_id: 'cluster-a',
    contractor_id: 'contractor-a',
    termin_template_id: null,
    billing_status_id: 'status-open',
    spk_number: 'SPK-001',
    spk_date: '2026-07-01',
    contractor_name_snapshot: 'PT Alpha',
    work_name: 'Pekerjaan Alpha',
    work_location: 'Jakarta',
    work_start_date: '2026-07-01',
    work_finish_date: '2026-07-31',
    kickoff_date: null,
    stage_weight: null,
    contract_value: 1_000_000,
    document_drive_url: null,
    notes: null,
    created_by: null,
    updated_by: null,
    created_at: '2026-07-01T00:00:00Z',
    updated_at: '2026-07-02T00:00:00Z',
    project: { id: 'project-a', name: 'Project A', code: 'PA' },
    cluster: { id: 'cluster-a', name: 'Cluster A', code: 'CA' },
    contractor: { id: 'contractor-a', name: 'PT Alpha', code: 'ALP', active: true },
    status: {
      id: 'status-open',
      code: 'open',
      name: 'Open',
      color_key: 'blue',
      sort_order: 10,
      terminal: false,
      active: true,
    },
    surat_penunjukan: null,
    termin_template: null,
    financial: {
      billing_id: 'billing-1',
      contract_value: 1_000_000,
      total_planned: 1_000_000,
      total_billed: 600_000,
      total_paid: 200_000,
      remaining_contract: 400_000,
      billing_percentage: 60,
      payment_percentage: 33.33,
    },
    current_stage: {
      id: 'stage-bi',
      code: 'bi_review',
      name: 'BI Review',
      sort_order: 20,
      status: 'in_progress',
      completed_at: null,
    },
  };

  return { ...base, ...overrides };
}

function termin(overrides: Partial<BillingTermin> = {}): BillingTermin {
  return {
    id: 'termin-1',
    billing_id: 'billing-1',
    template_item_id: null,
    sequence_no: 1,
    name: 'Termin 1',
    percentage: 50,
    planned_amount: 500_000,
    billed_amount: 400_000,
    paid_amount: 200_000,
    status: 'partially_paid',
    billed_date: '2026-07-10',
    paid_date: '2026-07-15',
    notes: null,
    created_by: null,
    updated_by: null,
    created_at: '2026-07-01T00:00:00Z',
    updated_at: '2026-07-15T00:00:00Z',
    ...overrides,
  };
}

describe('billing report utilities', () => {
  it('filters search, project, cluster, contractor, status, year, and dates independently', () => {
    const items = [
      billing(),
      billing({
        id: 'billing-2',
        spk_number: 'SPK-002',
        spk_date: '2025-12-01',
        project_id: null,
        project: null,
        cluster_id: 'cluster-b',
        cluster: { id: 'cluster-b', name: 'Cluster B', code: 'CB' },
      }),
    ];

    expect(filterBillingReportItems(items, { ...initialBillingReportFilters, projectId: 'project-a' })).toHaveLength(1);
    expect(filterBillingReportItems(items, { ...initialBillingReportFilters, clusterId: 'cluster-b' })).toHaveLength(1);
    expect(filterBillingReportItems(items, { ...initialBillingReportFilters, year: '2026' })).toHaveLength(1);
    expect(filterBillingReportItems(items, { ...initialBillingReportFilters, dateFrom: '2026-01-01' })).toHaveLength(1);
    expect(filterBillingReportItems(items, { ...initialBillingReportFilters, search: 'alpha' })).toHaveLength(2);
  });

  it('calculates financial summary without duplicate editable totals', () => {
    const summary = calculateBillingReportSummary([
      billing(),
      billing({
        id: 'billing-2',
        contract_value: 2_000_000,
        status: {
          id: 'status-completed', code: 'completed', name: 'Completed', color_key: 'green',
          sort_order: 50, terminal: true, active: true,
        },
        financial: {
          billing_id: 'billing-2',
          contract_value: 2_000_000,
          total_planned: 2_000_000,
          total_billed: 1_000_000,
          total_paid: 900_000,
          remaining_contract: 1_000_000,
          billing_percentage: 50,
          payment_percentage: 90,
        },
      }),
    ]);

    expect(summary.totalBillings).toBe(2);
    expect(summary.activeBillings).toBe(1);
    expect(summary.completedBillings).toBe(1);
    expect(summary.totalContractValue).toBe(3_000_000);
    expect(summary.totalBilled).toBe(1_600_000);
    expect(summary.totalPaid).toBe(1_100_000);
    expect(summary.outstandingPayment).toBe(500_000);
  });

  it('builds monitoring and termin rows only for filtered billings', () => {
    const items = [billing()];
    const reportRows = buildBillingReportRows(items);
    const terminRows = buildBillingTerminReportRows(items, [
      termin(),
      termin({ id: 'termin-2', billing_id: 'other-billing' }),
    ]);

    expect(reportRows[0].projectName).toBe('Project A');
    expect(reportRows[0].outstandingPayment).toBe(400_000);
    expect(terminRows).toHaveLength(1);
    expect(terminRows[0].terminName).toBe('Termin 1');
  });
});
