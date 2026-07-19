import { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Pencil, Plus, Receipt, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '../../../../components/ConfirmDialog';
import { Loading } from '../../../../components/Loading';
import { Modal } from '../../../../components/Modal';
import { useToast } from '../../../../components/Toast';
import { mapAppError } from '../../../../lib/errors';
import {
  deleteBillingTerminTemplate,
  fetchBillingTerminTemplates,
  saveBillingTerminTemplate,
  type BillingTerminTemplateInput,
  type BillingTerminTemplateWithItems,
} from '../../api/masterData';
import {
  activeTerminPercentageTotal,
  createEmptyTerminItem,
  moveTerminItem,
  normalizeMasterCode,
  resequenceTerminItems,
  toTerminItemDraft,
  validateTerminTemplateItems,
  type TerminTemplateItemDraft,
} from '../../utils/masterData';
import { ActiveBadge, EmptyMasterData, MasterLoadError } from './ContractorsTab';

interface TemplateForm {
  code: string;
  name: string;
  description: string;
  active: boolean;
  items: TerminTemplateItemDraft[];
}

const EMPTY_FORM: TemplateForm = {
  code: '',
  name: '',
  description: '',
  active: true,
  items: [createEmptyTerminItem(1)],
};

export function BillingTerminTemplatesTab() {
  const toast = useToast();
  const [items, setItems] = useState<BillingTerminTemplateWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BillingTerminTemplateWithItems | null>(null);
  const [form, setForm] = useState<TemplateForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BillingTerminTemplateWithItems | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setItems(await fetchBillingTerminTemplates());
    } catch (error: unknown) {
      setLoadError(mapAppError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, items: [createEmptyTerminItem(1)] });
    setModalOpen(true);
  };

  const openEdit = (item: BillingTerminTemplateWithItems) => {
    setEditing(item);
    setForm({
      code: item.code,
      name: item.name,
      description: item.description ?? '',
      active: item.active,
      items: item.items.length > 0
        ? resequenceTerminItems(item.items.map(toTerminItemDraft))
        : [createEmptyTerminItem(1)],
    });
    setModalOpen(true);
  };

  const updateItem = (index: number, update: Partial<TerminTemplateItemDraft>) => {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, ...update } : item),
    }));
  };

  const addItem = () => {
    setForm((current) => ({
      ...current,
      items: [...current.items, createEmptyTerminItem(current.items.length + 1)],
    }));
  };

  const removeItem = (index: number) => {
    setForm((current) => ({
      ...current,
      items: resequenceTerminItems(current.items.filter((_, itemIndex) => itemIndex !== index)),
    }));
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    setForm((current) => ({ ...current, items: moveTerminItem(current.items, index, direction) }));
  };

  const save = async () => {
    const code = normalizeMasterCode(form.code);
    if (!code) {
      toast.show('Kode template wajib diisi.', 'warning');
      return;
    }
    if (!form.name.trim()) {
      toast.show('Nama template wajib diisi.', 'warning');
      return;
    }

    const itemError = validateTerminTemplateItems(form.items);
    if (itemError) {
      toast.show(itemError, 'warning');
      return;
    }

    const payload: BillingTerminTemplateInput = {
      code,
      name: form.name,
      description: form.description,
      active: form.active,
      items: resequenceTerminItems(form.items),
    };

    setSaving(true);
    try {
      await saveBillingTerminTemplate(editing?.id ?? null, payload);
      toast.show(editing ? 'Template termin berhasil diperbarui.' : 'Template termin berhasil ditambahkan.', 'success');
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
      await deleteBillingTerminTemplate(deleteTarget.id);
      toast.show('Template termin berhasil dihapus.', 'success');
      await load();
    } catch (error: unknown) {
      toast.show(mapAppError(error), 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  if (loading) return <Loading label="Memuat template termin..." />;
  if (loadError) return <MasterLoadError message={loadError} onRetry={load} />;

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
        <div className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-brand-600" />
          <div>
            <h3 className="text-sm font-bold text-gray-900">Template Termin ({items.length})</h3>
            <p className="text-xs text-gray-500">Template akan disalin menjadi termin aktual saat monitoring dibuat.</p>
          </div>
        </div>
        <button className="btn-primary" onClick={openAdd}><Plus className="h-4 w-4" /> Tambah</button>
      </div>

      {items.length === 0 ? (
        <EmptyMasterData icon={Receipt} label="Belum ada template termin" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3">Kode</th>
                <th className="px-5 py-3">Nama Template</th>
                <th className="px-5 py-3">Jumlah Item</th>
                <th className="px-5 py-3">Total Persentase</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => {
                const percentageTotal = item.items.reduce((total, templateItem) => total + (templateItem.active ? templateItem.percentage ?? 0 : 0), 0);
                return (
                  <tr key={item.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3 text-left font-mono text-xs text-gray-600">{item.code}</td>
                    <td className="px-5 py-3 text-left">
                      <div className="font-medium text-gray-900">{item.name}</div>
                      {item.description && <div className="mt-0.5 max-w-md text-xs text-gray-500">{item.description}</div>}
                    </td>
                    <td className="px-5 py-3 text-left text-gray-600">{item.items.filter((templateItem) => templateItem.active).length} aktif</td>
                    <td className="px-5 py-3 text-left text-gray-600">{percentageTotal > 0 ? `${percentageTotal}%` : 'Belum ditentukan'}</td>
                    <td className="px-5 py-3 text-left"><ActiveBadge active={item.active} /></td>
                    <td className="px-5 py-3 text-left">
                      <div className="flex items-center justify-start gap-1">
                        <button aria-label={`Edit ${item.name}`} onClick={() => openEdit(item)} className="rounded-lg p-1.5 text-gray-400 hover:bg-amber-50 hover:text-amber-600"><Pencil className="h-4 w-4" /></button>
                        <button aria-label={`Hapus ${item.name}`} onClick={() => setDeleteTarget(item)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Template Termin' : 'Tambah Template Termin'}
        subtitle="Item disimpan secara atomik bersama template."
        size="xl"
        footer={<>
          <button className="btn-secondary" onClick={() => setModalOpen(false)}>Batal</button>
          <button className="btn-primary" onClick={() => void save()} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
        </>}
      >
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Kode *</label>
              <input className="input" value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} onBlur={() => setForm((current) => ({ ...current, code: normalizeMasterCode(current.code) }))} placeholder="cth: termin_bertahap" />
            </div>
            <div>
              <label className="label">Nama Template *</label>
              <input className="input" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="cth: Termin Bertahap" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Deskripsi</label>
              <textarea className="input min-h-20" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
            </div>
            <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
              <input type="checkbox" checked={form.active} onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))} />
              Template aktif
            </label>
          </div>

          <div className="rounded-xl border border-gray-200">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3">
              <div>
                <h4 className="text-sm font-bold text-gray-900">Item Termin</h4>
                <p className="text-xs text-gray-500">Total persentase aktif: {activeTerminPercentageTotal(form.items)}%</p>
              </div>
              <button type="button" className="btn-secondary" onClick={addItem}><Plus className="h-4 w-4" /> Tambah Item</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-3">Urutan</th>
                    <th className="px-4 py-3">Nama Item</th>
                    <th className="px-4 py-3">Persentase</th>
                    <th className="px-4 py-3">Aktif</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {form.items.map((item, index) => (
                    <tr key={item.id ?? `new-${index}`}>
                      <td className="px-4 py-3 text-left text-gray-600">{index + 1}</td>
                      <td className="px-4 py-3 text-left">
                        <input className="input" value={item.name} onChange={(event) => updateItem(index, { name: event.target.value })} placeholder="Nama termin" />
                      </td>
                      <td className="px-4 py-3 text-left">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step="0.01"
                          className="input w-32"
                          value={item.percentage ?? ''}
                          onChange={(event) => updateItem(index, { percentage: event.target.value === '' ? null : Number(event.target.value) })}
                          placeholder="Opsional"
                        />
                      </td>
                      <td className="px-4 py-3 text-left">
                        <input type="checkbox" checked={item.active} onChange={(event) => updateItem(index, { active: event.target.checked })} />
                      </td>
                      <td className="px-4 py-3 text-left">
                        <div className="flex items-center justify-start gap-1">
                          <button type="button" aria-label="Naikkan urutan" disabled={index === 0} onClick={() => moveItem(index, -1)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                          <button type="button" aria-label="Turunkan urutan" disabled={index === form.items.length - 1} onClick={() => moveItem(index, 1)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                          <button type="button" aria-label="Hapus item" onClick={() => removeItem(index)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void remove()}
        title="Hapus Template Termin"
        message={`Hapus template ${deleteTarget?.name ?? ''}? Penghapusan akan ditolak jika template sudah digunakan oleh monitoring tagihan.`}
      />
    </div>
  );
}
