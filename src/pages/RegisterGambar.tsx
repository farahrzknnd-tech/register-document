import { useMemo, useState, useEffect } from 'react';
import {
  Plus, FileImage, ArrowLeft, CheckCircle2, XCircle, ArrowLeftCircle, ArrowRightCircle,
} from 'lucide-react';
import type { Gambar, Surat, SuratPenunjukan, BeritaAcara, Cluster, Project, JenisGambar, StatusGambar, DocType, DocumentSummary, UserRole } from '../lib/types';
import { JENIS_GAMBAR_LIST, STATUS_GAMBAR_LIST, GAMBAR_PREFIXES } from '../lib/types';
import {
  createGambar, updateGambar, deleteGambar,
  fetchDocRefs, fetchDocReferrers, type GambarInput, type DocRefInput,
} from '../lib/api';
import { useToast } from '../components/toastContext';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { SearchBar } from '../components/SearchBar';
import { FilterBar, type FilterOption, Badge } from '../components/FilterBar';
import { DocumentLink } from '../components/DocumentLink';
import { DocumentRefSelect } from '../components/DocumentRefSelect';
import { DocumentRefSection } from '../components/DocumentRefSection';
import { Loading } from '../components/Loading';
import { DetailField, EmptyState, TableActions } from '../components/shared';
import { DriveButtons, DetailActions } from '../components/DetailActions';
import { printDetail } from '../lib/export';
import { formatDate, buildAllDocSummaries, findDoc, toDocSummary } from '../lib/utils';

interface GambarPageProps {
  gambar: Gambar[];
  surat: Surat[];
  suratPenunjukan: SuratPenunjukan[];
  beritaAcara: BeritaAcara[];
  clusters: Cluster[];
  projects: Project[];
  loading: boolean;
  role: UserRole;
  onRefresh: () => void;
  onOpenDoc?: (type: DocType, id: string) => void;
  initialDetailItem?: Gambar | null;
  onConsumeInitialDetail?: () => void;
}

const jenisColors: Record<string, string> = {
  'Gambar Pelaksanaan': 'blue',
  'Gambar Revisi Pelaksanaan': 'cyan',
  'Gambar Tender': 'amber',
  'Gambar Revisi Tender': 'purple',
  'Gambar Informasi': 'gray',
};

const emptyForm: GambarInput = {
  project_id: null,
  judul_gambar: '', cluster_id: null,
  jenis_gambar: 'Gambar Pelaksanaan', revisi: '', status_gambar: 'Aktif (Latest)',
  tanggal_diterima: new Date().toISOString().slice(0, 10), link_drive: '', keterangan: '',
};

export function RegisterGambar({ gambar, surat, suratPenunjukan, beritaAcara, clusters, projects, loading, role, onRefresh, onOpenDoc, initialDetailItem, onConsumeInitialDetail }: GambarPageProps) {
  const isAdmin = role === 'admin';
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [filterCluster, setFilterCluster] = useState('');
  const [filterJenis, setFilterJenis] = useState('');
  const [filterTahun, setFilterTahun] = useState('');
  const [filterLink, setFilterLink] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Gambar | null>(null);
  const [form, setForm] = useState<GambarInput>(emptyForm);
  const [formRefs, setFormRefs] = useState<DocRefInput[]>([]);
  const [saving, setSaving] = useState(false);

  const [detailItem, setDetailItem] = useState<Gambar | null>(null);
  const [detailPrevDocs, setDetailPrevDocs] = useState<DocumentSummary[]>([]);
  const [detailNextDocs, setDetailNextDocs] = useState<DocumentSummary[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (initialDetailItem) {
      openDetail(initialDetailItem);
      onConsumeInitialDetail?.();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDetailItem, onConsumeInitialDetail]);

  const allDocs = useMemo(() => buildAllDocSummaries(gambar, surat, suratPenunjukan, beritaAcara), [gambar, surat, suratPenunjukan, beritaAcara]);

  const years = useMemo(() => {
    const ys = new Set<number>();
    gambar.forEach((g) => ys.add(new Date(g.tanggal_diterima).getFullYear()));
    return Array.from(ys).sort((a, b) => b - a);
  }, [gambar]);

  const clusterOptions: FilterOption[] = clusters.map((c) => ({ value: c.id, label: c.name }));
  const jenisOptions: FilterOption[] = JENIS_GAMBAR_LIST.map((j) => ({ value: j, label: j }));
  const yearOptions: FilterOption[] = years.map((y) => ({ value: String(y), label: String(y) }));

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return gambar.filter((g) => {
      if (q) {
        const hay = [g.register_no || '', g.judul_gambar, g.cluster?.name || '', g.jenis_gambar].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filterCluster && g.cluster_id !== filterCluster) return false;
      if (filterJenis && g.jenis_gambar !== filterJenis) return false;
      if (filterTahun && new Date(g.tanggal_diterima).getFullYear() !== Number(filterTahun)) return false;
      if (filterLink === 'ada' && !g.link_drive) return false;
      if (filterLink === 'kosong' && g.link_drive) return false;
      return true;
    });
  }, [gambar, search, filterCluster, filterJenis, filterTahun, filterLink]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setFormRefs([]); setModalOpen(true); };
  const openEdit = async (g: Gambar) => {
    setEditing(g);
    setForm({
      project_id: g.project_id, judul_gambar: g.judul_gambar, cluster_id: g.cluster_id,
      jenis_gambar: g.jenis_gambar, revisi: g.revisi || '',
      status_gambar: g.status_gambar, tanggal_diterima: g.tanggal_diterima,
      link_drive: g.link_drive || '', keterangan: g.keterangan || '',
    });
    try {
      const refs = await fetchDocRefs('gambar', g.id);
      setFormRefs(refs.map((r) => ({ ref_type: r.ref_type, ref_id: r.ref_id })));
    } catch { setFormRefs([]); }
    setModalOpen(true);
  };

  const openDetail = async (g: Gambar) => {
    setDetailItem(g);
    setDetailPrevDocs([]);
    setDetailNextDocs([]);
    try {
      const [refs, referrers] = await Promise.all([
        fetchDocRefs('gambar', g.id),
        fetchDocReferrers('gambar', g.id),
      ]);
      const prev = refs.map((r) => {
        const doc = findDoc(r.ref_type, r.ref_id, gambar, surat, suratPenunjukan, beritaAcara);
        return doc ? toDocSummary(r.ref_type, doc) : null;
      }).filter(Boolean) as DocumentSummary[];
      const next = referrers.map((r) => {
        const doc = findDoc(r.source_type, r.source_id, gambar, surat, suratPenunjukan, beritaAcara);
        return doc ? toDocSummary(r.source_type, doc) : null;
      }).filter(Boolean) as DocumentSummary[];
      setDetailPrevDocs(prev);
      setDetailNextDocs(next);
    } catch (err) { console.error('Failed to load refs:', err); }
  };

  const handleSave = async () => {
    if (!form.judul_gambar.trim()) {
      toast.show('Judul Gambar wajib diisi', 'warning');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateGambar(editing.id, form, formRefs);
        toast.show('Data gambar berhasil diperbarui', 'success');
      } else {
        await createGambar(form, formRefs);
        toast.show('Gambar berhasil ditambahkan', 'success');
      }
      setModalOpen(false);
      onRefresh();
    } catch (err: unknown) {
      toast.show(err instanceof Error ? err.message : 'Gagal menyimpan data', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteGambar(deleteId);
      toast.show('Gambar berhasil dihapus', 'success');
      onRefresh();
    } catch (err: unknown) {
      toast.show(err instanceof Error ? err.message : 'Gagal menghapus', 'error');
    }
  };

  const clearFilters = () => {
    setFilterCluster(''); setFilterJenis(''); setFilterTahun(''); setFilterLink('');
  };

  if (detailItem) {
    const g = detailItem;
    return (
      <div className="mx-auto max-w-3xl">
        <button onClick={() => setDetailItem(null)}
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" /> Kembali ke Register
        </button>
        <div className="card overflow-hidden">
          <div className="border-b border-gray-200 bg-gradient-to-r from-brand-50 to-cyan-50 px-6 py-5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
                <FileImage className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-gray-900">{g.judul_gambar}</h2>
                <p className="mt-1 font-mono text-sm text-brand-700">{g.register_no}</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 p-6 sm:grid-cols-2">
            <DetailField label="Register No" value={g.register_no || '-'} mono />
            <DetailField label="Judul Gambar" value={g.judul_gambar} />
            <DetailField label="Cluster" value={g.cluster?.name || '-'} />
            <DetailField label="Jenis Gambar" value={g.jenis_gambar} />
            <DetailField label="Revisi" value={g.revisi || '-'} />
            <div>
              <p className="label">Status Gambar</p>
              <Badge color={g.status_gambar === 'Aktif (Latest)' ? 'green' : 'gray'}>
                {g.status_gambar === 'Aktif (Latest)' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                {g.status_gambar}
              </Badge>
            </div>
            <div>
              <p className="label">Status Tindak Lanjut</p>
              <Badge color={g.status_tindak_lanjut === 'Sudah Dibuat Surat' ? 'blue' : 'gray'}>
                {g.status_tindak_lanjut}
              </Badge>
            </div>
            <DetailField label="Tanggal Diterima" value={formatDate(g.tanggal_diterima)} />
            <div>
              <p className="label">Link Google Drive</p>
              <DriveButtons url={g.link_drive} />
            </div>
            <div className="sm:col-span-2">
              <p className="label">Keterangan</p>
              <p className="text-sm text-gray-700">{g.keterangan || '-'}</p>
            </div>
          </div>

          <DocumentRefSection
            title="Dokumen Sebelumnya"
            icon={ArrowLeftCircle}
            docs={detailPrevDocs}
            emptyMessage="Tidak ada dokumen sebelumnya."
            onOpenDoc={(type, id) => onOpenDoc?.(type, id)}
          />

          <DocumentRefSection
            title="Dokumen Berikutnya"
            icon={ArrowRightCircle}
            docs={detailNextDocs}
            emptyMessage="Belum ada dokumen yang menggunakan gambar ini sebagai referensi."
            onOpenDoc={(type, id) => onOpenDoc?.(type, id)}
          />

          <DetailActions
            isAdmin={isAdmin}
            onEdit={() => { setDetailItem(null); openEdit(g); }}
            onPrint={() => printDetail(
              g.judul_gambar,
              [
                { label: 'Nomor Register', value: g.register_no || '-' },
                { label: 'Judul Gambar', value: g.judul_gambar },
                { label: 'Cluster', value: g.cluster?.name || '-' },
                { label: 'Jenis Gambar', value: g.jenis_gambar },
                { label: 'Revisi', value: g.revisi || '-' },
                { label: 'Tanggal Diterima', value: formatDate(g.tanggal_diterima) },
                { label: 'Status Gambar', value: g.status_gambar },
                { label: 'Status Tindak Lanjut', value: g.status_tindak_lanjut },
                { label: 'Link Google Drive', value: g.link_drive || '-' },
                { label: 'Keterangan', value: g.keterangan || '-' },
              ],
              [...detailPrevDocs.map((d) => ({ label: 'Sebelumnya', register: d.register_no || d.title })),
               ...detailNextDocs.map((d) => ({ label: 'Berikutnya', register: d.register_no || d.title }))],
            )}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 max-w-xl">
          <SearchBar value={search} onChange={setSearch}
            placeholder="Cari register no, judul gambar, cluster..." />
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={openAdd}>
            <Plus className="h-4 w-4" /> Tambah Gambar
          </button>
        )}
      </div>

      <div className="card p-4">
        <FilterBar
          filters={[
            { id: 'cluster', label: 'Semua Cluster', value: filterCluster, options: clusterOptions, onChange: setFilterCluster },
            { id: 'jenis', label: 'Semua Jenis', value: filterJenis, options: jenisOptions, onChange: setFilterJenis },
            { id: 'tahun', label: 'Semua Tahun', value: filterTahun, options: yearOptions, onChange: setFilterTahun },
            { id: 'link', label: 'Semua Link', value: filterLink, options: [{ value: 'ada', label: 'Ada Dokumen' }, { value: 'kosong', label: 'Belum Ada' }], onChange: setFilterLink },
          ]}
          onClear={clearFilters}
        />
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <Loading label="Memuat register gambar..." />
        ) : filtered.length === 0 ? (
          <EmptyState icon={FileImage} message="Belum ada data gambar" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">Register No</th>
                  <th className="px-4 py-3">Judul Gambar</th>
                  <th className="px-4 py-3">Cluster</th>
                  <th className="px-4 py-3">Jenis</th>
                  <th className="px-4 py-3">Revisi</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Tindak Lanjut</th>
                  <th className="px-4 py-3">Link Google Drive</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((g) => (
                  <tr key={g.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <button onClick={() => openDetail(g)}
                        className="font-mono text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline">
                        {g.register_no || '-'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => openDetail(g)}
                        className="block w-full text-left font-medium text-gray-900 hover:text-brand-600 hover:underline">
                        {g.judul_gambar}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{g.cluster?.name || '-'}</td>
                    <td className="px-4 py-3"><Badge color={jenisColors[g.jenis_gambar] || 'gray'}>{g.jenis_gambar}</Badge></td>
                    <td className="px-4 py-3 text-gray-600">{g.revisi || '-'}</td>
                    <td className="px-4 py-3">
                      <Badge color={g.status_gambar === 'Aktif (Latest)' ? 'green' : 'gray'}>
                        {g.status_gambar === 'Aktif (Latest)' ? 'Aktif' : 'Digantikan'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge color={g.status_tindak_lanjut === 'Sudah Dibuat Surat' ? 'blue' : 'gray'}>
                        {g.status_tindak_lanjut === 'Sudah Dibuat Surat' ? 'Sudah' : 'Belum'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3"><DocumentLink url={g.link_drive} /></td>
                    <td className="px-4 py-3">
                      <TableActions
                        onPreview={() => openDetail(g)}
                        onEdit={isAdmin ? () => openEdit(g) : undefined}
                        onDelete={isAdmin ? () => setDeleteId(g.id) : undefined}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Gambar' : 'Tambah Gambar'}
        subtitle={editing ? editing.register_no || '' : 'Nomor register akan dibuat otomatis'}
        size="lg"
        footer={<>
          <button className="btn-secondary" onClick={() => setModalOpen(false)}>Batal</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Simpan'}
          </button>
        </>}>
        <GambarForm form={form} setForm={setForm} projects={projects} clusters={clusters} editing={!!editing}
          allDocs={allDocs} formRefs={formRefs} setFormRefs={setFormRefs}
          excludeId={editing?.id} excludeType="gambar" />
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Hapus Gambar" message="Apakah Anda yakin ingin menghapus data gambar ini? Tindakan ini tidak dapat dibatalkan." />
    </div>
  );
}

function GambarForm({ form, setForm, projects, clusters, editing, allDocs, formRefs, setFormRefs, excludeId, excludeType }: {
  form: GambarInput; setForm: (f: GambarInput) => void; projects: Project[]; clusters: Cluster[]; editing: boolean;
  allDocs: DocumentSummary[]; formRefs: DocRefInput[]; setFormRefs: (r: DocRefInput[]) => void;
  excludeId?: string; excludeType?: DocType;
}) {
  const set = (key: keyof GambarInput, value: unknown) => setForm({ ...form, [key]: value });
  const prefix = GAMBAR_PREFIXES[form.jenis_gambar];
  const year = new Date(form.tanggal_diterima).getFullYear();
  const yearShort = String(year).slice(2);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label className="label">Project</label>
        <select className="input" value={form.project_id || ''} onChange={(e) => set('project_id', e.target.value || null)}>
          <option value="">Tanpa Project</option>
          {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Cluster</label>
        <select className="input" value={form.cluster_id || ''} onChange={(e) => set('cluster_id', e.target.value || null)}>
          <option value="">Tanpa Cluster</option>
          {clusters.map((cluster) => <option key={cluster.id} value={cluster.id}>{cluster.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Jenis Gambar</label>
        <select className="input" value={form.jenis_gambar} onChange={(e) => set('jenis_gambar', e.target.value as JenisGambar)}>
          {JENIS_GAMBAR_LIST.map((j) => <option key={j} value={j}>{j}</option>)}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="label">Judul Gambar *</label>
        <input className="input" value={form.judul_gambar} onChange={(e) => set('judul_gambar', e.target.value)} placeholder="cth: Layout Pondasi" />
      </div>
      <div>
        <label className="label">Revisi</label>
        <input className="input" value={form.revisi} onChange={(e) => set('revisi', e.target.value)} placeholder="cth: 0, A, B" />
      </div>
      <div>
        <label className="label">Status Gambar</label>
        <select className="input" value={form.status_gambar} onChange={(e) => set('status_gambar', e.target.value as StatusGambar)}>
          {STATUS_GAMBAR_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Tanggal Diterima</label>
        <input type="date" className="input" value={form.tanggal_diterima} onChange={(e) => set('tanggal_diterima', e.target.value)} />
      </div>
      <div className="sm:col-span-2">
        <DocumentRefSelect
          allDocs={allDocs}
          selectedRefs={formRefs}
          onChange={setFormRefs}
          excludeId={excludeId}
          excludeType={excludeType}
        />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Link Google Drive (Opsional)</label>
        <input className="input" value={form.link_drive} onChange={(e) => set('link_drive', e.target.value)} placeholder="https://drive.google.com/..." />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Keterangan (Opsional)</label>
        <textarea className="input min-h-[80px]" value={form.keterangan} onChange={(e) => set('keterangan', e.target.value)} placeholder="Catatan tambahan..." />
      </div>
      {!editing && (
        <div className="sm:col-span-2 rounded-lg bg-brand-50 border border-brand-100 px-4 py-3">
          <p className="text-xs text-gray-600">Nomor Register yang akan dibuat:</p>
          <p className="mt-1 font-mono text-sm font-bold text-brand-700">
            {prefix}-{yearShort}-XXXX <span className="font-normal text-gray-400">(auto)</span>
          </p>
        </div>
      )}
    </div>
  );
}
