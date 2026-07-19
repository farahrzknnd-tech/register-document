import { useMemo, useState, useEffect } from 'react';
import { Plus, FileCheck, ArrowLeft, ArrowLeftCircle, ArrowRightCircle } from 'lucide-react';
import type { BeritaAcara, Gambar, Surat, SuratPenunjukan, JenisBeritaAcara, DocType, DocumentSummary, UserRole, Project, Cluster } from '../lib/types';
import { JENIS_BERITA_ACARA_LIST, BERITA_ACARA_PREFIXES } from '../lib/types';
import {
  createBeritaAcara, updateBeritaAcara, deleteBeritaAcara,
  fetchDocRefs, fetchDocReferrers, setDocRefs,
  type BeritaAcaraInput, type DocRefInput,
} from '../lib/api';
import { useToast } from '../components/Toast';
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

interface BeritaAcaraPageProps {
  beritaAcara: BeritaAcara[];
  gambar: Gambar[];
  surat: Surat[];
  suratPenunjukan: SuratPenunjukan[];
  clusters: Cluster[];
  projects: Project[];
  loading: boolean;
  role: UserRole;
  onRefresh: () => void;
  onOpenDoc?: (type: DocType, id: string) => void;
  initialDetailItem?: BeritaAcara | null;
  onConsumeInitialDetail?: () => void;
}

interface BAFormState extends BeritaAcaraInput {
  _refs: DocRefInput[];
}

const emptyForm: BAFormState = {
  project_id: '',
  cluster_id: null,
  jenis_berita_acara: 'Berita Acara Aanwijzing',
  tanggal: new Date().toISOString().slice(0, 10),
  perihal: '', link_drive: '', keterangan: '',
  _refs: [],
};

const jenisColors: Record<string, string> = {
  'Berita Acara Aanwijzing': 'amber',
  'Berita Acara Klarifikasi': 'purple',
};

export function RegisterBeritaAcara({ beritaAcara, gambar, surat, suratPenunjukan, clusters, projects, loading, role, onRefresh, onOpenDoc, initialDetailItem, onConsumeInitialDetail }: BeritaAcaraPageProps) {
  const isAdmin = role === 'admin';
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [filterJenis, setFilterJenis] = useState('');
  const [filterTahun, setFilterTahun] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BeritaAcara | null>(null);
  const [form, setForm] = useState<BAFormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [detailItem, setDetailItem] = useState<BeritaAcara | null>(null);
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
    beritaAcara.forEach((b) => ys.add(new Date(b.tanggal).getFullYear()));
    return Array.from(ys).sort((a, b) => b - a);
  }, [beritaAcara]);

  const jenisOptions: FilterOption[] = JENIS_BERITA_ACARA_LIST.map((j) => ({ value: j, label: j }));
  const yearOptions: FilterOption[] = years.map((y) => ({ value: String(y), label: String(y) }));

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return beritaAcara.filter((b) => {
      if (q) {
        const hay = [b.register_no || '', b.perihal, b.jenis_berita_acara].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filterJenis && b.jenis_berita_acara !== filterJenis) return false;
      if (filterTahun && new Date(b.tanggal).getFullYear() !== Number(filterTahun)) return false;
      return true;
    });
  }, [beritaAcara, search, filterJenis, filterTahun]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = async (b: BeritaAcara) => {
    setEditing(b);
    setForm({
      project_id: b.project_id,
      cluster_id: b.cluster_id,
      jenis_berita_acara: b.jenis_berita_acara,
      tanggal: b.tanggal,
      perihal: b.perihal,
      link_drive: b.link_drive || '',
      keterangan: b.keterangan || '',
      _refs: [],
    });
    try {
      const refs = await fetchDocRefs('berita_acara', b.id);
      setForm((prev) => ({ ...prev, _refs: refs.map((r) => ({ ref_type: r.ref_type, ref_id: r.ref_id })) }));
    } catch { /* empty */ }
    setModalOpen(true);
  };

  const openDetail = async (b: BeritaAcara) => {
    setDetailItem(b);
    setDetailPrevDocs([]);
    setDetailNextDocs([]);
    try {
      const [refs, referrers] = await Promise.all([
        fetchDocRefs('berita_acara', b.id),
        fetchDocReferrers('berita_acara', b.id),
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
    if (!form.perihal.trim()) {
      toast.show('Perihal wajib diisi', 'warning');
      return;
    }
    setSaving(true);
    try {
      const { _refs, ...baData } = form;
      if (editing) {
        await updateBeritaAcara(editing.id, baData);
        await setDocRefs('berita_acara', editing.id, _refs);
        toast.show('Berita Acara berhasil diperbarui', 'success');
      } else {
        const created = await createBeritaAcara(baData);
        await setDocRefs('berita_acara', created.id, _refs);
        toast.show('Berita Acara berhasil ditambahkan', 'success');
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
      await deleteBeritaAcara(deleteId);
      toast.show('Berita Acara berhasil dihapus', 'success');
      onRefresh();
    } catch (err: unknown) {
      toast.show(err instanceof Error ? err.message : 'Gagal menghapus', 'error');
    }
  };

  const clearFilters = () => { setFilterJenis(''); setFilterTahun(''); };

  if (detailItem) {
    const b = detailItem;
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
                <FileCheck className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-gray-900">{b.perihal}</h2>
                <p className="mt-1 font-mono text-sm text-brand-700">{b.register_no}</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 p-6 sm:grid-cols-2">
            <DetailField label="Register No" value={b.register_no || '-'} mono />
            <div>
              <p className="label">Jenis Berita Acara</p>
              <Badge color={jenisColors[b.jenis_berita_acara] || 'gray'}>{b.jenis_berita_acara}</Badge>
            </div>
            <DetailField label="Tanggal" value={formatDate(b.tanggal)} />
            <DetailField label="Perihal" value={b.perihal} />
            <div>
              <p className="label">Link Google Drive</p>
              <DriveButtons url={b.link_drive} />
            </div>
            <div className="sm:col-span-2">
              <p className="label">Keterangan</p>
              <p className="text-sm text-gray-700">{b.keterangan || '-'}</p>
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
            emptyMessage="Belum ada dokumen yang menggunakan berita acara ini sebagai referensi."
            onOpenDoc={(type, id) => onOpenDoc?.(type, id)}
          />

          <DetailActions
            isAdmin={isAdmin}
            onEdit={() => { setDetailItem(null); openEdit(b); }}
            onPrint={() => printDetail(
              b.perihal,
              [
                { label: 'Nomor Register', value: b.register_no || '-' },
                { label: 'Jenis Berita Acara', value: b.jenis_berita_acara },
                { label: 'Tanggal', value: formatDate(b.tanggal) },
                { label: 'Perihal', value: b.perihal },
                { label: 'Link Google Drive', value: b.link_drive || '-' },
                { label: 'Keterangan', value: b.keterangan || '-' },
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
            placeholder="Cari register no, perihal, jenis berita acara..." />
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={openAdd}>
            <Plus className="h-4 w-4" /> Tambah Berita Acara
          </button>
        )}
      </div>

      <div className="card p-4">
        <FilterBar
          filters={[
            { id: 'jenis', label: 'Semua Jenis', value: filterJenis, options: jenisOptions, onChange: setFilterJenis },
            { id: 'tahun', label: 'Semua Tahun', value: filterTahun, options: yearOptions, onChange: setFilterTahun },
          ]}
          onClear={clearFilters}
        />
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <Loading label="Memuat register berita acara..." />
        ) : filtered.length === 0 ? (
          <EmptyState icon={FileCheck} message="Belum ada data Berita Acara" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">Register No</th>
                  <th className="px-4 py-3">Jenis Berita Acara</th>
                  <th className="px-4 py-3">Perihal</th>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Link Google Drive</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <button onClick={() => openDetail(b)}
                        className="font-mono text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline">
                        {b.register_no || '-'}
                      </button>
                    </td>
                    <td className="px-4 py-3"><Badge color={jenisColors[b.jenis_berita_acara] || 'gray'}>{b.jenis_berita_acara}</Badge></td>
                    <td className="px-4 py-3">
                      <button onClick={() => openDetail(b)}
                        className="font-medium text-gray-900 hover:text-brand-600 hover:underline">
                        {b.perihal}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(b.tanggal)}</td>
                    <td className="px-4 py-3"><DocumentLink url={b.link_drive} /></td>
                    <td className="px-4 py-3">
                      <TableActions
                        onPreview={() => openDetail(b)}
                        onEdit={isAdmin ? () => openEdit(b) : undefined}
                        onDelete={isAdmin ? () => setDeleteId(b.id) : undefined}
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
        title={editing ? 'Edit Berita Acara' : 'Tambah Berita Acara'}
        subtitle={editing ? editing.register_no || '' : 'Nomor register akan dibuat otomatis'}
        size="lg"
        footer={<>
          <button className="btn-secondary" onClick={() => setModalOpen(false)}>Batal</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Simpan'}
          </button>
        </>}>
        <BeritaAcaraForm form={form} setForm={setForm} projects={projects} clusters={clusters} editing={!!editing}
          allDocs={allDocs} excludeId={editing?.id} excludeType="berita_acara" />
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Hapus Berita Acara" message="Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan." />
    </div>
  );
}

function BeritaAcaraForm({ form, setForm, projects, clusters, editing, allDocs, excludeId, excludeType }: {
  form: BAFormState; setForm: (f: BAFormState) => void; projects: Project[]; clusters: Cluster[]; editing: boolean;
  allDocs: DocumentSummary[]; excludeId?: string; excludeType?: DocType;
}) {
  const set = (key: keyof BAFormState, value: unknown) => setForm({ ...form, [key]: value });
  const prefix = BERITA_ACARA_PREFIXES[form.jenis_berita_acara];
  const year = new Date(form.tanggal).getFullYear();
  const yearShort = String(year).slice(2);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label className="label">Project *</label>
        <select className="input" value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value, cluster_id: null })}>
          <option value="">Pilih Project</option>
          {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Cluster</label>
        <select className="input" value={form.cluster_id || ''} onChange={(e) => set('cluster_id', e.target.value || null)} disabled={!form.project_id}>
          <option value="">Tanpa Cluster</option>
          {clusters.filter((cluster) => cluster.project_id === form.project_id).map((cluster) => <option key={cluster.id} value={cluster.id}>{cluster.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Jenis Berita Acara</label>
        <select className="input" value={form.jenis_berita_acara} onChange={(e) => set('jenis_berita_acara', e.target.value as JenisBeritaAcara)}>
          {JENIS_BERITA_ACARA_LIST.map((j) => <option key={j} value={j}>{j}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Tanggal</label>
        <input type="date" className="input" value={form.tanggal} onChange={(e) => set('tanggal', e.target.value)} />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Perihal *</label>
        <input className="input" value={form.perihal} onChange={(e) => set('perihal', e.target.value)} placeholder="cth: Berita Acara Aanwijzing Pekerjaan X" />
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
