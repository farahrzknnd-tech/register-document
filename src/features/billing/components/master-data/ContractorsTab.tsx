import { useCallback, useEffect, useState } from 'react';
import { Building2, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '../../../../components/ConfirmDialog';
import { Loading } from '../../../../components/Loading';
import { Modal } from '../../../../components/Modal';
import { useToast } from '../../../../components/toastContext';
import { mapAppError } from '../../../../lib/errors';
import {
  createContractor,
  deleteContractor,
  fetchContractors,
  updateContractor,
  type ContractorInput,
} from '../../api/masterData';
import type { Contractor } from '../../types';

const EMPTY_FORM: ContractorInput = {
  code: '',
  name: '',
  pic_name: '',
  phone: '',
  email: '',
  address: '',
  active: true,
};

export function ContractorsTab() {
  const toast = useToast();
  const [items, setItems] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Contractor | null>(null);
  const [form, setForm] = useState<ContractorInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Contractor | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setItems(await fetchContractors());
    } catch (error: unknown) {
      setLoadError(mapAppError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (item: Contractor) => {
    setEditing(item);
    setForm({
      code: item.code ?? '',
      name: item.name,
      pic_name: item.pic_name ?? '',
      phone: item.phone ?? '',
      email: item.email ?? '',
      address: item.address ?? '',
      active: item.active,
    });
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast.show('Nama kontraktor wajib diisi.', 'warning');
      return;
    }
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      toast.show('Format email kontraktor tidak valid.', 'warning');
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await updateContractor(editing.id, form);
        toast.show('Kontraktor berhasil diperbarui.', 'success');
      } else {
        await createContractor(form);
        toast.show('Kontraktor berhasil ditambahkan.', 'success');
      }
      setModalOpen(false);
      await load();
    } catch (error: unknown) {
      toast.show(mapAppError(error), 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    try {
      await deleteContractor(deleteTarget.id);
      toast.show('Kontraktor berhasil dihapus.', 'success');
      await load();
    } catch (error: unknown) {
      toast.show(mapAppError(error), 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  if (loading) return <Loading label="Memuat master kontraktor..." />;

  if (loadError) {
    return <MasterLoadError message={loadError} onRetry={load} />;
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-brand-600" />
          <div>
            <h3 className="text-sm font-bold text-gray-900">Daftar Kontraktor ({items.length})</h3>
            <p className="text-xs text-gray-500">Sumber kontraktor untuk monitoring tagihan.</p>
          </div>
        </div>
        <button className="btn-primary" onClick={openAdd}><Plus className="h-4 w-4" /> Tambah</button>
      </div>

      {items.length === 0 ? (
        <EmptyMasterData icon={Building2} label="Belum ada kontraktor" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3">Kode</th>
                <th className="px-5 py-3">Nama Kontraktor</th>
                <th className="px-5 py-3">PIC</th>
                <th className="px-5 py-3">Kontak</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3 text-left text-gray-600">{item.code || '-'}</td>
                  <td className="px-5 py-3 text-left font-medium text-gray-900">{item.name}</td>
                  <td className="px-5 py-3 text-left text-gray-600">{item.pic_name || '-'}</td>
                  <td className="px-5 py-3 text-left text-gray-600">
                    <div>{item.phone || '-'}</div>
                    {item.email && <div className="text-xs text-gray-400">{item.email}</div>}
                  </td>
                  <td className="px-5 py-3 text-left"><ActiveBadge active={item.active} /></td>
                  <td className="px-5 py-3 text-left">
                    <div className="flex items-center justify-start gap-1">
                      <button aria-label={`Edit ${item.name}`} onClick={() => openEdit(item)} className="rounded-lg p-1.5 text-gray-400 hover:bg-amber-50 hover:text-amber-600"><Pencil className="h-4 w-4" /></button>
                      <button aria-label={`Hapus ${item.name}`} onClick={() => setDeleteTarget(item)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Kontraktor' : 'Tambah Kontraktor'}
        size="lg"
        footer={<>
          <button className="btn-secondary" onClick={() => setModalOpen(false)}>Batal</button>
          <button className="btn-primary" onClick={() => void save()} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
        </>}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Kode</label>
            <input className="input" value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} placeholder="cth: KTR-001" />
          </div>
          <div>
            <label className="label">Nama Kontraktor *</label>
            <input className="input" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Nama perusahaan kontraktor" />
          </div>
          <div>
            <label className="label">Nama PIC</label>
            <input className="input" value={form.pic_name} onChange={(event) => setForm((current) => ({ ...current, pic_name: event.target.value }))} placeholder="Nama penanggung jawab" />
          </div>
          <div>
            <label className="label">Nomor Telepon</label>
            <input className="input" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} placeholder="+62..." />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="email@kontraktor.com" />
          </div>
          <div className="flex items-end pb-2">
            <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
              <input type="checkbox" checked={form.active} onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))} />
              Kontraktor aktif
            </label>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Alamat</label>
            <textarea className="input min-h-24" value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} placeholder="Alamat kontraktor" />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void remove()}
        title="Hapus Kontraktor"
        message={`Hapus kontraktor ${deleteTarget?.name ?? ''}? Penghapusan akan ditolak jika kontraktor sudah digunakan oleh monitoring tagihan.`}
      />
    </div>
  );
}

export function ActiveBadge({ active }: { active: boolean }) {
  return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{active ? 'Aktif' : 'Nonaktif'}</span>;
}

export function EmptyMasterData({ icon: Icon, label }: { icon: typeof Building2; label: string }) {
  return (
    <div className="flex flex-col items-center py-16">
      <Icon className="h-12 w-12 text-gray-300" />
      <p className="mt-3 text-sm text-gray-500">{label}</p>
    </div>
  );
}

export function MasterLoadError({ message, onRetry }: { message: string; onRetry: () => Promise<void> }) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
      <p className="text-sm font-semibold text-red-700">{message}</p>
      <button className="btn-secondary" onClick={() => void onRetry()}><RefreshCw className="h-4 w-4" /> Coba Lagi</button>
    </div>
  );
}
