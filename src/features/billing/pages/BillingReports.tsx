import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Banknote,
  BarChart3,
  CircleDollarSign,
  FileSpreadsheet,
  FileText,
  Filter,
  ListChecks,
  Printer,
  ReceiptText,
  RefreshCw,
  Search,
  TableProperties,
  WalletCards,
} from 'lucide-react';
import { Loading } from '../../../components/Loading';
import { EmptyState } from '../../../components/shared';
import { useToast } from '../../../components/Toast';
import { mapAppError } from '../../../lib/errors';
import type { Cluster, Project } from '../../../lib/types';
import { formatDate } from '../../../lib/utils';
import { fetchBillingTerminsForReport, fetchSpkBillings } from '../api/billings';
import { BillingStatusBadge } from '../components/BillingStatusBadge';
import type {
  BillingReportFilters,
  BillingTermin,
  SpkBillingListItem,
} from '../types';
import { formatRupiah } from '../utils/monitoring';
import {
  buildBillingReportRows,
  buildBillingTerminReportRows,
  calculateBillingReportSummary,
  extractBillingReportYears,
  filterBillingReportItems,
  hasActiveBillingReportFilters,
  initialBillingReportFilters,
  BILLING_TERMIN_STATUS_LABELS,
} from '../utils/reports';
import {
  exportBillingReportExcel,
  exportBillingReportPdf,
  printBillingReport,
} from '../utils/reportExport';

interface BillingReportsProps {
  projects: Project[];
  clusters: Cluster[];
  onOpenBilling: (billingId: string) => void;
}

type ReportTab = 'monitoring' | 'termin';
type ExportAction = 'excel' | 'pdf' | null;

function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
}: {
  label: string;
  value: string;
  helper: string;
  icon: typeof BarChart3;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
          <p className="mt-2 text-xl font-bold text-gray-900">{value}</p>
          <p className="mt-1 text-xs text-gray-500">{helper}</p>
        </div>
        <div className="rounded-lg bg-brand-50 p-2.5 text-brand-600"><Icon className="h-5 w-5" /></div>
      </div>
    </div>
  );
}

export function BillingReports({ projects, clusters, onOpenBilling }: BillingReportsProps) {
  const toast = useToast();
  const [billings, setBillings] = useState<SpkBillingListItem[]>([]);
  const [termins, setTermins] = useState<BillingTermin[]>([]);
  const [filters, setFilters] = useState<BillingReportFilters>(initialBillingReportFilters);
  const [tab, setTab] = useState<ReportTab>('monitoring');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<ExportAction>(null);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [billingData, terminData] = await Promise.all([
        fetchSpkBillings(),
        fetchBillingTerminsForReport(),
      ]);
      setBillings(billingData);
      setTermins(terminData);
    } catch (loadError: unknown) {
      setError(mapAppError(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  const filteredBillings = useMemo(
    () => filterBillingReportItems(billings, filters),
    [billings, filters],
  );
  const summary = useMemo(
    () => calculateBillingReportSummary(filteredBillings),
    [filteredBillings],
  );
  const reportRows = useMemo(
    () => buildBillingReportRows(filteredBillings),
    [filteredBillings],
  );
  const terminRows = useMemo(
    () => buildBillingTerminReportRows(filteredBillings, termins),
    [filteredBillings, termins],
  );
  const years = useMemo(() => extractBillingReportYears(billings), [billings]);

  const contractors = useMemo(() => {
    const values = new Map<string, string>();
    for (const billing of billings) {
      const key = billing.contractor_id ?? `snapshot:${billing.contractor_name_snapshot.trim().toLowerCase()}`;
      values.set(key, billing.contractor_name_snapshot);
    }
    return [...values.entries()].sort((a, b) => a[1].localeCompare(b[1], 'id'));
  }, [billings]);

  const statuses = useMemo(() => {
    const values = new Map<string, SpkBillingListItem['status']>();
    for (const billing of billings) values.set(billing.status.id, billing.status);
    return [...values.values()].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, 'id'));
  }, [billings]);

  const filterLabels = useMemo(() => {
    const labels: string[] = [];
    if (filters.search) labels.push(`Pencarian: ${filters.search}`);
    if (filters.projectId) labels.push(`Project: ${projects.find((item) => item.id === filters.projectId)?.name ?? '-'}`);
    if (filters.clusterId) labels.push(`Cluster: ${clusters.find((item) => item.id === filters.clusterId)?.name ?? '-'}`);
    if (filters.contractorId) labels.push(`Kontraktor: ${contractors.find(([id]) => id === filters.contractorId)?.[1] ?? '-'}`);
    if (filters.statusId) labels.push(`Status: ${statuses.find((item) => item.id === filters.statusId)?.name ?? '-'}`);
    if (filters.year) labels.push(`Tahun: ${filters.year}`);
    if (filters.dateFrom) labels.push(`Mulai: ${formatDate(filters.dateFrom)}`);
    if (filters.dateTo) labels.push(`Sampai: ${formatDate(filters.dateTo)}`);
    return labels;
  }, [clusters, contractors, filters, projects, statuses]);

  const handleExcel = async () => {
    setExporting('excel');
    try {
      await exportBillingReportExcel(reportRows, terminRows, summary, { filters: filterLabels });
      toast.show('Laporan Excel berhasil diunduh.', 'success');
    } catch (exportError: unknown) {
      toast.show(`Gagal export Excel: ${mapAppError(exportError)}`, 'error');
    } finally {
      setExporting(null);
    }
  };

  const handlePdf = async () => {
    setExporting('pdf');
    try {
      await exportBillingReportPdf(reportRows, terminRows, summary, { filters: filterLabels });
      toast.show('Laporan PDF berhasil diunduh.', 'success');
    } catch (exportError: unknown) {
      toast.show(`Gagal export PDF: ${mapAppError(exportError)}`, 'error');
    } finally {
      setExporting(null);
    }
  };

  const handlePrint = () => {
    try {
      printBillingReport(reportRows, terminRows, summary, { filters: filterLabels });
    } catch (printError: unknown) {
      toast.show(`Gagal membuka halaman print: ${mapAppError(printError)}`, 'error');
    }
  };

  if (loading) return <Loading label="Memuat laporan tagihan..." />;

  if (error) {
    return (
      <section className="rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
        <FileText className="mx-auto h-10 w-10 text-red-400" />
        <h1 className="mt-3 text-base font-bold text-gray-900">Gagal memuat laporan tagihan</h1>
        <p className="mt-2 text-sm text-red-700">{error}</p>
        <button className="btn-secondary mt-5" onClick={() => void loadReport()}>
          <RefreshCw className="h-4 w-4" /> Coba Lagi
        </button>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan Tagihan</h1>
          <p className="mt-1 text-sm text-gray-500">Rekap monitoring SPK, realisasi tagihan, pembayaran, dan detail termin.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary" onClick={() => void loadReport()}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button className="btn-primary" disabled={exporting !== null || reportRows.length === 0} onClick={() => void handleExcel()}>
            <FileSpreadsheet className="h-4 w-4" /> {exporting === 'excel' ? 'Menyiapkan...' : 'Export Excel'}
          </button>
          <button className="btn-secondary" disabled={exporting !== null || reportRows.length === 0} onClick={() => void handlePdf()}>
            <FileText className="h-4 w-4" /> {exporting === 'pdf' ? 'Menyiapkan...' : 'Export PDF'}
          </button>
          <button className="btn-secondary" disabled={reportRows.length === 0} onClick={handlePrint}>
            <Printer className="h-4 w-4" /> Print
          </button>
        </div>
      </header>

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
          <Filter className="h-4 w-4 text-brand-600" /> Filter Laporan
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="relative xl:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              className="input pl-9"
              aria-label="Cari laporan tagihan"
              placeholder="Cari nomor SPK, kontraktor, pekerjaan..."
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
            />
          </label>
          <select className="input" aria-label="Filter project laporan tagihan" value={filters.projectId} onChange={(event) => setFilters((current) => ({ ...current, projectId: event.target.value }))}>
            <option value="">Semua Project</option>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
          <select className="input" aria-label="Filter cluster laporan tagihan" value={filters.clusterId} onChange={(event) => setFilters((current) => ({ ...current, clusterId: event.target.value }))}>
            <option value="">Semua Cluster</option>
            {clusters.map((cluster) => <option key={cluster.id} value={cluster.id}>{cluster.name}</option>)}
          </select>
          <select className="input" aria-label="Filter kontraktor laporan tagihan" value={filters.contractorId} onChange={(event) => setFilters((current) => ({ ...current, contractorId: event.target.value }))}>
            <option value="">Semua Kontraktor</option>
            {contractors.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
          <select className="input" aria-label="Filter status laporan tagihan" value={filters.statusId} onChange={(event) => setFilters((current) => ({ ...current, statusId: event.target.value }))}>
            <option value="">Semua Status</option>
            {statuses.map((status) => <option key={status.id} value={status.id}>{status.name}</option>)}
          </select>
          <select className="input" aria-label="Filter tahun laporan tagihan" value={filters.year} onChange={(event) => setFilters((current) => ({ ...current, year: event.target.value }))}>
            <option value="">Semua Tahun</option>
            {years.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input className="input" aria-label="Tanggal mulai laporan tagihan" type="date" value={filters.dateFrom} onChange={(event) => setFilters((current) => ({ ...current, dateFrom: event.target.value }))} />
            <input className="input" aria-label="Tanggal selesai laporan tagihan" type="date" value={filters.dateTo} onChange={(event) => setFilters((current) => ({ ...current, dateTo: event.target.value }))} />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
          <span>Menampilkan {filteredBillings.length} dari {billings.length} monitoring dan {terminRows.length} termin.</span>
          {hasActiveBillingReportFilters(filters) && (
            <button className="font-semibold text-brand-600 hover:text-brand-700" onClick={() => setFilters(initialBillingReportFilters)}>Reset semua filter</button>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <MetricCard label="Total Monitoring" value={summary.totalBillings.toLocaleString('id-ID')} helper={`${summary.activeBillings} aktif • ${summary.completedBillings} selesai`} icon={ReceiptText} />
        <MetricCard label="Nilai Kontrak" value={formatRupiah(summary.totalContractValue)} helper={`Rencana termin ${formatRupiah(summary.totalPlanned)}`} icon={CircleDollarSign} />
        <MetricCard label="Sudah Ditagihkan" value={formatRupiah(summary.totalBilled)} helper={`${summary.billingPercentage}% dari nilai kontrak`} icon={BarChart3} />
        <MetricCard label="Sudah Dibayar" value={formatRupiah(summary.totalPaid)} helper={`${summary.paymentPercentage}% dari nilai tagihan`} icon={Banknote} />
        <MetricCard label="Belum Ditagihkan" value={formatRupiah(summary.remainingUnbilled)} helper="Sisa nilai kontrak" icon={WalletCards} />
        <MetricCard label="Belum Dibayar" value={formatRupiah(summary.outstandingPayment)} helper="Selisih tagihan dan pembayaran" icon={ListChecks} />
      </section>

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 p-4">
          <button
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${tab === 'monitoring' ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'}`}
            onClick={() => setTab('monitoring')}
          >
            <TableProperties className="h-4 w-4" /> Detail Monitoring ({reportRows.length})
          </button>
          <button
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${tab === 'termin' ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'}`}
            onClick={() => setTab('termin')}
          >
            <ListChecks className="h-4 w-4" /> Detail Termin ({terminRows.length})
          </button>
        </div>

        {tab === 'monitoring' && (
          reportRows.length === 0 ? (
            <EmptyState icon={ReceiptText} message="Tidak ada data monitoring yang sesuai filter." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1500px] text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Nomor SPK</th>
                    <th className="px-4 py-3 text-left">Kontraktor / Pekerjaan</th>
                    <th className="px-4 py-3 text-left">Project / Cluster</th>
                    <th className="px-4 py-3 text-left">Status / Tahapan</th>
                    <th className="px-4 py-3 text-left">Nilai Kontrak</th>
                    <th className="px-4 py-3 text-left">Rencana</th>
                    <th className="px-4 py-3 text-left">Ditagihkan</th>
                    <th className="px-4 py-3 text-left">Dibayar</th>
                    <th className="px-4 py-3 text-left">Sisa</th>
                    <th className="px-4 py-3 text-left">Outstanding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reportRows.map((row) => {
                    const billing = filteredBillings.find((item) => item.id === row.billingId)!;
                    return (
                      <tr key={row.billingId} className="hover:bg-gray-50/70">
                        <td className="px-4 py-3 text-left">
                          <button className="font-semibold text-brand-700 hover:underline" onClick={() => onOpenBilling(row.billingId)}>{row.spkNumber}</button>
                          <p className="mt-0.5 text-xs text-gray-500">{formatDate(row.spkDate)}</p>
                        </td>
                        <td className="max-w-sm px-4 py-3 text-left">
                          <p className="font-medium text-gray-900">{row.contractorName}</p>
                          <p className="mt-0.5 text-xs text-gray-500">{row.workName}</p>
                        </td>
                        <td className="px-4 py-3 text-left"><p>{row.projectName}</p><p className="mt-0.5 text-xs text-gray-500">{row.clusterName}</p></td>
                        <td className="px-4 py-3 text-left"><BillingStatusBadge status={billing.status} /><p className="mt-1 text-xs text-gray-500">{row.currentStageName}</p></td>
                        <td className="px-4 py-3 text-left font-medium text-gray-900">{formatRupiah(row.contractValue)}</td>
                        <td className="px-4 py-3 text-left text-gray-700">{formatRupiah(row.plannedAmount)}</td>
                        <td className="px-4 py-3 text-left text-blue-700">{formatRupiah(row.billedAmount)}<p className="text-xs text-gray-500">{row.billingPercentage}%</p></td>
                        <td className="px-4 py-3 text-left text-green-700">{formatRupiah(row.paidAmount)}<p className="text-xs text-gray-500">{row.paymentPercentage}%</p></td>
                        <td className="px-4 py-3 text-left text-amber-700">{formatRupiah(row.remainingUnbilled)}</td>
                        <td className="px-4 py-3 text-left text-red-700">{formatRupiah(row.outstandingPayment)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}

        {tab === 'termin' && (
          terminRows.length === 0 ? (
            <EmptyState icon={ListChecks} message="Tidak ada termin pembayaran yang sesuai filter." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1300px] text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Nomor SPK</th>
                    <th className="px-4 py-3 text-left">Termin</th>
                    <th className="px-4 py-3 text-left">Project / Cluster</th>
                    <th className="px-4 py-3 text-left">Persentase</th>
                    <th className="px-4 py-3 text-left">Rencana</th>
                    <th className="px-4 py-3 text-left">Ditagihkan</th>
                    <th className="px-4 py-3 text-left">Dibayar</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Tanggal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {terminRows.map((row) => (
                    <tr key={`${row.billingId}-${row.sequenceNo}-${row.terminName}`} className="hover:bg-gray-50/70">
                      <td className="px-4 py-3 text-left"><button className="font-semibold text-brand-700 hover:underline" onClick={() => onOpenBilling(row.billingId)}>{row.spkNumber}</button><p className="mt-0.5 text-xs text-gray-500">{row.contractorName}</p></td>
                      <td className="px-4 py-3 text-left"><p className="font-medium text-gray-900">{row.sequenceNo}. {row.terminName}</p></td>
                      <td className="px-4 py-3 text-left"><p>{row.projectName}</p><p className="mt-0.5 text-xs text-gray-500">{row.clusterName}</p></td>
                      <td className="px-4 py-3 text-left">{row.percentage === null ? '-' : `${row.percentage}%`}</td>
                      <td className="px-4 py-3 text-left">{formatRupiah(row.plannedAmount)}</td>
                      <td className="px-4 py-3 text-left text-blue-700">{formatRupiah(row.billedAmount)}</td>
                      <td className="px-4 py-3 text-left text-green-700">{formatRupiah(row.paidAmount)}</td>
                      <td className="px-4 py-3 text-left">{BILLING_TERMIN_STATUS_LABELS[row.status]}</td>
                      <td className="px-4 py-3 text-left"><p>Tagihan: {formatDate(row.billedDate)}</p><p className="mt-0.5 text-xs text-gray-500">Bayar: {formatDate(row.paidDate)}</p></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </section>
    </div>
  );
}
