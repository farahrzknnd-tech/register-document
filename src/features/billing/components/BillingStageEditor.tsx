import { useEffect, useState } from 'react';
import { Save, X } from 'lucide-react';
import type {
  BillingStageProgressDetail,
  BillingStageProgressInput,
  BillingStageStatus,
} from '../types';
import {
  BILLING_STAGE_STATUS_OPTIONS,
  toDateTimeLocalValue,
  toIsoDateTime,
  validateBillingStageInput,
} from '../utils/workflow';

interface BillingStageEditorProps {
  stage: BillingStageProgressDetail;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (input: BillingStageProgressInput) => Promise<boolean>;
}

function nowLocalValue(): string {
  return toDateTimeLocalValue(new Date().toISOString());
}

export function BillingStageEditor({
  stage,
  submitting,
  onCancel,
  onSubmit,
}: BillingStageEditorProps) {
  const [status, setStatus] = useState<BillingStageStatus>(stage.status);
  const [completedAt, setCompletedAt] = useState(toDateTimeLocalValue(stage.completed_at));
  const [note, setNote] = useState(stage.note ?? '');
  const [completedAtError, setCompletedAtError] = useState<string | null>(null);

  useEffect(() => {
    setStatus(stage.status);
    setCompletedAt(toDateTimeLocalValue(stage.completed_at));
    setNote(stage.note ?? '');
    setCompletedAtError(null);
  }, [stage]);

  const handleStatusChange = (nextStatus: BillingStageStatus) => {
    setStatus(nextStatus);
    setCompletedAtError(null);
    if (nextStatus === 'completed' && !completedAt) setCompletedAt(nowLocalValue());
    if (nextStatus !== 'completed') setCompletedAt('');
  };

  const handleSubmit = async () => {
    const input: BillingStageProgressInput = {
      progress_id: stage.id,
      status,
      completed_at: status === 'completed' ? toIsoDateTime(completedAt) : null,
      note,
    };
    const errors = validateBillingStageInput(input);
    if (errors.completed_at) {
      setCompletedAtError(errors.completed_at);
      return;
    }
    if (await onSubmit(input)) onCancel();
  };

  return (
    <div className="mt-3 rounded-xl border border-brand-200 bg-brand-50/40 p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="label">Status Tahapan</span>
          <select
            className="input"
            value={status}
            disabled={submitting}
            onChange={(event) => handleStatusChange(event.target.value as BillingStageStatus)}
          >
            {BILLING_STAGE_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        {status === 'completed' && (
          <label>
            <span className="label">Tanggal dan Waktu Selesai *</span>
            <input
              className="input"
              type="datetime-local"
              value={completedAt}
              disabled={submitting}
              onChange={(event) => {
                setCompletedAt(event.target.value);
                setCompletedAtError(null);
              }}
            />
            {completedAtError && <p className="mt-1 text-xs text-red-600">{completedAtError}</p>}
          </label>
        )}
      </div>

      <label className="mt-4 block">
        <span className="label">Catatan</span>
        <textarea
          className="input min-h-20 resize-y"
          value={note}
          disabled={submitting}
          placeholder="Catatan progres atau hasil review..."
          onChange={(event) => setNote(event.target.value)}
        />
      </label>

      <div className="mt-4 flex justify-end gap-2">
        <button type="button" className="btn-secondary" disabled={submitting} onClick={onCancel}>
          <X className="h-4 w-4" /> Batal
        </button>
        <button type="button" className="btn-primary" disabled={submitting} onClick={() => void handleSubmit()}>
          <Save className="h-4 w-4" /> {submitting ? 'Menyimpan...' : 'Simpan Tahapan'}
        </button>
      </div>
    </div>
  );
}
