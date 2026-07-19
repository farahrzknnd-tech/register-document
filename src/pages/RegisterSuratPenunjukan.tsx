import { useMemo, useState, useEffect } from 'react';
import { Plus, FileSignature, ArrowLeft, ArrowLeftCircle, ArrowRightCircle } from 'lucide-react';
import type { SuratPenunjukan, Gambar, Surat, BeritaAcara, DocType, DocumentSummary, UserRole, Project, Cluster } from '../lib/types';
import {
  createSuratPenunjukan, updateSuratPenunjukan, deleteSuratPenunjukan,
  fetchDocRefs, fetchDocReferrers,
  type SuratPenunjukanInput, type DocRefInput,
} from '../lib/api';
import { useToast } from '../components/Toast';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { SearchBar } from '../components/SearchBar';
import { FilterBar, type FilterOption } from '../components/FilterBar';
import { DocumentLink } from '../components/DocumentLink';
import { DocumentRefSelect } from '../components/DocumentRefSelect';
import { DocumentRefSection } from '../components/DocumentRefSection';
import { Loading } from '../components/Loading';
import { DetailField, EmptyState, TableActions } from '../components/shared';
import { DriveButtons, DetailActions } from '../components/DetailActions';
import { printDetail } from '../lib/export';
import { formatDate, calcDurasi, buildAllDocSummaries, findDoc, toDocSummary } from '../lib/utils';

interface SuratPenunjukanPageProps {
  suratPenunjukan: SuratPenunjukan[];
  gambar: Gambar[];
  surat: Surat[];
  beritaAcara: BeritaAcara[];
  clusters: Cluster[];
  projects: Project[];
  loading: boolean;
  role: UserRole;
  onRefresh: () => void;
  onOpenDoc?: (type: DocType, id: string) => void;
  initialDetailItem?: SuratPenunjukan | null;
  onConsumeInitialDetail?: () => void;
}

interface SPFormState extends SuratPenunjukanInput {
  _refs: DocRefInput[];
}

const emptyForm: SPFormState = {
  project_id: '',
  cluster_id: null,
  nomor_sp: '', tanggal_sp: new Date().toISOString().slice(0, 10),
  nama_kontraktor: '', jenis_pekerjaan: '', lokasi: '',
  tanggal_start: null, tanggal_finish: null, tanggal_kickoff: null,
  link_risalah: '', keterangan: '',
  _refs: [],
};

export function RegisterSuratPenunjukan({ suratPenunjukan, gambar, surat, beritaAcara, clusters, projects, loading, role, onRefresh, onOpenDoc, initialDetailItem, onConsumeInitialDetail }: SuratPenunjukanPageProps) {
  const isAdmin = role === 'admin';
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [filterTahun, setFilterTahun] = useState('');
  const [filterKontraktor, setFilterKontraktor] = useState('');
  const [filterJenis, setFilterJenis] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SuratPenunjukan | null>(null);
  const [form, setForm] = useState<SPFormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [detailItem, setDetailItem] = useState<SuratPenunjukan | null>(null);
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
    suratPenunjukan.forEach((s) => ys.add(new Date(s.tanggal_sp).getFullYear()));
    return Array.from(ys).sort((a, b) => b - a);
  }, [suratPenunjukan]);

  const kontraktorOptions: FilterOption[] = useMemo(() => {
    const set = new Set<string>();
    suratPenunjukan.forEach((s) => { if (s.nama_kontraktor) set.add(s.nama_kontraktor); });
    return Array.from(set).sort().map((k) => ({ value: k, label: k }));
  }, [suratPenunjukan]);

  const jenisOptions: FilterOption[] = useMemo(() => {
    const set = new Set<string>();
    suratPenunjukan.forEach((s) => { if (s.jenis_pekerjaan) set.add(s.jenis_pekerjaan); });
    return Array.from(set).sort().map((j) => ({ value: j, label: j }));
  }, [suratPenunjukan]);

  const yearOptions: FilterOption[] = years.map((y) => ({ value: String(y), label: String(y) }));

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return suratPenunjukan.filter((s) => {
      if (q) {
        const hay = [s.register_no || '', s.nomor_sp, s.nama_kontraktor, s.jenis_pekerjaan, s.lokasi || ''].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filterTahun && new Date(s.tanggal_sp).getFullYear() !== Number(filterTahun)) return false;
      if (filterKontraktor && s.nama_kontraktor !== filterKontraktor) return false;
      if (filterJenis && s.jenis_pekerjaan !== filterJenis) return false;
      return true;
    });
  }, [suratPenunjukan, search, filterTahun, filterKontraktor, filterJenis]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = async (s: SuratPenunjukan) => {
    setEditing(s);
    setForm({
      project_id: s.project_id, cluster_id: s.cluster_id, nomor_sp: s.nomor_sp, tanggal_sp: s.tanggal_sp,
      nama_kontraktor: s.nama_kontraktor, jenis_pekerjaan: s.jenis_pekerjaan,
      lokasi: s.lokasi || '', tanggal_start: s.tanggal_start, tanggal_finish: s.tanggal_finish,
      tanggal_kickoff: s.tanggal_kickoff, link_risalah: s.link_risalah || '', keterangan: s.keterangan || '',
      _refs: [],
    });
    try {
      const refs = await fetchDocRefs('surat_penunjukan', s.id);
      setForm((prev) => ({ ...prev, _refs: refs.map((r) => ({ ref_type: r.ref_type, ref_id: r.ref_id })) }));
    } catch { /* empty */ }
    setModalOpen(true);
  };

  const openDetail = async (s: SuratPenunjukan) => {
    setDetailItem(s);
    setDetailPrevDocs([]);
    setDetailNextDocs([]);
    try {
      const [refs, referrers] = await Promise.all([
        fetchDocRefs('surat_penunjukan', s.id),
        fetchDocReferrers('surat_penunjukan', s.id),
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
    if (!form.nomor_sp.trim() || !form.nama_kontraktor.trim() || !form.jenis_pekerjaan.trim()) {
      toast.show('Nomor SP, Nama Kontraktor, dan Jenis Pekerjaan wajib diisi', 'warning');
      return;
    }
    setSaving(true);
    try {
      const { _refs, ...spData } = form;
      if (editing) {
        await updateSuratPenunjukan(editing.id, spData, _refs);
        toast.show('Data Surat Penunjukan berhasil diperbarui', 'success');
      } else {
        await createSuratPenunjukan(spData, _refs);
        toast.show('Surat Penunjukan berhasil ditambahkan', 'success');
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
      await deleteSuratPenunjukan(deleteId);
      toast.show('Surat Penunjukan berhasil dihapus', 'success');
      onRefresh();
    } catch (err: unknown) {
      toast.show(err instanceof Error ? err.message : 'Gagal menghapus', 'error');
    }
  };

  const clearFilters = () => { setFilterTahun(''); setFilterKontraktor(''); setFilterJenis(''); };

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
                <FileSignature className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-gray-900">{s.nomor_sp}</h2>
                <p className="mt-1 font-mono text-sm text-brand-700">{s.register_no}</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 p-6 sm:grid-cols-2">
            <DetailField label="Register No" value={s.register_no || '-'} mono />
            <DetailField label="Nomor Surat Penunjukan" value={s.nomor_sp} />
            <DetailField label="Tanggal Surat Penunjukan" value={formatDate(s.tanggal_sp)} />
            <DetailField label="Nama Kontraktor" value={s.nama_kontraktor} />
            <DetailField label="Jenis Pekerjaan" value={s.jenis_pekerjaan} />
            <DetailField label="Lokasi" value={s.lokasi || '-'} />
            <DetailField label="Tanggal Start" value={formatDate(s.tanggal_start)} />
            <DetailField label="Tanggal Finish" value={formatDate(s.tanggal_finish)} />
            <DetailField label="Durasi" value={s.durasi != null ? `${s.durasi} hari` : '-'} />
            <DetailField label="Tanggal Kick Off Meeting" value={formatDate(s.tanggal_kickoff)} />
            <div>
              <p className="label">Link Risalah Meeting Kick Off</p>
              <DriveButtons url={s.link_risalah} />
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
            emptyMessage="Belum ada dokumen yang menggunakan surat penunjukan ini sebagai referensi."
            onOpenDoc={(type, id) => onOpenDoc?.(type, id)}
          />

          <DetailActions
            isAdmin={isAdmin}
            onEdit={() => { setDetailItem(null); openEdit(s); }}
            onPrint={() => printDetail(
              s.nomor_sp,
              [
                { label: 'Nomor Register', value: s.register_no || '-' },
                { label: 'Nomor SP', value: s.nomor_sp },
                { label: 'Tanggal SP', value: formatDate(s.tanggal_sp) },
                { label: 'Nama Kontraktor', value: s.nama_kontraktor },
                { label: 'Jenis Pekerjaan', value: s.jenis_pekerjaan },
                { label: 'Lokasi', value: s.lokasi || '-' },
                { label: 'Tanggal Mulai', value: s.tanggal_start ? formatDate(s.tanggal_start) : '-' },
                { label: 'Tanggal Selesai', value: s.tanggal_finish ? formatDate(s.tanggal_finish) : '-' },
                { label: 'Durasi (hari)', value: s.durasi?.toString() || '-' },
                { label: 'Tanggal Kick Off', value: s.tanggal_kickoff ? formatDate(s.tanggal_kickoff) : '-' },
                { label: 'Link Risalah', value: s.link_risalah || '-' },
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
            placeholder="Cari nomor SP, kontraktor, jenis pekerjaan, lokasi..." />
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={openAdd}>
            <Plus className="h-4 w-4" /> Tambah Surat Penunjukan
          </button>
        )}
      </div>

      <div className="card p-4">
        <FilterBar
          filters={[
            { id: 'tahun', label: 'Semua Tahun', value: filterTahun, options: yearOptions, onChange: setFilterTahun },
            { id: 'kontraktor', label: 'Semua Kontraktor', value: filterKontraktor, options: kontraktorOptions, onChange: setFilterKontraktor },
            { id: 'jenis', label: 'Semua Jenis Pekerjaan', value: filterJenis, options: jenisOptions, onChange: setFilterJenis },
          ]}
          onClear={clearFilters}
        />
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <Loading label="Memuat register surat penunjukan..." />
        ) : filtered.length === 0 ? (
          <EmptyState icon={FileSignature} message="Belum ada data Surat Penunjukan" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">Register No</th>
                  <th className="px-4 py-3">Nomor SP</th>
                  <th className="px-4 py-3">Tgl SP</th>
                  <th className="px-4 py-3">Nama Kontraktor</th>
                  <th className="px-4 py-3">Jenis Pekerjaan</th>
                  <th className="px-4 py-3">Lokasi</th>
                  <th className="px-4 py-3">Start</th>
                  <th className="px-4 py-3">Finish</th>
                  <th className="px-4 py-3">Durasi</th>
                  <th className="px-4 py-3">Tgl Kick Off</th>
                  <th className="px-4 py-3">Link Risalah</th>
                  <th className="px-4 py-3 text-right">Action</th>
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
                        className="font-medium text-gray-900 hover:text-brand-600 hover:underline">
                        {s.nomor_sp}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(s.tanggal_sp)}</td>
                    <td className="px-4 py-3 text-gray-600">{s.nama_kontraktor}</td>
                    <td className="px-4 py-3 text-gray-600">{s.jenis_pekerjaan}</td>
                    <td className="px-4 py-3 text-gray-600">{s.lokasi || '-'}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(s.tanggal_start)}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(s.tanggal_finish)}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{s.durasi != null ? `${s.durasi} hari` : '-'}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(s.tanggal_kickoff)}</td>
                    <td className="px-4 py-3"><DocumentLink url={s.link_risalah} /></td>
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
        title={editing ? 'Edit Surat Penunjukan' : 'Tambah Surat Penunjukan'}
        subtitle={editing ? editing.register_no || '' : 'Nomor register akan dibuat otomatis'}
        size="lg"
        footer={<>
          <button className="btn-secondary" onClick={() => setModalOpen(false)}>Batal</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Simpan'}
          </button>
        </>}>
        <SuratPenunjukanForm form={form} setForm={setForm} projects={projects} clusters={clusters} editing={!!editing}
          allDocs={allDocs} excludeId={editing?.id} excludeType="surat_penunjukan" />
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Hapus Surat Penunjukan" message="Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan." />
    </div>
  );
}

function SuratPenunjukanForm({ form, setForm, projects, clusters, editing, allDocs, excludeId, excludeType }: {
  form: SPFormState; setForm: (f: SPFormState) => void; projects: Project[]; clusters: Cluster[]; editing: boolean;
  allDocs: DocumentSummary[]; excludeId?: string; excludeType?: DocType;
}) {
  const set = (key: keyof SPFormState, value: unknown) => setForm({ ...form, [key]: value });
  const year = new Date(form.tanggal_sp).getFullYear();
  const yearShort = String(year).slice(2);
  const durasi = calcDurasi(form.tanggal_start, form.tanggal_finish);

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
        <label className="label">Nomor Surat Penunjukan *</label>
        <input className="input" value={form.nomor_sp} onChange={(e) => set('nomor_sp', e.target.value)} placeholder="cth: SP-001/2026" />
      </div>
      <div>
        <label className="label">Tanggal Surat Penunjukan</label>
        <input type="date" className="input" value={form.tanggal_sp} onChange={(e) => set('tanggal_sp', e.target.value)} />
      </div>
      <div>
        <label className="label">Nama Kontraktor *</label>
        <input className="input" value={form.nama_kontraktor} onChange={(e) => set('nama_kontraktor', e.target.value)} placeholder="Nama kontraktor" />
      </div>
      <div>
        <label className="label">Jenis Pekerjaan *</label>
        <input className="input" value={form.jenis_pekerjaan} onChange={(e) => set('jenis_pekerjaan', e.target.value)} placeholder="cth: Pekerjaan Struktur" />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Lokasi</label>
        <input className="input" value={form.lokasi} onChange={(e) => set('lokasi', e.target.value)} placeholder="Lokasi pekerjaan" />
      </div>
      <div>
        <label className="label">Tanggal Start</label>
        <input type="date" className="input" value={form.tanggal_start || ''} onChange={(e) => set('tanggal_start', e.target.value || null)} />
      </div>
      <div>
        <label className="label">Tanggal Finish</label>
        <input type="date" className="input" value={form.tanggal_finish || ''} onChange={(e) => set('tanggal_finish', e.target.value || null)} />
      </div>
      {durasi != null && (
        <div className="sm:col-span-2">
          <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-2.5">
            <span className="text-xs text-gray-500">Durasi (otomatis): </span>
            <span className="text-sm font-bold text-gray-900">{durasi} hari</span>
          </div>
        </div>
      )}
      <div>
        <label className="label">Tanggal Kick Off Meeting</label>
        <input type="date" className="input" value={form.tanggal_kickoff || ''} onChange={(e) => set('tanggal_kickoff', e.target.value || null)} />
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
        <label className="label">Link Google Drive Risalah Meeting Kick Off (Opsional)</label>
        <input className="input" value={form.link_risalah} onChange={(e) => set('link_risalah', e.target.value)} placeholder="https://drive.google.com/..." />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Keterangan (Opsional)</label>
        <textarea className="input min-h-[80px]" value={form.keterangan} onChange={(e) => set('keterangan', e.target.value)} placeholder="Catatan tambahan..." />
      </div>
      {!editing && (
        <div className="sm:col-span-2 rounded-lg bg-brand-50 border border-brand-100 px-4 py-3">
          <p className="text-xs text-gray-600">Nomor Register yang akan dibuat:</p>
          <p className="mt-1 font-mono text-sm font-bold text-brand-700">
            SP-{yearShort}-XXXX <span className="font-normal text-gray-400">(auto)</span>
          </p>
        </div>
      )}
    </div>
  );
}
