import { useState } from 'react';
import { Plus, Pencil, Trash2, Building2, Layers, FolderTree, Activity, ListChecks, Receipt } from 'lucide-react';
import type { Project, Cluster } from '../lib/types';
import {
  createProject, updateProject, deleteProject,
  createCluster, updateCluster, deleteCluster,
} from '../lib/api';
import { useToast } from '../components/toastContext';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Loading } from '../components/Loading';
import { ContractorsTab } from '../features/billing/components/master-data/ContractorsTab';
import { BillingStatusesTab } from '../features/billing/components/master-data/BillingStatusesTab';
import { BillingStagesTab } from '../features/billing/components/master-data/BillingStagesTab';
import { BillingTerminTemplatesTab } from '../features/billing/components/master-data/BillingTerminTemplatesTab';

interface MasterDataProps {
  projects: Project[];
  clusters: Cluster[];
  loading: boolean;
  onRefresh: () => void;
}

type MasterDataTab = 'project' | 'cluster' | 'contractor' | 'billingStatus' | 'billingStage' | 'terminTemplate';

const masterTabs: { id: MasterDataTab; label: string; icon: typeof Building2 }[] = [
  { id: 'project', label: 'Master Project', icon: Building2 },
  { id: 'cluster', label: 'Master Cluster', icon: Layers },
  { id: 'contractor', label: 'Kontraktor', icon: FolderTree },
  { id: 'billingStatus', label: 'Status Billing', icon: Activity },
  { id: 'billingStage', label: 'Tahapan Approval', icon: ListChecks },
  { id: 'terminTemplate', label: 'Template Termin', icon: Receipt },
];

export function MasterData({ projects, clusters, loading, onRefresh }: MasterDataProps) {
  const [tab, setTab] = useState<MasterDataTab>('project');
  if (loading) return <Loading label="Memuat master data..." />;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white p-1 shadow-card">
        <div className="flex flex-wrap gap-1">
          {masterTabs.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${active ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Icon className="h-4 w-4" /> {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {tab === 'project' && <ProjectTable projects={projects} onRefresh={onRefresh} />}
      {tab === 'cluster' && <ClusterTable clusters={clusters} projects={projects} onRefresh={onRefresh} />}
      {tab === 'contractor' && <ContractorsTab />}
      {tab === 'billingStatus' && <BillingStatusesTab />}
      {tab === 'billingStage' && <BillingStagesTab />}
      {tab === 'terminTemplate' && <BillingTerminTemplatesTab />}
    </div>
  );
}

function ProjectTable({ projects, onRefresh }: { projects: Project[]; onRefresh: () => void }) {
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const openAdd = () => { setEditing(null); setName(''); setCode(''); setModalOpen(true); };
  const openEdit = (p: Project) => { setEditing(p); setName(p.name); setCode(p.code || ''); setModalOpen(true); };

  const handleSave = async () => {
    if (!name.trim()) { toast.show('Nama project wajib diisi', 'warning'); return; }
    setSaving(true);
    try {
      if (editing) { await updateProject(editing.id, name, code); toast.show('Project berhasil diperbarui', 'success'); }
      else { await createProject(name, code); toast.show('Project berhasil ditambahkan', 'success'); }
      setModalOpen(false); onRefresh();
    } catch (err: unknown) { toast.show(err instanceof Error ? err.message : 'Gagal menyimpan', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await deleteProject(deleteId); toast.show('Project berhasil dihapus', 'success'); onRefresh(); }
    catch (err: unknown) { toast.show(err instanceof Error ? err.message : 'Gagal menghapus', 'error'); }
  };

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
        <div className="flex items-center gap-2">
          <FolderTree className="h-5 w-5 text-brand-600" />
          <h3 className="text-sm font-bold text-gray-900">Daftar Project ({projects.length})</h3>
        </div>
        <button className="btn-primary" onClick={openAdd}><Plus className="h-4 w-4" /> Tambah</button>
      </div>
      {projects.length === 0 ? (
        <div className="flex flex-col items-center py-16">
          <Building2 className="h-12 w-12 text-gray-300" />
          <p className="mt-3 text-sm text-gray-500">Belum ada project</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3">Nama Project</th>
                <th className="px-5 py-3">Kode</th>
                <th className="px-5 py-3">Dibuat</th>
                <th className="px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {projects.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3 font-medium text-gray-900">{p.name}</td>
                  <td className="px-5 py-3 text-gray-600">{p.code || '-'}</td>
                  <td className="px-5 py-3 text-gray-500">{formatDate(p.created_at)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-start gap-1">
                      <button onClick={() => openEdit(p)} className="rounded-lg p-1.5 text-gray-400 hover:bg-amber-50 hover:text-amber-600"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => setDeleteId(p.id)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Project' : 'Tambah Project'} size="sm"
        footer={<>
          <button className="btn-secondary" onClick={() => setModalOpen(false)}>Batal</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
        </>}>
        <div className="space-y-4">
          <div>
            <label className="label">Nama Project *</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="cth: Proyek Tower A" />
          </div>
          <div>
            <label className="label">Kode (Opsional)</label>
            <input className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="cth: TWR-A" />
          </div>
        </div>
      </Modal>
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Hapus Project" message="Apakah Anda yakin ingin menghapus project ini? Hapus ditolak jika project masih memiliki cluster atau dokumen." />
    </div>
  );
}

function ClusterTable({ clusters, projects, onRefresh }: { clusters: Cluster[]; projects: Project[]; onRefresh: () => void }) {
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Cluster | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const projectNameById = new Map(projects.map((project) => [project.id, project.name]));

  const openAdd = () => { setEditing(null); setName(''); setCode(''); setProjectId(projects[0]?.id ?? ''); setModalOpen(true); };
  const openEdit = (c: Cluster) => { setEditing(c); setName(c.name); setCode(c.code || ''); setProjectId(c.project_id); setModalOpen(true); };

  const handleSave = async () => {
    if (!projectId) { toast.show('Project wajib dipilih', 'warning'); return; }
    if (!name.trim()) { toast.show('Nama cluster wajib diisi', 'warning'); return; }
    setSaving(true);
    try {
      if (editing) { await updateCluster(editing.id, projectId, name, code); toast.show('Cluster berhasil diperbarui', 'success'); }
      else { await createCluster(projectId, name, code); toast.show('Cluster berhasil ditambahkan', 'success'); }
      setModalOpen(false); onRefresh();
    } catch (err: unknown) { toast.show(err instanceof Error ? err.message : 'Gagal menyimpan', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await deleteCluster(deleteId); toast.show('Cluster berhasil dihapus', 'success'); onRefresh(); }
    catch (err: unknown) { toast.show(err instanceof Error ? err.message : 'Gagal menghapus', 'error'); }
  };

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-brand-600" />
          <h3 className="text-sm font-bold text-gray-900">Daftar Cluster ({clusters.length})</h3>
        </div>
        <button className="btn-primary" onClick={openAdd}><Plus className="h-4 w-4" /> Tambah</button>
      </div>
      {clusters.length === 0 ? (
        <div className="flex flex-col items-center py-16">
          <Layers className="h-12 w-12 text-gray-300" />
          <p className="mt-3 text-sm text-gray-500">Belum ada cluster</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3">Project</th>
                <th className="px-5 py-3">Nama Cluster</th>
                <th className="px-5 py-3">Kode</th>
                <th className="px-5 py-3">Dibuat</th>
                <th className="px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clusters.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3 text-gray-600">{projectNameById.get(c.project_id) ?? 'Project tidak ditemukan'}</td>
                  <td className="px-5 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-5 py-3 text-gray-600">{c.code || '-'}</td>
                  <td className="px-5 py-3 text-gray-500">{formatDate(c.created_at)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-start gap-1">
                      <button onClick={() => openEdit(c)} className="rounded-lg p-1.5 text-gray-400 hover:bg-amber-50 hover:text-amber-600"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => setDeleteId(c.id)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Cluster' : 'Tambah Cluster'} size="sm"
        footer={<>
          <button className="btn-secondary" onClick={() => setModalOpen(false)}>Batal</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
        </>}>
        <div className="space-y-4">
          <div>
            <label className="label">Project *</label>
            <select className="input" value={projectId} onChange={(event) => setProjectId(event.target.value)}>
              <option value="">Pilih Project</option>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
            <p className="mt-1 text-xs text-gray-500">Project hanya untuk pengelompokan Master Cluster.</p>
          </div>
          <div>
            <label className="label">Nama Cluster *</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="cth: Cluster East" />
          </div>
          <div>
            <label className="label">Kode (Opsional)</label>
            <input className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="cth: CL-E" />
          </div>
        </div>
      </Modal>
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Hapus Cluster" message="Apakah Anda yakin ingin menghapus cluster ini? Hapus ditolak jika cluster masih dipakai dokumen." />
    </div>
  );
}

function formatDate(d: string): string {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}
