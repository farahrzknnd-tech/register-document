import { describe, expect, it } from 'vitest';
import type { BillingFilterState, SpkBillingInput, SpkBillingListItem } from '../types';
import {
  calculateBillingTotals,
  filterSpkBillings,
  formatRupiah,
  validateSpkBillingInput,
} from './monitoring';

const input: SpkBillingInput = {
  surat_penunjukan_id: null,
  project_id: null,
  cluster_id: null,
  contractor_id: null,
  termin_template_id: null,
  billing_status_id: 'status-1',
  spk_number: 'SPK-001',
  spk_date: '2026-07-19',
  contractor_name_snapshot: 'Kontraktor A',
  work_name: 'Pekerjaan A',
  work_location: '',
  work_start_date: '2026-07-19',
  work_finish_date: '2026-07-20',
  kickoff_date: null,
  stage_weight: '',
  contract_value: 1000000,
  document_drive_url: '',
  notes: '',
};

function item(overrides: Partial<SpkBillingListItem> = {}): SpkBillingListItem {
  return {
    id: 'billing-1',
    surat_penunjukan_id: null,
    project_id: 'project-1',
    cluster_id: 'cluster-1',
    contractor_id: 'contractor-1',
    termin_template_id: null,
    billing_status_id: 'status-1',
    spk_number: 'SPK-001',
    spk_date: '2026-07-19',
    contractor_name_snapshot: 'Kontraktor A',
    work_name: 'Pekerjaan A',
    work_location: 'Lokasi A',
    work_start_date: null,
    work_finish_date: null,
    kickoff_date: null,
    stage_weight: null,
    contract_value: 1000000,
    document_drive_url: null,
    notes: null,
    created_by: null,
    updated_by: null,
    created_at: '2026-07-19T00:00:00Z',
    updated_at: '2026-07-19T00:00:00Z',
    project: { id: 'project-1', name: 'Project A', code: null },
    cluster: { id: 'cluster-1', name: 'Cluster A', code: null },
    contractor: { id: 'contractor-1', name: 'Kontraktor A', code: null, active: true },
    status: { id: 'status-1', code: 'open', name: 'Open', color_key: 'gray', sort_order: 10, terminal: false, active: true },
    surat_penunjukan: null,
    termin_template: null,
    financial: {
      billing_id: 'billing-1',
      contract_value: 1000000,
      total_planned: 1000000,
      total_billed: 400000,
      total_paid: 200000,
      remaining_contract: 600000,
      billing_percentage: 40,
      payment_percentage: 50,
    },
    current_stage: null,
    ...overrides,
  };
}

const filters: BillingFilterState = {
  search: '',
  statusId: '',
  projectId: '',
  clusterId: '',
  contractorId: '',
  sort: 'newest',
};

describe('billing monitoring utilities', () => {
  it('validates required core fields and date order', () => {
    expect(validateSpkBillingInput(input)).toEqual({});
    expect(validateSpkBillingInput({
      ...input,
      spk_number: '',
      contractor_name_snapshot: '',
      work_name: '',
      contract_value: -1,
      work_finish_date: '2026-07-18',
    })).toMatchObject({
      spk_number: expect.any(String),
      contractor_name_snapshot: expect.any(String),
      work_name: expect.any(String),
      contract_value: expect.any(String),
      work_finish_date: expect.any(String),
    });
  });

  it('filters independently by project, cluster, status, and text', () => {
    const rows = [item(), item({ id: 'billing-2', spk_number: 'SPK-002', project_id: 'project-2', cluster_id: null, project: { id: 'project-2', name: 'Project B', code: null }, cluster: null })];
    expect(filterSpkBillings(rows, { ...filters, projectId: 'project-1' })).toHaveLength(1);
    expect(filterSpkBillings(rows, { ...filters, clusterId: 'cluster-1' })).toHaveLength(1);
    expect(filterSpkBillings(rows, { ...filters, search: 'project b' })[0].id).toBe('billing-2');
  });

  it('calculates filtered totals and formats Rupiah', () => {
    expect(calculateBillingTotals([item(), item({ id: 'billing-2' })])).toEqual({
      contractValue: 2000000,
      totalBilled: 800000,
      totalPaid: 400000,
    });
    expect(formatRupiah(1000000)).toContain('1.000.000');
  });
});
