import type { SpkBillingListItem } from '../types';

export interface BillingDashboardFilters {
  projectId: string;
  clusterId: string;
  contractorId: string;
  statusId: string;
}

export interface BillingDashboardStats {
  totalBillings: number;
  totalContractors: number;
  totalContractValue: number;
  totalBilled: number;
  totalPaid: number;
  remainingUnbilled: number;
  outstandingPayment: number;
  billingPercentage: number;
  paymentPercentage: number;
  completedCount: number;
  overdueCount: number;
}

export interface BillingDashboardBreakdown {
  id: string;
  name: string;
  count: number;
  contractValue: number;
  billedValue: number;
  paidValue: number;
  percentage: number;
  colorKey?: string;
}

export type BillingAttentionKind = 'overdue' | 'outstanding' | 'unbilled' | 'upcoming';

export interface BillingAttentionItem {
  id: string;
  kind: BillingAttentionKind;
  title: string;
  message: string;
  billing: SpkBillingListItem;
  sortDate: string;
}

function safePercentage(value: number, total: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(total) || total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((value / total) * 10000) / 100));
}

export function formatRupiahCompact(value: number): string {
  const amount = Number.isFinite(value) ? value : 0;
  if (Math.abs(amount) >= 1_000_000_000_000) return `Rp ${(amount / 1_000_000_000_000).toFixed(1)} T`;
  if (Math.abs(amount) >= 1_000_000_000) return `Rp ${(amount / 1_000_000_000).toFixed(1)} M`;
  if (Math.abs(amount) >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1)} jt`;
  if (Math.abs(amount) >= 1_000) return `Rp ${(amount / 1_000).toFixed(1)} rb`;
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

export function filterBillingDashboardItems(
  items: SpkBillingListItem[],
  filters: BillingDashboardFilters,
): SpkBillingListItem[] {
  return items.filter((item) => (
    (!filters.projectId || item.project_id === filters.projectId) &&
    (!filters.clusterId || item.cluster_id === filters.clusterId) &&
    (!filters.contractorId || item.contractor_id === filters.contractorId) &&
    (!filters.statusId || item.billing_status_id === filters.statusId)
  ));
}

export function calculateBillingDashboardStats(
  items: SpkBillingListItem[],
  today = new Date().toISOString().slice(0, 10),
): BillingDashboardStats {
  const totals = items.reduce(
    (result, item) => ({
      contractValue: result.contractValue + item.contract_value,
      billed: result.billed + item.financial.total_billed,
      paid: result.paid + item.financial.total_paid,
    }),
    { contractValue: 0, billed: 0, paid: 0 },
  );

  const overdueCount = items.filter((item) => (
    Boolean(item.work_finish_date) &&
    item.work_finish_date! < today &&
    !item.status.terminal
  )).length;

  return {
    totalBillings: items.length,
    totalContractors: new Set(items.map((item) => item.contractor_id ?? item.contractor_name_snapshot)).size,
    totalContractValue: totals.contractValue,
    totalBilled: totals.billed,
    totalPaid: totals.paid,
    remainingUnbilled: Math.max(totals.contractValue - totals.billed, 0),
    outstandingPayment: Math.max(totals.billed - totals.paid, 0),
    billingPercentage: safePercentage(totals.billed, totals.contractValue),
    paymentPercentage: safePercentage(totals.paid, totals.billed),
    completedCount: items.filter((item) => item.status.terminal && item.status.code === 'completed').length,
    overdueCount,
  };
}

interface BreakdownKey {
  id: string;
  name: string;
  colorKey?: string;
}

function buildBreakdown(
  items: SpkBillingListItem[],
  resolveKey: (item: SpkBillingListItem) => BreakdownKey,
): BillingDashboardBreakdown[] {
  const groups = new Map<string, BillingDashboardBreakdown>();

  for (const item of items) {
    const key = resolveKey(item);
    const existing = groups.get(key.id) ?? {
      id: key.id,
      name: key.name,
      count: 0,
      contractValue: 0,
      billedValue: 0,
      paidValue: 0,
      percentage: 0,
      colorKey: key.colorKey,
    };

    existing.count += 1;
    existing.contractValue += item.contract_value;
    existing.billedValue += item.financial.total_billed;
    existing.paidValue += item.financial.total_paid;
    groups.set(key.id, existing);
  }

  const maxBilled = Math.max(0, ...[...groups.values()].map((item) => item.billedValue));

  return [...groups.values()]
    .map((item) => ({
      ...item,
      percentage: maxBilled > 0 ? safePercentage(item.billedValue, maxBilled) : 0,
    }))
    .sort((a, b) => b.billedValue - a.billedValue || b.count - a.count || a.name.localeCompare(b.name, 'id'));
}

export function buildProjectBreakdown(items: SpkBillingListItem[]): BillingDashboardBreakdown[] {
  return buildBreakdown(items, (item) => ({
    id: item.project_id ?? '__without_project__',
    name: item.project?.name ?? 'Tanpa Project',
  }));
}

export function buildClusterBreakdown(items: SpkBillingListItem[]): BillingDashboardBreakdown[] {
  return buildBreakdown(items, (item) => ({
    id: item.cluster_id ?? '__without_cluster__',
    name: item.cluster?.name ?? 'Tanpa Cluster',
  }));
}

export function buildStatusBreakdown(items: SpkBillingListItem[]): BillingDashboardBreakdown[] {
  return buildBreakdown(items, (item) => ({
    id: item.billing_status_id,
    name: item.status.name,
    colorKey: item.status.color_key,
  }));
}

export function buildStageBreakdown(items: SpkBillingListItem[]): BillingDashboardBreakdown[] {
  return buildBreakdown(items, (item) => ({
    id: item.current_stage?.id ?? '__without_stage__',
    name: item.current_stage?.name ?? 'Tahapan Tidak Tersedia',
  }));
}

function addDays(date: Date, days: number): string {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString().slice(0, 10);
}

export function buildBillingAttentionItems(
  items: SpkBillingListItem[],
  now = new Date(),
): BillingAttentionItem[] {
  const today = now.toISOString().slice(0, 10);
  const upcomingLimit = addDays(now, 30);
  const attention: BillingAttentionItem[] = [];

  for (const billing of items) {
    if (billing.work_finish_date && billing.work_finish_date < today && !billing.status.terminal) {
      attention.push({
        id: `${billing.id}-overdue`,
        kind: 'overdue',
        title: `${billing.spk_number} melewati tanggal selesai`,
        message: `Tanggal selesai ${billing.work_finish_date}. Status masih ${billing.status.name}.`,
        billing,
        sortDate: billing.work_finish_date,
      });
      continue;
    }

    if (billing.financial.total_billed > billing.financial.total_paid) {
      attention.push({
        id: `${billing.id}-outstanding`,
        kind: 'outstanding',
        title: `${billing.spk_number} masih memiliki tagihan belum dibayar`,
        message: `${formatRupiahCompact(billing.financial.total_billed - billing.financial.total_paid)} belum dibayar.`,
        billing,
        sortDate: billing.updated_at,
      });
      continue;
    }

    if (billing.contract_value > 0 && billing.financial.total_billed === 0 && !billing.status.terminal) {
      attention.push({
        id: `${billing.id}-unbilled`,
        kind: 'unbilled',
        title: `${billing.spk_number} belum memiliki realisasi tagihan`,
        message: `Nilai kontrak ${formatRupiahCompact(billing.contract_value)} belum ditagihkan.`,
        billing,
        sortDate: billing.created_at,
      });
      continue;
    }

    if (
      billing.work_finish_date &&
      billing.work_finish_date >= today &&
      billing.work_finish_date <= upcomingLimit &&
      !billing.status.terminal
    ) {
      attention.push({
        id: `${billing.id}-upcoming`,
        kind: 'upcoming',
        title: `${billing.spk_number} mendekati tanggal selesai`,
        message: `Pekerjaan dijadwalkan selesai ${billing.work_finish_date}.`,
        billing,
        sortDate: billing.work_finish_date,
      });
    }
  }

  const priority: Record<BillingAttentionKind, number> = {
    overdue: 0,
    outstanding: 1,
    unbilled: 2,
    upcoming: 3,
  };

  return attention.sort((a, b) => (
    priority[a.kind] - priority[b.kind] || a.sortDate.localeCompare(b.sortDate)
  ));
}
