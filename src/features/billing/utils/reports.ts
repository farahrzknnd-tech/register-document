import type {
  BillingReportFilters,
  BillingReportRow,
  BillingReportSummary,
  BillingTermin,
  BillingTerminReportRow,
  BillingTerminStatus,
  SpkBillingListItem,
} from '../types';

export const initialBillingReportFilters: BillingReportFilters = {
  search: '',
  projectId: '',
  clusterId: '',
  contractorId: '',
  statusId: '',
  year: '',
  dateFrom: '',
  dateTo: '',
};

export const BILLING_TERMIN_STATUS_LABELS: Record<BillingTerminStatus, string> = {
  not_billed: 'Belum Ditagihkan',
  in_process: 'Dalam Proses',
  billed: 'Sudah Ditagihkan',
  partially_paid: 'Dibayar Sebagian',
  paid: 'Lunas',
  cancelled: 'Dibatalkan',
};

function safePercentage(value: number, total: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(total) || total <= 0) return 0;
  return Math.round((value / total) * 10_000) / 100;
}

function billingReferenceDate(item: SpkBillingListItem): string {
  return item.spk_date ?? item.created_at.slice(0, 10);
}

export function filterBillingReportItems(
  items: SpkBillingListItem[],
  filters: BillingReportFilters,
): SpkBillingListItem[] {
  const query = filters.search.trim().toLowerCase();

  return items.filter((item) => {
    const referenceDate = billingReferenceDate(item);
    const matchesSearch = !query || [
      item.spk_number,
      item.contractor_name_snapshot,
      item.work_name,
      item.work_location ?? '',
      item.project?.name ?? '',
      item.cluster?.name ?? '',
      item.status.name,
      item.current_stage?.name ?? '',
    ].some((value) => value.toLowerCase().includes(query));

    return (
      matchesSearch &&
      (!filters.projectId || item.project_id === filters.projectId) &&
      (!filters.clusterId || item.cluster_id === filters.clusterId) &&
      (!filters.contractorId || (item.contractor_id ?? `snapshot:${item.contractor_name_snapshot.trim().toLowerCase()}`) === filters.contractorId) &&
      (!filters.statusId || item.billing_status_id === filters.statusId) &&
      (!filters.year || referenceDate.slice(0, 4) === filters.year) &&
      (!filters.dateFrom || referenceDate >= filters.dateFrom) &&
      (!filters.dateTo || referenceDate <= filters.dateTo)
    );
  }).sort((a, b) => billingReferenceDate(b).localeCompare(billingReferenceDate(a)) || a.spk_number.localeCompare(b.spk_number, 'id'));
}

export function calculateBillingReportSummary(items: SpkBillingListItem[]): BillingReportSummary {
  const totals = items.reduce(
    (result, item) => ({
      contractValue: result.contractValue + item.contract_value,
      planned: result.planned + item.financial.total_planned,
      billed: result.billed + item.financial.total_billed,
      paid: result.paid + item.financial.total_paid,
    }),
    { contractValue: 0, planned: 0, billed: 0, paid: 0 },
  );

  return {
    totalBillings: items.length,
    activeBillings: items.filter((item) => !item.status.terminal).length,
    completedBillings: items.filter((item) => item.status.terminal).length,
    totalContractValue: totals.contractValue,
    totalPlanned: totals.planned,
    totalBilled: totals.billed,
    totalPaid: totals.paid,
    remainingUnbilled: Math.max(totals.contractValue - totals.billed, 0),
    outstandingPayment: Math.max(totals.billed - totals.paid, 0),
    billingPercentage: safePercentage(totals.billed, totals.contractValue),
    paymentPercentage: safePercentage(totals.paid, totals.billed),
  };
}

export function buildBillingReportRows(items: SpkBillingListItem[]): BillingReportRow[] {
  return items.map((item) => ({
    billingId: item.id,
    spkNumber: item.spk_number,
    spkDate: item.spk_date,
    contractorName: item.contractor_name_snapshot,
    workName: item.work_name,
    workLocation: item.work_location,
    projectName: item.project?.name ?? 'Tanpa Project',
    clusterName: item.cluster?.name ?? 'Tanpa Cluster',
    statusName: item.status.name,
    currentStageName: item.current_stage?.name ?? '-',
    workStartDate: item.work_start_date,
    workFinishDate: item.work_finish_date,
    contractValue: item.contract_value,
    plannedAmount: item.financial.total_planned,
    billedAmount: item.financial.total_billed,
    paidAmount: item.financial.total_paid,
    remainingUnbilled: Math.max(item.contract_value - item.financial.total_billed, 0),
    outstandingPayment: Math.max(item.financial.total_billed - item.financial.total_paid, 0),
    billingPercentage: item.financial.billing_percentage,
    paymentPercentage: item.financial.payment_percentage,
    documentDriveUrl: item.document_drive_url,
  }));
}

export function buildBillingTerminReportRows(
  items: SpkBillingListItem[],
  termins: BillingTermin[],
): BillingTerminReportRow[] {
  const billingById = new Map(items.map((item) => [item.id, item]));

  return termins
    .filter((termin) => billingById.has(termin.billing_id))
    .map((termin) => {
      const billing = billingById.get(termin.billing_id)!;
      return {
        billingId: billing.id,
        spkNumber: billing.spk_number,
        contractorName: billing.contractor_name_snapshot,
        projectName: billing.project?.name ?? 'Tanpa Project',
        clusterName: billing.cluster?.name ?? 'Tanpa Cluster',
        sequenceNo: termin.sequence_no,
        terminName: termin.name,
        percentage: termin.percentage,
        plannedAmount: termin.planned_amount,
        billedAmount: termin.billed_amount,
        paidAmount: termin.paid_amount,
        status: termin.status,
        billedDate: termin.billed_date,
        paidDate: termin.paid_date,
        notes: termin.notes,
      };
    })
    .sort((a, b) => a.spkNumber.localeCompare(b.spkNumber, 'id') || a.sequenceNo - b.sequenceNo);
}

export function extractBillingReportYears(items: SpkBillingListItem[]): string[] {
  return [...new Set(items.map((item) => billingReferenceDate(item).slice(0, 4)).filter(Boolean))]
    .sort((a, b) => b.localeCompare(a));
}

export function hasActiveBillingReportFilters(filters: BillingReportFilters): boolean {
  return Object.values(filters).some(Boolean);
}
