import { useCallback, useEffect, useState } from 'react';
import { Activity, Pencil, Plus, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '../../../../components/ConfirmDialog';
import { Loading } from '../../../../components/Loading';
import { Modal } from '../../../../components/Modal';
import { useToast } from '../../../../components/toastContext';
import { mapAppError } from '../../../../lib/errors';
import {
  createBillingStatus,
  deleteBillingStatus,
  fetchBillingStatuses,
  updateBillingStatus,
  type BillingStatusInput,
} from '../../api/masterData';
import type { BillingStatus } from '../../types';
import { normalizeMasterCode } from '../../utils/masterData';
import { ActiveBadge, EmptyMasterData, MasterLoadError } from './ContractorsTab';

const COLOR_OPTIONS: { value: BillingStatus['color_key']; label: string }[] = [
  { value: 'gray', label: 'Abu-abu' },
  { value: 'blue', label: 'Biru' },
  { value: 'amber', label: 'Kuning' },
  { value: 'green', label: 'Hijau' },
  { value: 'red', label: 'Merah' },
  { value: 'purple', label: 'Ungu' },
];

const EMPTY_FORM: BillingStatusInput = {
  code: '',
  name: '',
  description: '',
  color_key: 'gray',
  sort_order: 10,
  terminal: false,
  active: true,
};

const badgeClass: Record<BillingStatus['color_key'], string> = {
  gray: 'bg-gray-100 text-gray-700',
  blue: 'bg-blue-50 text-blue-700',
  amber: 'bg-amber-50 text-amber-700',
  green: 'bg-green-50 text-green-700',
  red: 'bg-red-50 text-red-700',
  purple: 'bg-purple-50 text-purple-700',
};

export function BillingStatusesTab() {
  const toast = useToast();
  const [items, setItems] = useState<BillingStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BillingStatus | null>(null);
  const [form, setForm] = useState<BillingStatusInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BillingStatus | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setItems(await fetchBillingStatuses());
    } catch (error: unknown) {
      setLoadError(mapAppError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const openAdd = () => {
    const nextSort = items.length === 0 ? 10 : Math.max(...items.map((item) => item.sort_order)) + 10;
    setEditing(null);
    setForm({ ...EMPTY_FORM, sort_order: nextSort });
    setModalOpen(true);
  };

  const openEdit = (item: BillingStatus) => {
    setEditing(item);
    setForm({
      code: item.code,
      name: item.name,
      description: item.description ?? '',
      color_key: item.color_key,
      sort_order: item.sort_order,
      terminal: item.terminal,
      active: item.active,
    });
    setModalOpen(true);
  };

  const save = async () => {
    const code = normalizeMasterCode(form.code);
    if (!code) {
      toast.show('Kode status wajib diisi.', 'warning');
      return;
    }
    if (!form.name.trim()) {
      toast.show('Nama status wajib diisi.', 'warning');
      return;
    }
    if (!Number.isInteger(form.sort_order) || form.sort_order < 0) {
      toast.show('Urutan status harus berupa bilangan bulat positif.', 'warning');
      return;
    }

    setSaving(true);
    try {
      const payload = { ...form, code };
      if (editing) {
        await updateBillingStatus(editing.id, payload);
        toast.show('Status billing berhasil diperbarui.', 'success');
      } else {
        await createBillingStatus(payload);
        toast.show('Status billing berhasil ditambahkan.', 'success');
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
      await deleteBillingStatus(deleteTarget.id);
      toast.show('Status billing berhasil dihapus.', 'success');
      await load();
    } catch (error: unknown) {
      toast.show(mapAppError(error), 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  if (loading) return <Loading label="Memuat status billing..." />;
  if (loadError) return <MasterLoadError message={loadError} onRetry={load} />;

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-brand-600" />
          <div>
            <h3 className="text-sm font-bold text-gray-900">Status Billing ({items.length})</h3>
            <p className="text-xs text-gray-500">Urutan dan warna status untuk monitoring tagihan.</p>
          </div>
        </div>
        <button className="btn-primary" onClick={openAdd}><Plus className="h-4 w-4" /> Tambah</button>
      </div>

      {items.length === 0 ? (
        <EmptyMasterData icon={Activity} label="Belum ada status billing" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3">Urutan</th>
                <th className="px-5 py-3">Kode</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Deskripsi</th>
                <th className="px-5 py-3">Terminal</th>
                <th className="px-5 py-3">Aktif</th>
                <th className="px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3 text-left text-gray-600">{item.sort_order}</td>
                  <td className="px-5 py-3 text-left font-mono text-xs text-gray-600">{item.code}</td>
                  <td className="px-5 py-3 text-left"><span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${badgeClass[item.color_key]}`}>{item.name}</span></td>
                  <td className="max-w-xs px-5 py-3 text-left text-gray-600">{item.description || '-'}</td>
                  <td className="px-5 py-3 text-left">{item.terminal ? 'Ya' : 'Tidak'}</td>
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
        title={editing ? 'Edit Status Billing' : 'Tambah Status Billing'}
        size="lg"
        footer={<>
          <button className="btn-secondary" onClick={() => setModalOpen(false)}>Batal</button>
          <button className="btn-primary" onClick={() => void save()} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
        </>}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Kode *</label>
            <input className="input" value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} onBlur={() => setForm((current) => ({ ...current, code: normalizeMasterCode(current.code) }))} placeholder="cth: in_progress" />
          </div>
          <div>
            <label className="label">Nama Status *</label>
            <input className="input" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="cth: In Progress" />
          </div>
          <div>
            <label className="label">Warna</label>
            <select className="input" value={form.color_key} onChange={(event) => setForm((current) => ({ ...current, color_key: event.target.value as BillingStatus['color_key'] }))}>
              {COLOR_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Urutan</label>
            <input type="number" min={0} step={1} className="input" value={form.sort_order} onChange={(event) => setForm((current) => ({ ...current, sort_order: Number(event.target.value) }))} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Deskripsi</label>
            <textarea className="input min-h-20" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
          </div>
          <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
            <input type="checkbox" checked={form.terminal} onChange={(event) => setForm((current) => ({ ...current, terminal: event.target.checked }))} />
            Status akhir/terminal
          </label>
          <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
            <input type="checkbox" checked={form.active} onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))} />
            Status aktif
          </label>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void remove()}
        title="Hapus Status Billing"
        message={`Hapus status ${deleteTarget?.name ?? ''}? Penghapusan akan ditolak jika status sudah digunakan oleh monitoring tagihan.`}
      />
    </div>
  );
}
