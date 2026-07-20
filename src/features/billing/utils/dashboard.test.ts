import { describe, expect, it } from 'vitest';
import type { SpkBillingListItem } from '../types';
import {
  buildBillingAttentionItems,
  buildProjectBreakdown,
  buildStatusBreakdown,
  calculateBillingDashboardStats,
  filterBillingDashboardItems,
  formatRupiahCompact,
} from './dashboard';

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
    work_location: null,
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

describe('billing dashboard utilities', () => {
  it('filters project, cluster, contractor, and status independently', () => {
    const items = [billing(), billing({ id: 'billing-2', project_id: null, cluster_id: null })];
    expect(filterBillingDashboardItems(items, {
      projectId: 'project-a',
      clusterId: '',
      contractorId: '',
      statusId: '',
    })).toHaveLength(1);
    expect(filterBillingDashboardItems(items, {
      projectId: '',
      clusterId: '',
      contractorId: '',
      statusId: '',
    })).toHaveLength(2);
  });

  it('calculates financial KPI totals and overdue count', () => {
    const stats = calculateBillingDashboardStats([
      billing({ work_finish_date: '2026-07-01' }),
      billing({
        id: 'billing-2',
        contractor_id: 'contractor-b',
        contractor_name_snapshot: 'PT Beta',
        contract_value: 2_000_000,
        financial: {
          billing_id: 'billing-2',
          contract_value: 2_000_000,
          total_planned: 2_000_000,
          total_billed: 1_000_000,
          total_paid: 1_000_000,
          remaining_contract: 1_000_000,
          billing_percentage: 50,
          payment_percentage: 100,
        },
      }),
    ], '2026-07-20');

    expect(stats.totalBillings).toBe(2);
    expect(stats.totalContractors).toBe(2);
    expect(stats.totalContractValue).toBe(3_000_000);
    expect(stats.totalBilled).toBe(1_600_000);
    expect(stats.totalPaid).toBe(1_200_000);
    expect(stats.outstandingPayment).toBe(400_000);
    expect(stats.overdueCount).toBe(1);
  });

  it('builds sorted project and status breakdowns', () => {
    const items = [
      billing(),
      billing({
        id: 'billing-2',
        project_id: null,
        project: null,
        billing_status_id: 'status-completed',
        status: {
          id: 'status-completed',
          code: 'completed',
          name: 'Completed',
          color_key: 'green',
          sort_order: 50,
          terminal: true,
          active: true,
        },
        financial: {
          billing_id: 'billing-2',
          contract_value: 1_000_000,
          total_planned: 1_000_000,
          total_billed: 900_000,
          total_paid: 900_000,
          remaining_contract: 100_000,
          billing_percentage: 90,
          payment_percentage: 100,
        },
      }),
    ];

    expect(buildProjectBreakdown(items)[0].name).toBe('Tanpa Project');
    expect(buildStatusBreakdown(items).map((item) => item.name)).toContain('Completed');
  });

  it('prioritizes overdue and outstanding billing attention items', () => {
    const items = buildBillingAttentionItems([
      billing({ work_finish_date: '2026-07-01' }),
      billing({ id: 'billing-2', work_finish_date: '2026-08-30' }),
    ], new Date('2026-07-20T00:00:00Z'));

    expect(items[0].kind).toBe('overdue');
    expect(items[1].kind).toBe('outstanding');
  });

  it('formats compact rupiah values', () => {
    expect(formatRupiahCompact(1_500_000_000)).toBe('Rp 1.5 M');
    expect(formatRupiahCompact(250_000_000)).toBe('Rp 250.0 jt');
  });
});
