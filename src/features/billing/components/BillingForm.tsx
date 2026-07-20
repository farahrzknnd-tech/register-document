import { useEffect, useMemo, useState } from 'react';
import { Save } from 'lucide-react';
import { Modal } from '../../../components/Modal';
import type { Cluster, Project } from '../../../lib/types';
import type {
  BillingStatus,
  BillingTerminTemplate,
  Contractor,
  SpkBillingInput,
  SpkBillingListItem,
} from '../types';
import { formatRupiah, validateSpkBillingInput } from '../utils/monitoring';

interface BillingFormProps {
  open: boolean;
  editing: SpkBillingListItem | null;
  projects: Project[];
  clusters: Cluster[];
  contractors: Contractor[];
  statuses: BillingStatus[];
  templates: BillingTerminTemplate[];
  submitting: boolean;
  onClose: () => void;
  onSubmit: (input: SpkBillingInput) => Promise<void>;
}

const emptyInput: SpkBillingInput = {
  surat_penunjukan_id: null,
  project_id: null,
  cluster_id: null,
  contractor_id: null,
  termin_template_id: null,
  billing_status_id: '',
  spk_number: '',
  spk_date: null,
  contractor_name_snapshot: '',
  work_name: '',
  work_location: '',
  work_start_date: null,
  work_finish_date: null,
  kickoff_date: null,
  stage_weight: '',
  contract_value: 0,
  document_drive_url: '',
  notes: '',
};

function toInput(editing: SpkBillingListItem | null, statuses: BillingStatus[]): SpkBillingInput {
  if (!editing) {
    const defaultStatus = statuses.find((status) => status.code === 'open' && status.active)
      ?? statuses.find((status) => status.active);
    return { ...emptyInput, billing_status_id: defaultStatus?.id ?? '' };
  }

  return {
    surat_penunjukan_id: editing.surat_penunjukan_id,
    project_id: editing.project_id,
    cluster_id: editing.cluster_id,
    contractor_id: editing.contractor_id,
    termin_template_id: editing.termin_template_id,
    billing_status_id: editing.billing_status_id,
    spk_number: editing.spk_number,
    spk_date: editing.spk_date,
    contractor_name_snapshot: editing.contractor_name_snapshot,
    work_name: editing.work_name,
    work_location: editing.work_location ?? '',
    work_start_date: editing.work_start_date,
    work_finish_date: editing.work_finish_date,
    kickoff_date: editing.kickoff_date,
    stage_weight: editing.stage_weight ?? '',
    contract_value: editing.contract_value,
    document_drive_url: editing.document_drive_url ?? '',
    notes: editing.notes ?? '',
  };
}

export function BillingForm({
  open,
  editing,
  projects,
  clusters,
  contractors,
  statuses,
  templates,
  submitting,
  onClose,
  onSubmit,
}: BillingFormProps) {
  const [form, setForm] = useState<SpkBillingInput>(emptyInput);
  const [errors, setErrors] = useState<ReturnType<typeof validateSpkBillingInput>>({});

  useEffect(() => {
    if (!open) return;
    setForm(toInput(editing, statuses));
    setErrors({});
  }, [editing, open, statuses]);

  const activeStatuses = useMemo(
    () => statuses.filter((status) => status.active || status.id === editing?.billing_status_id),
    [editing?.billing_status_id, statuses],
  );
  const activeTemplates = useMemo(
    () => templates.filter((template) => template.active || template.id === editing?.termin_template_id),
    [editing?.termin_template_id, templates],
  );

  const set = <K extends keyof SpkBillingInput>(key: K, value: SpkBillingInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const handleContractorChange = (contractorId: string) => {
    const contractor = contractors.find((item) => item.id === contractorId);
    setForm((current) => ({
      ...current,
      contractor_id: contractorId || null,
      contractor_name_snapshot: contractor?.name ?? current.contractor_name_snapshot,
    }));
    setErrors((current) => ({ ...current, contractor_name_snapshot: undefined }));
  };

  const handleSubmit = async () => {
    const validation = validateSpkBillingInput(form);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;
    await onSubmit(form);
  };

  return (
    <Modal
      open={open}
      onClose={submitting ? () => undefined : onClose}
      title={editing ? 'Edit Monitoring Tagihan' : 'Tambah Monitoring Tagihan'}
      subtitle="Data inti SPK, kontraktor, pekerjaan, dan nilai kontrak"
      size="xl"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={submitting}>Batal</button>
          <button className="btn-primary" onClick={() => void handleSubmit()} disabled={submitting}>
            <Save className="h-4 w-4" />
            {submitting ? 'Menyimpan...' : 'Simpan'}
          </button>
        </>
      }
    >
      <div className="space-y-6">
        <section>
          <h3 className="mb-3 text-sm font-bold text-gray-900">Identitas SPK</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">Nomor SPK *</label>
              <input className="input" value={form.spk_number} onChange={(event) => set('spk_number', event.target.value)} placeholder="Nomor SPK" />
              {errors.spk_number && <p className="mt-1 text-xs text-red-600">{errors.spk_number}</p>}
            </div>
            <div>
              <label className="label">Tanggal SPK</label>
              <input type="date" className="input" value={form.spk_date ?? ''} onChange={(event) => set('spk_date', event.target.value || null)} />
            </div>
            <div>
              <label className="label">Status Billing *</label>
              <select className="input" value={form.billing_status_id} onChange={(event) => set('billing_status_id', event.target.value)}>
                <option value="">Pilih Status</option>
                {activeStatuses.map((status) => <option key={status.id} value={status.id}>{status.name}</option>)}
              </select>
              {errors.billing_status_id && <p className="mt-1 text-xs text-red-600">{errors.billing_status_id}</p>}
            </div>
            <div>
              <label className="label">Template Termin</label>
              <select
                className="input"
                value={form.termin_template_id ?? ''}
                onChange={(event) => set('termin_template_id', event.target.value || null)}
                disabled={Boolean(editing)}
              >
                <option value="">Tanpa Template Termin</option>
                {activeTemplates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
              </select>
              {editing && <p className="mt-1 text-xs text-gray-500">Template termin dikunci setelah monitoring dibuat.</p>}
            </div>
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-bold text-gray-900">Project, Cluster, dan Kontraktor</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">Project</label>
              <select className="input" value={form.project_id ?? ''} onChange={(event) => set('project_id', event.target.value || null)}>
                <option value="">Tanpa Project</option>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Cluster</label>
              <select className="input" value={form.cluster_id ?? ''} onChange={(event) => set('cluster_id', event.target.value || null)}>
                <option value="">Tanpa Cluster</option>
                {clusters.map((cluster) => {
                  const project = projects.find((item) => item.id === cluster.project_id);
                  return <option key={cluster.id} value={cluster.id}>{cluster.name}{project ? ` — ${project.name}` : ''}</option>;
                })}
              </select>
            </div>
            <div>
              <label className="label">Master Kontraktor</label>
              <select className="input" value={form.contractor_id ?? ''} onChange={(event) => handleContractorChange(event.target.value)}>
                <option value="">Tanpa Master Kontraktor</option>
                {contractors.map((contractor) => (
                  <option key={contractor.id} value={contractor.id}>
                    {contractor.name}{contractor.active ? '' : ' (Nonaktif)'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Nama Kontraktor *</label>
              <input className="input" value={form.contractor_name_snapshot} onChange={(event) => set('contractor_name_snapshot', event.target.value)} placeholder="Nama kontraktor pada SPK" />
              {errors.contractor_name_snapshot && <p className="mt-1 text-xs text-red-600">{errors.contractor_name_snapshot}</p>}
            </div>
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-bold text-gray-900">Pekerjaan dan Nilai Kontrak</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="label">Nama Pekerjaan *</label>
              <input className="input" value={form.work_name} onChange={(event) => set('work_name', event.target.value)} placeholder="Nama atau lingkup pekerjaan" />
              {errors.work_name && <p className="mt-1 text-xs text-red-600">{errors.work_name}</p>}
            </div>
            <div>
              <label className="label">Lokasi Pekerjaan</label>
              <input className="input" value={form.work_location} onChange={(event) => set('work_location', event.target.value)} placeholder="Lokasi pekerjaan" />
            </div>
            <div>
              <label className="label">Bobot Tahapan</label>
              <input className="input" value={form.stage_weight} onChange={(event) => set('stage_weight', event.target.value)} placeholder="Contoh: 30% / Tahap 1" />
            </div>
            <div>
              <label className="label">Tanggal Mulai</label>
              <input type="date" className="input" value={form.work_start_date ?? ''} onChange={(event) => set('work_start_date', event.target.value || null)} />
            </div>
            <div>
              <label className="label">Tanggal Selesai</label>
              <input type="date" className="input" value={form.work_finish_date ?? ''} onChange={(event) => set('work_finish_date', event.target.value || null)} />
              {errors.work_finish_date && <p className="mt-1 text-xs text-red-600">{errors.work_finish_date}</p>}
            </div>
            <div>
              <label className="label">Tanggal Kickoff</label>
              <input type="date" className="input" value={form.kickoff_date ?? ''} onChange={(event) => set('kickoff_date', event.target.value || null)} />
            </div>
            <div>
              <label className="label">Nilai Kontrak *</label>
              <input
                type="number"
                min="0"
                step="1"
                className="input"
                value={form.contract_value}
                onChange={(event) => set('contract_value', Number(event.target.value))}
                disabled={Boolean(editing?.termin_template_id)}
              />
              <p className="mt-1 text-xs text-gray-500">{formatRupiah(form.contract_value)}</p>
              {editing?.termin_template_id && <p className="mt-1 text-xs text-gray-500">Nilai kontrak dikunci karena termin sudah diinisialisasi.</p>}
              {errors.contract_value && <p className="mt-1 text-xs text-red-600">{errors.contract_value}</p>}
            </div>
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-bold text-gray-900">Dokumen dan Catatan</h3>
          <div className="space-y-4">
            <div>
              <label className="label">Link Dokumen / Google Drive</label>
              <input type="url" className="input" value={form.document_drive_url} onChange={(event) => set('document_drive_url', event.target.value)} placeholder="https://..." />
              {errors.document_drive_url && <p className="mt-1 text-xs text-red-600">{errors.document_drive_url}</p>}
            </div>
            <div>
              <label className="label">Catatan</label>
              <textarea className="input min-h-24 resize-y" value={form.notes} onChange={(event) => set('notes', event.target.value)} placeholder="Catatan tambahan" />
            </div>
          </div>
        </section>
      </div>
    </Modal>
  );
}
