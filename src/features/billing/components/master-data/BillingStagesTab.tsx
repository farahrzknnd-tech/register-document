import { useCallback, useEffect, useState } from 'react';
import { ListChecks, Pencil, Plus, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '../../../../components/ConfirmDialog';
import { Loading } from '../../../../components/Loading';
import { Modal } from '../../../../components/Modal';
import { useToast } from '../../../../components/toastContext';
import { mapAppError } from '../../../../lib/errors';
import {
  createBillingStage,
  deleteBillingStage,
  fetchBillingStages,
  updateBillingStage,
  type BillingStageInput,
} from '../../api/masterData';
import type { BillingStageDefinition } from '../../types';
import { normalizeMasterCode } from '../../utils/masterData';
import { ActiveBadge, EmptyMasterData, MasterLoadError } from './ContractorsTab';

const EMPTY_FORM: BillingStageInput = {
  code: '',
  name: '',
  description: '',
  sort_order: 10,
  active: true,
};

export function BillingStagesTab() {
  const toast = useToast();
  const [items, setItems] = useState<BillingStageDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BillingStageDefinition | null>(null);
  const [form, setForm] = useState<BillingStageInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BillingStageDefinition | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setItems(await fetchBillingStages());
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

  const openEdit = (item: BillingStageDefinition) => {
    setEditing(item);
    setForm({
      code: item.code,
      name: item.name,
      description: item.description ?? '',
      sort_order: item.sort_order,
      active: item.active,
    });
    setModalOpen(true);
  };

  const save = async () => {
    const code = normalizeMasterCode(form.code);
    if (!code) {
      toast.show('Kode tahapan wajib diisi.', 'warning');
      return;
    }
    if (!form.name.trim()) {
      toast.show('Nama tahapan wajib diisi.', 'warning');
      return;
    }
    if (!Number.isInteger(form.sort_order) || form.sort_order < 0) {
      toast.show('Urutan tahapan harus berupa bilangan bulat positif.', 'warning');
      return;
    }

    setSaving(true);
    try {
      const payload = { ...form, code };
      if (editing) {
        await updateBillingStage(editing.id, payload);
        toast.show('Tahapan approval berhasil diperbarui.', 'success');
      } else {
        await createBillingStage(payload);
        toast.show('Tahapan approval berhasil ditambahkan.', 'success');
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
      await deleteBillingStage(deleteTarget.id);
      toast.show('Tahapan approval berhasil dihapus.', 'success');
      await load();
    } catch (error: unknown) {
      toast.show(mapAppError(error), 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  if (loading) return <Loading label="Memuat tahapan approval..." />;
  if (loadError) return <MasterLoadError message={loadError} onRetry={load} />;

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
        <div className="flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-brand-600" />
          <div>
            <h3 className="text-sm font-bold text-gray-900">Tahapan Approval ({items.length})</h3>
            <p className="text-xs text-gray-500">Urutan timeline yang otomatis dibuat untuk monitoring baru.</p>
          </div>
        </div>
        <button className="btn-primary" onClick={openAdd}><Plus className="h-4 w-4" /> Tambah</button>
      </div>

      {items.length === 0 ? (
        <EmptyMasterData icon={ListChecks} label="Belum ada tahapan approval" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3">Urutan</th>
                <th className="px-5 py-3">Kode</th>
                <th className="px-5 py-3">Nama Tahapan</th>
                <th className="px-5 py-3">Deskripsi</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3 text-left text-gray-600">{item.sort_order}</td>
                  <td className="px-5 py-3 text-left font-mono text-xs text-gray-600">{item.code}</td>
                  <td className="px-5 py-3 text-left font-medium text-gray-900">{item.name}</td>
                  <td className="max-w-sm px-5 py-3 text-left text-gray-600">{item.description || '-'}</td>
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
        title={editing ? 'Edit Tahapan Approval' : 'Tambah Tahapan Approval'}
        size="lg"
        footer={<>
          <button className="btn-secondary" onClick={() => setModalOpen(false)}>Batal</button>
          <button className="btn-primary" onClick={() => void save()} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
        </>}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Kode *</label>
            <input className="input" value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} onBlur={() => setForm((current) => ({ ...current, code: normalizeMasterCode(current.code) }))} placeholder="cth: bi_review" />
          </div>
          <div>
            <label className="label">Nama Tahapan *</label>
            <input className="input" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="cth: BI Review & Signed" />
          </div>
          <div>
            <label className="label">Urutan</label>
            <input type="number" min={0} step={1} className="input" value={form.sort_order} onChange={(event) => setForm((current) => ({ ...current, sort_order: Number(event.target.value) }))} />
          </div>
          <div className="flex items-end pb-2">
            <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
              <input type="checkbox" checked={form.active} onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))} />
              Tahapan aktif
            </label>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Deskripsi</label>
            <textarea className="input min-h-20" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void remove()}
        title="Hapus Tahapan Approval"
        message={`Hapus tahapan ${deleteTarget?.name ?? ''}? Penghapusan akan ditolak jika tahapan sudah digunakan oleh monitoring tagihan.`}
      />
    </div>
  );
}
