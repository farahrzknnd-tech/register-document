import { useCallback, useEffect, useMemo, useState, type ComponentType } from 'react';
import {
  AlertCircle,
  Banknote,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileText,
  Filter,
  RefreshCw,
  ReceiptText,
  TrendingUp,
  Users,
  WalletCards,
} from 'lucide-react';
import { EmptyState } from '../../../components/shared';
import { mapAppError } from '../../../lib/errors';
import type { Cluster, Project } from '../../../lib/types';
import { formatDate } from '../../../lib/utils';
import { fetchSpkBillings } from '../api/billings';
import { BillingStatusBadge } from '../components/BillingStatusBadge';
import type { SpkBillingListItem } from '../types';
import {
  buildBillingAttentionItems,
  buildClusterBreakdown,
  buildProjectBreakdown,
  buildStageBreakdown,
  buildStatusBreakdown,
  calculateBillingDashboardStats,
  filterBillingDashboardItems,
  formatRupiahCompact,
  type BillingAttentionKind,
  type BillingDashboardBreakdown,
  type BillingDashboardFilters,
} from '../utils/dashboard';
import { formatRupiah } from '../utils/monitoring';

interface BillingDashboardProps {
  projects: Project[];
  clusters: Cluster[];
  onOpenBilling: (billingId: string) => void;
  onOpenMonitoring: () => void;
}

const initialFilters: BillingDashboardFilters = {
  projectId: '',
  clusterId: '',
  contractorId: '',
  statusId: '',
};

const statusDotClasses: Record<string, string> = {
  gray: 'bg-gray-500',
  blue: 'bg-blue-500',
  amber: 'bg-amber-500',
  green: 'bg-green-500',
  red: 'bg-red-500',
  purple: 'bg-purple-500',
};

const attentionClasses: Record<BillingAttentionKind, { icon: ComponentType<{ className?: string }>; badge: string; label: string }> = {
  overdue: { icon: AlertCircle, badge: 'bg-red-50 text-red-700', label: 'Terlambat' },
  outstanding: { icon: Clock3, badge: 'bg-amber-50 text-amber-700', label: 'Belum Dibayar' },
  unbilled: { icon: ReceiptText, badge: 'bg-blue-50 text-blue-700', label: 'Belum Ditagihkan' },
  upcoming: { icon: CalendarClock, badge: 'bg-purple-50 text-purple-700', label: 'Mendekati Selesai' },
};

function DashboardCard({
  label,
  value,
  detail,
  icon: Icon,
  iconClass,
}: {
  label: string;
  value: string;
  detail?: string;
  icon: ComponentType<{ className?: string }>;
  iconClass: string;
}) {
  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
          <p className="mt-2 truncate text-xl font-bold text-gray-900" title={value}>{value}</p>
          {detail && <p className="mt-1 text-xs text-gray-500">{detail}</p>}
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </article>
  );
}

function ProgressMetric({
  label,
  percentage,
  value,
  helper,
}: {
  label: string;
  percentage: number;
  value: string;
  helper: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-800">{label}</p>
          <p className="text-xs text-gray-500">{helper}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-gray-900">{percentage.toLocaleString('id-ID')}%</p>
          <p className="text-xs text-gray-500">{value}</p>
        </div>
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-brand-600 transition-all"
          style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
        />
      </div>
    </div>
  );
}

function BreakdownList({
  title,
  subtitle,
  items,
  emptyLabel,
  showStatusColor = false,
}: {
  title: string;
  subtitle: string;
  items: BillingDashboardBreakdown[];
  emptyLabel: string;
  showStatusColor?: boolean;
}) {
  const displayed = items.slice(0, 8);
  const maxCount = Math.max(1, ...displayed.map((item) => item.count));

  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-4">
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
        <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
      </div>
      <div className="space-y-4 p-5">
        {displayed.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">{emptyLabel}</p>
        ) : displayed.map((item) => (
          <div key={item.id}>
            <div className="flex items-center justify-between gap-3 text-xs">
              <div className="flex min-w-0 items-center gap-2">
                {showStatusColor && (
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${statusDotClasses[item.colorKey ?? 'gray'] ?? statusDotClasses.gray}`} />
                )}
                <span className="truncate font-semibold text-gray-700" title={item.name}>{item.name}</span>
              </div>
              <span className="shrink-0 text-gray-500">{item.count} monitoring</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-brand-500"
                style={{ width: `${showStatusColor ? Math.max(6, (item.count / maxCount) * 100) : Math.max(6, item.percentage)}%` }}
              />
            </div>
            <div className="mt-1 flex items-center justify-between gap-3 text-[11px] text-gray-400">
              <span>Kontrak {formatRupiahCompact(item.contractValue)}</span>
              <span>Tagihan {formatRupiahCompact(item.billedValue)}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function BillingDashboard({
  projects,
  clusters,
  onOpenBilling,
  onOpenMonitoring,
}: BillingDashboardProps) {
  const [billings, setBillings] = useState<SpkBillingListItem[]>([]);
  const [filters, setFilters] = useState<BillingDashboardFilters>(initialFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setBillings(await fetchSpkBillings());
    } catch (loadError) {
      setError(mapAppError(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(
    () => filterBillingDashboardItems(billings, filters),
    [billings, filters],
  );
  const stats = useMemo(() => calculateBillingDashboardStats(filtered), [filtered]);
  const projectBreakdown = useMemo(() => buildProjectBreakdown(filtered), [filtered]);
  const clusterBreakdown = useMemo(() => buildClusterBreakdown(filtered), [filtered]);
  const statusBreakdown = useMemo(() => buildStatusBreakdown(filtered), [filtered]);
  const stageBreakdown = useMemo(() => buildStageBreakdown(filtered), [filtered]);
  const attentionItems = useMemo(() => buildBillingAttentionItems(filtered).slice(0, 10), [filtered]);

  const contractors = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of billings) {
      if (item.contractor_id) map.set(item.contractor_id, item.contractor?.name ?? item.contractor_name_snapshot);
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], 'id'));
  }, [billings]);

  const statuses = useMemo(() => {
    const map = new Map<string, { id: string; name: string; sort: number }>();
    for (const item of billings) {
      map.set(item.status.id, { id: item.status.id, name: item.status.name, sort: item.status.sort_order });
    }
    return [...map.values()].sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name, 'id'));
  }, [billings]);

  const hasFilters = Object.values(filters).some(Boolean);

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-brand-600" />
          <p className="mt-3 text-sm text-gray-500">Memuat dashboard tagihan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="max-w-md rounded-xl border border-red-200 bg-white p-6 text-center shadow-sm">
          <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
          <h2 className="mt-3 text-base font-bold text-gray-900">Dashboard tagihan gagal dimuat</h2>
          <p className="mt-2 text-sm text-red-700">{error}</p>
          <button type="button" className="btn-primary mt-5" onClick={() => void load()}>
            <RefreshCw className="h-4 w-4" /> Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard Tagihan</h1>
          <p className="mt-1 text-sm text-gray-500">Ringkasan kontrak, tagihan, pembayaran, dan progres approval.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn-secondary" onClick={() => void load()}>
            <RefreshCw className="h-4 w-4" /> Muat Ulang
          </button>
          <button type="button" className="btn-primary" onClick={onOpenMonitoring}>
            <ReceiptText className="h-4 w-4" /> Lihat Monitoring
          </button>
        </div>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Filter className="h-4 w-4 text-brand-600" />
          <h2 className="text-sm font-bold text-gray-800">Filter Dashboard</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <select
            className="input"
            aria-label="Filter Project Billing"
            value={filters.projectId}
            onChange={(event) => setFilters((current) => ({ ...current, projectId: event.target.value }))}
          >
            <option value="">Semua Project</option>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
          <select
            className="input"
            aria-label="Filter Cluster Billing"
            value={filters.clusterId}
            onChange={(event) => setFilters((current) => ({ ...current, clusterId: event.target.value }))}
          >
            <option value="">Semua Cluster</option>
            {clusters.map((cluster) => <option key={cluster.id} value={cluster.id}>{cluster.name}</option>)}
          </select>
          <select
            className="input"
            aria-label="Filter Kontraktor Billing"
            value={filters.contractorId}
            onChange={(event) => setFilters((current) => ({ ...current, contractorId: event.target.value }))}
          >
            <option value="">Semua Kontraktor</option>
            {contractors.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
          <select
            className="input"
            aria-label="Filter Status Billing"
            value={filters.statusId}
            onChange={(event) => setFilters((current) => ({ ...current, statusId: event.target.value }))}
          >
            <option value="">Semua Status</option>
            {statuses.map((status) => <option key={status.id} value={status.id}>{status.name}</option>)}
          </select>
        </div>
        {hasFilters && (
          <button
            type="button"
            className="mt-3 text-xs font-semibold text-brand-600 hover:text-brand-700"
            onClick={() => setFilters(initialFilters)}
          >
            Reset semua filter
          </button>
        )}
      </section>

      {filtered.length === 0 ? (
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <EmptyState icon={FileText} message="Belum ada data monitoring tagihan untuk filter ini." />
        </section>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <DashboardCard label="Total Monitoring" value={stats.totalBillings.toLocaleString('id-ID')} detail={`${stats.completedCount} status Completed`} icon={FileText} iconClass="bg-blue-50 text-blue-600" />
            <DashboardCard label="Total Kontraktor" value={stats.totalContractors.toLocaleString('id-ID')} detail="Kontraktor unik" icon={Users} iconClass="bg-cyan-50 text-cyan-600" />
            <DashboardCard label="Nilai Kontrak" value={formatRupiahCompact(stats.totalContractValue)} detail={formatRupiah(stats.totalContractValue)} icon={CircleDollarSign} iconClass="bg-emerald-50 text-emerald-600" />
            <DashboardCard label="Sudah Ditagihkan" value={formatRupiahCompact(stats.totalBilled)} detail={`${stats.billingPercentage.toLocaleString('id-ID')}% dari kontrak`} icon={TrendingUp} iconClass="bg-indigo-50 text-indigo-600" />
            <DashboardCard label="Sudah Dibayar" value={formatRupiahCompact(stats.totalPaid)} detail={`${stats.paymentPercentage.toLocaleString('id-ID')}% dari tagihan`} icon={Banknote} iconClass="bg-green-50 text-green-600" />
            <DashboardCard label="Sisa Belum Ditagihkan" value={formatRupiahCompact(stats.remainingUnbilled)} detail={`${stats.overdueCount} pekerjaan terlambat`} icon={WalletCards} iconClass="bg-amber-50 text-amber-600" />
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
              <h2 className="text-sm font-bold text-gray-900">Progress Finansial</h2>
              <p className="mt-0.5 text-xs text-gray-500">Perbandingan nilai kontrak, tagihan, dan pembayaran.</p>
              <div className="mt-6 space-y-6">
                <ProgressMetric
                  label="Realisasi Tagihan"
                  percentage={stats.billingPercentage}
                  value={formatRupiah(stats.totalBilled)}
                  helper={`Dari nilai kontrak ${formatRupiah(stats.totalContractValue)}`}
                />
                <ProgressMetric
                  label="Realisasi Pembayaran"
                  percentage={stats.paymentPercentage}
                  value={formatRupiah(stats.totalPaid)}
                  helper={`Dari nilai tagihan ${formatRupiah(stats.totalBilled)}`}
                />
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold text-gray-900">Nilai Perlu Ditindaklanjuti</h2>
              <p className="mt-0.5 text-xs text-gray-500">Sisa tagihan dan pembayaran berjalan.</p>
              <div className="mt-5 space-y-4">
                <div className="rounded-lg bg-amber-50 p-4">
                  <p className="text-xs font-semibold text-amber-700">Tagihan belum dibayar</p>
                  <p className="mt-1 text-lg font-bold text-amber-900">{formatRupiahCompact(stats.outstandingPayment)}</p>
                  <p className="mt-1 text-xs text-amber-700">Selisih nilai ditagihkan dan dibayar.</p>
                </div>
                <div className="rounded-lg bg-blue-50 p-4">
                  <p className="text-xs font-semibold text-blue-700">Kontrak belum ditagihkan</p>
                  <p className="mt-1 text-lg font-bold text-blue-900">{formatRupiahCompact(stats.remainingUnbilled)}</p>
                  <p className="mt-1 text-xs text-blue-700">Sisa nilai kontrak di luar realisasi tagihan.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <BreakdownList title="Nilai Tagihan per Project" subtitle="Delapan project dengan nilai tagihan terbesar." items={projectBreakdown} emptyLabel="Belum ada data project." />
            <BreakdownList title="Nilai Tagihan per Cluster" subtitle="Delapan cluster dengan nilai tagihan terbesar." items={clusterBreakdown} emptyLabel="Belum ada data cluster." />
            <BreakdownList title="Distribusi Status Billing" subtitle="Jumlah monitoring dan nilai tagihan berdasarkan status." items={statusBreakdown} emptyLabel="Belum ada data status." showStatusColor />
            <BreakdownList title="Posisi Tahapan Approval" subtitle="Posisi approval aktif dari setiap monitoring." items={stageBreakdown} emptyLabel="Belum ada data tahapan approval." />
          </section>

          <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Perlu Perhatian</h2>
                <p className="mt-0.5 text-xs text-gray-500">Monitoring terlambat, belum ditagihkan, atau memiliki pembayaran tertunda.</p>
              </div>
              <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">{attentionItems.length}</span>
            </div>
            {attentionItems.length === 0 ? (
              <div className="py-12 text-center">
                <CheckCircle2 className="mx-auto h-9 w-9 text-green-500" />
                <p className="mt-2 text-sm font-semibold text-gray-700">Tidak ada monitoring yang perlu perhatian.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-5 py-3 text-left">Prioritas</th>
                      <th className="px-5 py-3 text-left">SPK / Pekerjaan</th>
                      <th className="px-5 py-3 text-left">Kontraktor</th>
                      <th className="px-5 py-3 text-left">Status</th>
                      <th className="px-5 py-3 text-left">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {attentionItems.map((item) => {
                      const config = attentionClasses[item.kind];
                      const Icon = config.icon;
                      return (
                        <tr key={item.id} className="cursor-pointer hover:bg-gray-50" onClick={() => onOpenBilling(item.billing.id)}>
                          <td className="px-5 py-3 text-left">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${config.badge}`}>
                              <Icon className="h-3.5 w-3.5" /> {config.label}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-left">
                            <p className="font-semibold text-brand-700">{item.billing.spk_number}</p>
                            <p className="mt-0.5 max-w-xs truncate text-xs text-gray-500">{item.billing.work_name}</p>
                          </td>
                          <td className="px-5 py-3 text-left text-gray-600">{item.billing.contractor_name_snapshot}</td>
                          <td className="px-5 py-3 text-left"><BillingStatusBadge status={item.billing.status} /></td>
                          <td className="px-5 py-3 text-left">
                            <p className="max-w-sm text-xs text-gray-600">{item.message}</p>
                            {item.billing.work_finish_date && <p className="mt-1 text-[11px] text-gray-400">Selesai: {formatDate(item.billing.work_finish_date)}</p>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
