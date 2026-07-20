import type {
  BillingCurrentStage,
  BillingFilterState,
  BillingStageProgressDetail,
  SpkBillingInput,
  SpkBillingListItem,
} from '../types';

export interface BillingInputErrors {
  spk_number?: string;
  billing_status_id?: string;
  contractor_name_snapshot?: string;
  work_name?: string;
  contract_value?: string;
  work_finish_date?: string;
  document_drive_url?: string;
}

export function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

export function normalizeNullable(value: string | null | undefined): string | null {
  const normalized = value?.trim() ?? '';
  return normalized ? normalized : null;
}

export function validateSpkBillingInput(input: SpkBillingInput): BillingInputErrors {
  const errors: BillingInputErrors = {};

  if (!input.spk_number.trim()) errors.spk_number = 'Nomor SPK wajib diisi.';
  if (!input.billing_status_id) errors.billing_status_id = 'Status billing wajib dipilih.';
  if (!input.contractor_name_snapshot.trim()) {
    errors.contractor_name_snapshot = 'Nama kontraktor wajib diisi.';
  }
  if (!input.work_name.trim()) errors.work_name = 'Nama pekerjaan wajib diisi.';
  if (!Number.isFinite(input.contract_value) || input.contract_value < 0) {
    errors.contract_value = 'Nilai kontrak tidak boleh negatif.';
  }
  if (
    input.work_start_date &&
    input.work_finish_date &&
    input.work_finish_date < input.work_start_date
  ) {
    errors.work_finish_date = 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai.';
  }
  if (
    input.document_drive_url.trim() &&
    !/^https?:\/\//i.test(input.document_drive_url.trim())
  ) {
    errors.document_drive_url = 'Link dokumen harus diawali http:// atau https://.';
  }

  return errors;
}

export function resolveCurrentBillingStage(
  stages: BillingStageProgressDetail[],
): BillingCurrentStage | null {
  if (stages.length === 0) return null;

  const ordered = [...stages].sort((a, b) => a.stage.sort_order - b.stage.sort_order);
  const inProgress = ordered.find((item) => item.status === 'in_progress');
  const notStarted = ordered.find((item) => item.status === 'not_started');
  const selected = inProgress ?? notStarted ?? ordered[ordered.length - 1];

  if (!selected) return null;

  return {
    id: selected.stage.id,
    code: selected.stage.code,
    name: selected.stage.name,
    sort_order: selected.stage.sort_order,
    status: selected.status,
    completed_at: selected.completed_at,
  };
}

export function filterSpkBillings(
  items: SpkBillingListItem[],
  filters: BillingFilterState,
): SpkBillingListItem[] {
  const query = filters.search.trim().toLowerCase();

  const filtered = items.filter((item) => {
    const matchesSearch =
      !query ||
      [
        item.spk_number,
        item.contractor_name_snapshot,
        item.work_name,
        item.work_location ?? '',
        item.project?.name ?? '',
        item.cluster?.name ?? '',
      ].some((value) => value.toLowerCase().includes(query));

    return (
      matchesSearch &&
      (!filters.statusId || item.billing_status_id === filters.statusId) &&
      (!filters.projectId || item.project_id === filters.projectId) &&
      (!filters.clusterId || item.cluster_id === filters.clusterId) &&
      (!filters.contractorId || item.contractor_id === filters.contractorId)
    );
  });

  return [...filtered].sort((a, b) => {
    if (filters.sort === 'oldest') return a.created_at.localeCompare(b.created_at);
    if (filters.sort === 'spk_asc') return a.spk_number.localeCompare(b.spk_number, 'id');
    if (filters.sort === 'contract_desc') return b.contract_value - a.contract_value;
    return b.created_at.localeCompare(a.created_at);
  });
}

export function calculateBillingTotals(items: SpkBillingListItem[]) {
  return items.reduce(
    (totals, item) => ({
      contractValue: totals.contractValue + item.contract_value,
      totalBilled: totals.totalBilled + item.financial.total_billed,
      totalPaid: totals.totalPaid + item.financial.total_paid,
    }),
    { contractValue: 0, totalBilled: 0, totalPaid: 0 },
  );
}
