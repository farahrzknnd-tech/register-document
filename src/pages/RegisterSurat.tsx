import { useMemo, useState, useEffect } from 'react';
import { Plus, Mail, ArrowLeft, Inbox, Send, ArrowLeftCircle, ArrowRightCircle } from 'lucide-react';
import type { Surat, Gambar, SuratPenunjukan, BeritaAcara, Cluster, Project, JenisSurat, DocType, DocumentSummary, UserRole } from '../lib/types';
import { JENIS_SURAT_LIST, KATEGORI_SURAT_LIST, SURAT_PREFIXES } from '../lib/types';
import {
  createSurat, updateSurat, deleteSurat,
  fetchDocRefs, fetchDocReferrers,
  type SuratInput, type DocRefInput,
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

interface SuratPageProps {
  surat: Surat[];
  gambar: Gambar[];
  suratPenunjukan: SuratPenunjukan[];
  beritaAcara: BeritaAcara[];
  clusters: Cluster[];
  projects: Project[];
  loading: boolean;
  role: UserRole;
  onRefresh: () => void;
  onOpenDoc?: (type: DocType, id: string) => void;
  initialDetailItem?: Surat | null;
  onConsumeInitialDetail?: () => void;
}

interface SuratFormState extends SuratInput {
  _refs: DocRefInput[];
}

const emptyForm: SuratFormState = {
  project_id: null,
  nomor_surat: '', perihal: '', cluster_id: null,
  jenis_surat: 'Surat Masuk', kategori_surat: null,
  pengirim: '', penerima: '',
  tanggal_surat: new Date().toISOString().slice(0, 10), link_drive: '', keterangan: '',
  _refs: [],
};

export function RegisterSurat({ surat, gambar, suratPenunjukan, beritaAcara, clusters, projects, loading, role, onRefresh, onOpenDoc, initialDetailItem, onConsumeInitialDetail }: SuratPageProps) {
  const isAdmin = role === 'admin';
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [filterCluster, setFilterCluster] = useState('');
  const [filterJenis, setFilterJenis] = useState('');
  const [filterTahun, setFilterTahun] = useState('');
  const [filterLink, setFilterLink] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Surat | null>(null);
  const [form, setForm] = useState<SuratFormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [detailItem, setDetailItem] = useState<Surat | null>(null);
  const [detailPrevDocs, setDetailPrevDocs] = useState<DocumentSummary[]>([]);
  const [detailNextDocs, setDetailNextDocs] = useState<DocumentSummary[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const allDocs = useMemo(() => buildAllDocSummaries(gambar, surat, suratPenunjukan, beritaAcara), [gambar, surat, suratPenunjukan, beritaAcara]);

  useEffect(() => {
    if (initialDetailItem) {
      openDetail(initialDetailItem);
      onConsumeInitialDetail?.();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDetailItem, onConsumeInitialDetail]);

  const years = useMemo(() => {
    const ys = new Set<number>();
    surat.forEach((s) => ys.add(new Date(s.tanggal_surat).getFullYear()));
    return Array.from(ys).sort((a, b) => b - a);
  }, [surat]);

  const clusterOptions: FilterOption[] = clusters.map((c) => ({ value: c.id, label: c.name }));
  const jenisOptions: FilterOption[] = JENIS_SURAT_LIST.map((j) => ({ value: j, label: j }));
  const yearOptions: FilterOption[] = years.map((y) => ({ value: String(y), label: String(y) }));

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return surat.filter((s) => {
      if (q) {
        const hay = [s.register_no || '', s.nomor_surat, s.perihal, s.cluster?.name || '', s.jenis_surat, s.kategori_surat || ''].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filterCluster && s.cluster_id !== filterCluster) return false;
      if (filterJenis && s.jenis_surat !== filterJenis) return false;
      if (filterTahun && new Date(s.tanggal_surat).getFullYear() !== Number(filterTahun)) return false;
      if (filterLink === 'ada' && !s.link_drive) return false;
      if (filterLink === 'kosong' && s.link_drive) return false;
      return true;
    });
  }, [surat, search, filterCluster, filterJenis, filterTahun, filterLink]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = async (s: Surat) => {
    setEditing(s);
    setForm({
      project_id: s.project_id, nomor_surat: s.nomor_surat, perihal: s.perihal, cluster_id: s.cluster_id,
      jenis_surat: s.jenis_surat, kategori_surat: s.kategori_surat,
      pengirim: s.pengirim || '', penerima: s.penerima || '',
      tanggal_surat: s.tanggal_surat, link_drive: s.link_drive || '', keterangan: s.keterangan || '',
      _refs: [],
    });
    try {
      const refs = await fetchDocRefs('surat', s.id);
      setForm((prev) => ({ ...prev, _refs: refs.map((r) => ({ ref_type: r.ref_type, ref_id: r.ref_id })) }));
    } catch { /* empty */ }
    setModalOpen(true);
  };

  const openDetail = async (s: Surat) => {
    setDetailItem(s);
    setDetailPrevDocs([]);
    setDetailNextDocs([]);
    try {
      const [refs, referrers] = await Promise.all([
        fetchDocRefs('surat', s.id),
        fetchDocReferrers('surat', s.id),
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
    if (!form.nomor_surat.trim() || !form.perihal.trim()) {
      toast.show('Nomor Surat dan Perihal wajib diisi', 'warning');
      return;
    }
    setSaving(true);
    try {
      const { _refs, ...suratData } = form;
      if (editing) {
        await updateSurat(editing.id, suratData, _refs);
        toast.show('Data surat berhasil diperbarui', 'success');
      } else {
        await createSurat(suratData, _refs);
        toast.show('Surat berhasil ditambahkan', 'success');
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
      await deleteSurat(deleteId);
      toast.show('Surat berhasil dihapus', 'success');
      onRefresh();
    } catch (err: unknown) {
      toast.show(err instanceof Error ? err.message : 'Gagal menghapus', 'error');
    }
  };

  const clearFilters = () => {
    setFilterCluster(''); setFilterJenis(''); setFilterTahun(''); setFilterLink('');
  };

  if (detailItem) {
    const s = detailItem;
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
                {s.jenis_surat === 'Surat Masuk' ? <Inbox className="h-6 w-6" /> : <Send className="h-6 w-6" />}
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-gray-900">{s.perihal}</h2>
                <p className="mt-1 font-mono text-sm text-brand-700">{s.register_no}</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 p-6 sm:grid-cols-2">
            <DetailField label="Register No" value={s.register_no || '-'} mono />
            <DetailField label="Nomor Surat" value={s.nomor_surat} />
            <DetailField label="Perihal" value={s.perihal} />
            <DetailField label="Cluster" value={s.cluster?.name || '-'} />
            <div>
              <p className="label">Jenis Surat</p>
              <Badge color={s.jenis_surat === 'Surat Masuk' ? 'blue' : 'amber'}>
                {s.jenis_surat === 'Surat Masuk' ? <Inbox className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
                {s.jenis_surat}
              </Badge>
            </div>
            {s.jenis_surat === 'Surat Keluar' && (
              <DetailField label="Kategori Surat" value={s.kategori_surat || '-'} />
            )}
            <DetailField label="Pengirim" value={s.pengirim || '-'} />
            <DetailField label="Penerima" value={s.penerima || '-'} />
            <DetailField label="Tanggal Surat" value={formatDate(s.tanggal_surat)} />
            <div>
              <p className="label">Link Google Drive</p>
              <DriveButtons url={s.link_drive} />
            </div>
            <div className="sm:col-span-2">
              <p className="label">Keterangan</p>
              <p className="text-sm text-gray-700">{s.keterangan || '-'}</p>
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
            emptyMessage="Belum ada dokumen yang menggunakan surat ini sebagai referensi."
            onOpenDoc={(type, id) => onOpenDoc?.(type, id)}
          />

          <DetailActions
            isAdmin={isAdmin}
            onEdit={() => { setDetailItem(null); openEdit(s); }}
            onPrint={() => printDetail(
              s.perihal,
              [
                { label: 'Nomor Register', value: s.register_no || '-' },
                { label: 'Nomor Surat', value: s.nomor_surat },
                { label: 'Perihal', value: s.perihal },
                { label: 'Cluster', value: s.cluster?.name || '-' },
                { label: 'Jenis Surat', value: s.jenis_surat },
                { label: 'Kategori Surat', value: s.kategori_surat || '-' },
                { label: 'Pengirim', value: s.pengirim || '-' },
                { label: 'Penerima', value: s.penerima || '-' },
                { label: 'Tanggal Surat', value: formatDate(s.tanggal_surat) },
                { label: 'Link Google Drive', value: s.link_drive || '-' },
                { label: 'Keterangan', value: s.keterangan || '-' },
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
            placeholder="Cari register no, nomor surat, perihal, cluster..." />
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={openAdd}>
            <Plus className="h-4 w-4" /> Tambah Surat
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
          <Loading label="Memuat register surat..." />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Mail} message="Belum ada data surat" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">Register No</th>
                  <th className="px-4 py-3">Nomor Surat</th>
                  <th className="px-4 py-3">Perihal</th>
                  <th className="px-4 py-3">Cluster</th>
                  <th className="px-4 py-3">Jenis</th>
                  <th className="px-4 py-3">Pengirim</th>
                  <th className="px-4 py-3">Penerima</th>
                  <th className="px-4 py-3">Tgl Surat</th>
                  <th className="px-4 py-3">Link</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <button onClick={() => openDetail(s)}
                        className="font-mono text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline">
                        {s.register_no || '-'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => openDetail(s)}
                        className="block w-full text-left font-medium text-gray-900 hover:text-brand-600 hover:underline">
                        {s.nomor_surat}
                      </button>
                    </td>
                    <td className="px-4 py-3 max-w-[200px] truncate text-gray-600" title={s.perihal}>{s.perihal}</td>
                    <td className="px-4 py-3 text-gray-600">{s.cluster?.name || '-'}</td>
                    <td className="px-4 py-3"><Badge color={s.jenis_surat === 'Surat Masuk' ? 'blue' : 'amber'}>{s.jenis_surat === 'Surat Masuk' ? 'Masuk' : 'Keluar'}</Badge></td>
                    <td className="px-4 py-3 text-gray-600">{s.pengirim || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{s.penerima || '-'}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(s.tanggal_surat)}</td>
                    <td className="px-4 py-3"><DocumentLink url={s.link_drive} /></td>
                    <td className="px-4 py-3">
                      <TableActions
                        onPreview={() => openDetail(s)}
                        onEdit={isAdmin ? () => openEdit(s) : undefined}
                        onDelete={isAdmin ? () => setDeleteId(s.id) : undefined}
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
        title={editing ? 'Edit Surat' : 'Tambah Surat'}
        subtitle={editing ? editing.register_no || '' : 'Nomor register akan dibuat otomatis'}
        size="lg"
        footer={<>
          <button className="btn-secondary" onClick={() => setModalOpen(false)}>Batal</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Simpan'}
          </button>
        </>}>
        <SuratForm form={form} setForm={setForm} projects={projects} clusters={clusters} editing={!!editing}
          allDocs={allDocs} excludeId={editing?.id} excludeType="surat" />
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Hapus Surat" message="Apakah Anda yakin ingin menghapus data surat ini? Tindakan ini tidak dapat dibatalkan." />
    </div>
  );
}

function SuratForm({ form, setForm, projects, clusters, editing, allDocs, excludeId, excludeType }: {
  form: SuratFormState; setForm: (f: SuratFormState) => void; projects: Project[]; clusters: Cluster[]; editing: boolean;
  allDocs: DocumentSummary[]; excludeId?: string; excludeType?: DocType;
}) {
  const set = (key: keyof SuratFormState, value: unknown) => setForm({ ...form, [key]: value });
  const prefix = SURAT_PREFIXES[form.jenis_surat];
  const year = new Date(form.tanggal_surat).getFullYear();
  const yearShort = String(year).slice(2);

  const handleJenisChange = (jenis: JenisSurat) => {
    if (jenis === 'Surat Masuk') {
      setForm({ ...form, jenis_surat: jenis, kategori_surat: null });
    } else {
      setForm({ ...form, jenis_surat: jenis, kategori_surat: 'Surat Keluar' });
    }
  };

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
        <label className="label">Jenis Surat</label>
        <select className="input" value={form.jenis_surat} onChange={(e) => handleJenisChange(e.target.value as JenisSurat)}>
          {JENIS_SURAT_LIST.map((j) => <option key={j} value={j}>{j}</option>)}
        </select>
      </div>
      {form.jenis_surat === 'Surat Keluar' && (
        <div>
          <label className="label">Kategori Surat</label>
          <select className="input" value={form.kategori_surat || 'Surat Keluar'} onChange={(e) => set('kategori_surat', e.target.value)}>
            {KATEGORI_SURAT_LIST.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
      )}
      <div>
        <label className="label">Nomor Surat *</label>
        <input className="input" value={form.nomor_surat} onChange={(e) => set('nomor_surat', e.target.value)} placeholder="cth: 001/ABC/2026" />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Perihal *</label>
        <input className="input" value={form.perihal} onChange={(e) => set('perihal', e.target.value)} placeholder="cth: Permohonan Approval Gambar" />
      </div>
      <div>
        <label className="label">Pengirim</label>
        <input className="input" value={form.pengirim} onChange={(e) => set('pengirim', e.target.value)} placeholder="Nama pengirim" />
      </div>
      <div>
        <label className="label">Penerima</label>
        <input className="input" value={form.penerima} onChange={(e) => set('penerima', e.target.value)} placeholder="Nama penerima" />
      </div>
      <div>
        <label className="label">Tanggal Surat</label>
        <input type="date" className="input" value={form.tanggal_surat} onChange={(e) => set('tanggal_surat', e.target.value)} />
      </div>
      <div className="sm:col-span-2">
        <DocumentRefSelect
          allDocs={allDocs}
          selectedRefs={form._refs}
          onChange={(refs) => set('_refs', refs)}
          excludeId={excludeId}
          excludeType={excludeType}
        />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Link Google Drive (Opsional)</label>
        <input className="input" value={form.link_drive} onChange={(e) => set('link_drive', e.target.value)} placeholder="https://drive.google.com/..." />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Keterangan</label>
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
