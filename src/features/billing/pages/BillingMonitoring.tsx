import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  FileSearch,
  Plus,
  RefreshCw,
  Search,
  Wallet,
  ReceiptText,
  CheckCircle2,
  Clock3,
} from 'lucide-react';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { EmptyState, TableActions } from '../../../components/shared';
import { useToast } from '../../../components/Toast';
import { mapAppError } from '../../../lib/errors';
import type { Cluster, Project, SuratPenunjukan, UserRole } from '../../../lib/types';
import { formatDate } from '../../../lib/utils';
import {
  createSpkBilling,
  deleteSpkBilling,
  fetchSpkBillingDetail,
  fetchSpkBillings,
  updateSpkBilling,
} from '../api/billings';
import {
  fetchBillingStatuses,
  fetchBillingTerminTemplates,
  fetchContractors,
} from '../api/masterData';
import { BillingDetail } from '../components/BillingDetail';
import { BillingForm } from '../components/BillingForm';
import { BillingStatusBadge } from '../components/BillingStatusBadge';
import type {
  BillingFilterState,
  BillingStatus,
  BillingTerminTemplate,
  Contractor,
  SpkBillingDetail,
  SpkBillingInput,
  SpkBillingListItem,
} from '../types';
import {
  calculateBillingTotals,
  filterSpkBillings,
  formatRupiah,
} from '../utils/monitoring';
import { buildBillingInputFromSuratPenunjukan } from '../utils/suratPenunjukanIntegration';

interface BillingMonitoringProps {
  projects: Project[];
  clusters: Cluster[];
  role: UserRole;
  initialCreateFrom?: SuratPenunjukan | null;
  initialDetailBillingId?: string | null;
  onConsumeInitialAction?: () => void;
  onOpenSuratPenunjukan?: (id: string) => void;
}

const initialFilters: BillingFilterState = {
  search: '',
  statusId: '',
  projectId: '',
  clusterId: '',
  contractorId: '',
  sort: 'newest',
};

const PAGE_SIZE = 10;

export function BillingMonitoring({
  projects,
  clusters,
  role,
  initialCreateFrom,
  initialDetailBillingId,
  onConsumeInitialAction,
  onOpenSuratPenunjukan,
}: BillingMonitoringProps) {
  const toast = useToast();
  const [billings, setBillings] = useState<SpkBillingListItem[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [statuses, setStatuses] = useState<BillingStatus[]>([]);
  const [templates, setTemplates] = useState<BillingTerminTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<BillingFilterState>(initialFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SpkBillingListItem | null>(null);
  const [initialInput, setInitialInput] = useState<SpkBillingInput | null>(null);
  const [sourceLabel, setSourceLabel] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SpkBillingListItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailBase, setDetailBase] = useState<SpkBillingListItem | null>(null);
  const [detail, setDetail] = useState<SpkBillingDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [billingRows, contractorRows, statusRows, templateRows] = await Promise.all([
        fetchSpkBillings(),
        fetchContractors(),
        fetchBillingStatuses(),
        fetchBillingTerminTemplates(),
      ]);
      setBillings(billingRows);
      setContractors(contractorRows);
      setStatuses(statusRows);
      setTemplates(templateRows);
    } catch (loadError) {
      setError(mapAppError(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const filtered = useMemo(
    () => filterSpkBillings(billings, filters),
    [billings, filters],
  );
  const totals = useMemo(() => calculateBillingTotals(filtered), [filtered]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const openCreate = () => {
    setEditing(null);
    setInitialInput(null);
    setSourceLabel(null);
    setFormOpen(true);
  };

  const openEdit = (billing: SpkBillingListItem) => {
    setInitialInput(null);
    setSourceLabel(null);
    setEditing(billing);
    setFormOpen(true);
  };

  const openDetail = useCallback(async (billing: SpkBillingListItem) => {
    setDetailBase(billing);
    setDetail(null);
    setDetailError(null);
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      setDetail(await fetchSpkBillingDetail(billing));
    } catch (detailLoadError) {
      setDetailError(mapAppError(detailLoadError));
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (loading) return;

    if (initialDetailBillingId) {
      onConsumeInitialAction?.();
      const existing = billings.find((billing) => billing.id === initialDetailBillingId);
      if (existing) {
        void openDetail(existing);
      } else {
        toast.show('Monitoring tagihan yang terhubung tidak ditemukan.', 'warning');
      }
      return;
    }

    if (!initialCreateFrom) return;

    onConsumeInitialAction?.();
    const existing = billings.find(
      (billing) => billing.surat_penunjukan_id === initialCreateFrom.id,
    );

    if (existing) {
      toast.show('Surat Penunjukan ini sudah memiliki Monitoring Tagihan.', 'info');
      void openDetail(existing);
      return;
    }

    if (role !== 'admin') {
      toast.show('Akses admin diperlukan untuk membuat Monitoring Tagihan.', 'warning');
      return;
    }

    setEditing(null);
    setInitialInput(buildBillingInputFromSuratPenunjukan(initialCreateFrom, contractors));
    setSourceLabel(initialCreateFrom.register_no || initialCreateFrom.nomor_sp);
    setFormOpen(true);
  }, [
    billings,
    contractors,
    initialCreateFrom,
    initialDetailBillingId,
    loading,
    onConsumeInitialAction,
    openDetail,
    role,
    toast,
  ]);

  const handleSubmit = async (input: SpkBillingInput) => {
    setSubmitting(true);
    try {
      if (editing) {
        await updateSpkBilling(editing.id, input);
        toast.show('Monitoring tagihan berhasil diperbarui.', 'success');
      } else {
        await createSpkBilling(input);
        toast.show('Monitoring tagihan berhasil ditambahkan.', 'success');
      }
      setFormOpen(false);
      setEditing(null);
      setInitialInput(null);
      setSourceLabel(null);
      await load();
    } catch (submitError) {
      toast.show(mapAppError(submitError), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteSpkBilling(deleteTarget.id);
      toast.show('Monitoring tagihan berhasil dihapus.', 'success');
      setDeleteTarget(null);
      await load();
    } catch (deleteError) {
      toast.show(mapAppError(deleteError), 'error');
    }
  };

  const handleEditFromDetail = () => {
    const target = detailBase;
    setDetailOpen(false);
    if (target) openEdit(target);
  };

  if (loading) {
    return <div className="card py-20 text-center text-sm text-gray-500">Memuat monitoring tagihan...</div>;
  }

  if (error) {
    return (
      <div className="card flex flex-col items-center py-16 text-center">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <h2 className="mt-3 text-base font-bold text-gray-900">Gagal memuat Monitoring Tagihan</h2>
        <p className="mt-1 max-w-lg text-sm text-red-600">{error}</p>
        <button className="btn-secondary mt-5" onClick={() => void load()}>
          <RefreshCw className="h-4 w-4" /> Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Monitoring Tagihan</h1>
          <p className="mt-1 text-sm text-gray-500">Kelola data inti SPK dan pantau ringkasan tagihan kontraktor.</p>
        </div>
        {role === 'admin' && (
          <button className="btn-primary" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Tambah Monitoring
          </button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500"><FileSearch className="h-4 w-4" /> Total Monitoring</div>
          <p className="mt-2 text-2xl font-bold text-gray-900">{filtered.length}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500"><Wallet className="h-4 w-4" /> Nilai Kontrak</div>
          <p className="mt-2 text-lg font-bold text-gray-900">{formatRupiah(totals.contractValue)}</p>
        </div>
        <div className="card border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600"><ReceiptText className="h-4 w-4" /> Ditagihkan</div>
          <p className="mt-2 text-lg font-bold text-blue-800">{formatRupiah(totals.totalBilled)}</p>
        </div>
        <div className="card border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-green-600"><CheckCircle2 className="h-4 w-4" /> Dibayar</div>
          <p className="mt-2 text-lg font-bold text-green-800">{formatRupiah(totals.totalPaid)}</p>
        </div>
      </div>

      <div className="card p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
          <label className="relative xl:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              className="input pl-9"
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              placeholder="Cari nomor SPK, kontraktor, pekerjaan..."
            />
          </label>
          <select className="input" value={filters.statusId} onChange={(event) => setFilters((current) => ({ ...current, statusId: event.target.value }))}>
            <option value="">Semua Status</option>
            {statuses.map((status) => <option key={status.id} value={status.id}>{status.name}</option>)}
          </select>
          <select className="input" value={filters.projectId} onChange={(event) => setFilters((current) => ({ ...current, projectId: event.target.value }))}>
            <option value="">Semua Project</option>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
          <select className="input" value={filters.clusterId} onChange={(event) => setFilters((current) => ({ ...current, clusterId: event.target.value }))}>
            <option value="">Semua Cluster</option>
            {clusters.map((cluster) => <option key={cluster.id} value={cluster.id}>{cluster.name}</option>)}
          </select>
          <select className="input" value={filters.contractorId} onChange={(event) => setFilters((current) => ({ ...current, contractorId: event.target.value }))}>
            <option value="">Semua Kontraktor</option>
            {contractors.map((contractor) => <option key={contractor.id} value={contractor.id}>{contractor.name}</option>)}
          </select>
          <select className="input" value={filters.sort} onChange={(event) => setFilters((current) => ({ ...current, sort: event.target.value as BillingFilterState['sort'] }))}>
            <option value="newest">Terbaru</option>
            <option value="oldest">Terlama</option>
            <option value="spk_asc">Nomor SPK A–Z</option>
            <option value="contract_desc">Nilai Kontrak Terbesar</option>
          </select>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
          <span>Menampilkan {filtered.length} dari {billings.length} monitoring.</span>
          <button className="font-semibold text-brand-600 hover:text-brand-700" onClick={() => setFilters(initialFilters)}>Reset Filter</button>
        </div>
      </div>

      <div className="card overflow-hidden">
        {pageItems.length === 0 ? (
          <EmptyState icon={ReceiptText} message="Belum ada data monitoring yang sesuai filter." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1150px] text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Nomor SPK</th>
                  <th className="px-4 py-3 text-left">Kontraktor</th>
                  <th className="px-4 py-3 text-left">Pekerjaan</th>
                  <th className="px-4 py-3 text-left">Project / Cluster</th>
                  <th className="px-4 py-3 text-left">Nilai Kontrak</th>
                  <th className="px-4 py-3 text-left">Ditagihkan</th>
                  <th className="px-4 py-3 text-left">Posisi Dokumen</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageItems.map((billing) => (
                  <tr key={billing.id} className="hover:bg-gray-50/70">
                    <td className="px-4 py-3 text-left">
                      <button className="font-semibold text-brand-700 hover:underline" onClick={() => void openDetail(billing)}>{billing.spk_number}</button>
                      <p className="mt-0.5 text-xs text-gray-500">{formatDate(billing.spk_date)}</p>
                    </td>
                    <td className="px-4 py-3 text-left font-medium text-gray-900">{billing.contractor_name_snapshot}</td>
                    <td className="max-w-xs px-4 py-3 text-left">
                      <p className="font-medium text-gray-900">{billing.work_name}</p>
                      <p className="mt-0.5 truncate text-xs text-gray-500">{billing.work_location ?? '-'}</p>
                    </td>
                    <td className="px-4 py-3 text-left text-gray-700">
                      <p>{billing.project?.name ?? '-'}</p>
                      <p className="mt-0.5 text-xs text-gray-500">{billing.cluster?.name ?? '-'}</p>
                    </td>
                    <td className="px-4 py-3 text-left font-medium text-gray-900">{formatRupiah(billing.contract_value)}</td>
                    <td className="px-4 py-3 text-left">
                      <p className="font-medium text-blue-700">{formatRupiah(billing.financial.total_billed)}</p>
                      <p className="mt-0.5 text-xs text-gray-500">{billing.financial.billing_percentage}%</p>
                    </td>
                    <td className="px-4 py-3 text-left">
                      <div className="flex items-center gap-2 text-gray-700"><Clock3 className="h-4 w-4 text-gray-400" /> {billing.current_stage?.name ?? '-'}</div>
                    </td>
                    <td className="px-4 py-3 text-left"><BillingStatusBadge status={billing.status} /></td>
                    <td className="px-4 py-3 text-left">
                      <TableActions
                        onPreview={() => void openDetail(billing)}
                        onEdit={role === 'admin' ? () => openEdit(billing) : undefined}
                        onDelete={role === 'admin' ? () => setDeleteTarget(billing) : undefined}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
            <p className="text-xs text-gray-500">Halaman {currentPage} dari {totalPages}</p>
            <div className="flex gap-2">
              <button className="btn-secondary px-3 py-2" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}><ChevronLeft className="h-4 w-4" /></button>
              <button className="btn-secondary px-3 py-2" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </div>

      <BillingForm
        open={formOpen}
        editing={editing}
        initialInput={initialInput}
        sourceLabel={sourceLabel}
        projects={projects}
        clusters={clusters}
        contractors={contractors}
        statuses={statuses}
        templates={templates}
        submitting={submitting}
        onClose={() => {
          if (!submitting) {
            setFormOpen(false);
            setEditing(null);
            setInitialInput(null);
            setSourceLabel(null);
          }
        }}
        onSubmit={handleSubmit}
      />

      <BillingDetail
        open={detailOpen}
        billing={detail}
        loading={detailLoading}
        error={detailError}
        role={role}
        onClose={() => setDetailOpen(false)}
        onEdit={handleEditFromDetail}
        onOpenSuratPenunjukan={onOpenSuratPenunjukan}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
        title="Hapus Monitoring Tagihan"
        message={`Hapus monitoring ${deleteTarget?.spk_number ?? ''}? Tahapan, termin, dan riwayat terkait juga akan dihapus.`}
        confirmLabel="Hapus Monitoring"
      />
    </div>
  );
}
