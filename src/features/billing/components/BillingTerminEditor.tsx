import { useEffect, useState } from 'react';
import { Save, X } from 'lucide-react';
import type { BillingTermin, BillingTerminInput, BillingTerminStatus } from '../types';
import { formatRupiah } from '../utils/monitoring';
import {
  BILLING_TERMIN_STATUS_OPTIONS,
  sanitizeMoneyInput,
  validateBillingTerminInput,
  type BillingTerminInputErrors,
} from '../utils/workflow';

interface BillingTerminEditorProps {
  billingId: string;
  termin: BillingTermin | null;
  nextSequence: number;
  contractValue: number;
  existingTermins: BillingTermin[];
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (input: BillingTerminInput) => Promise<boolean>;
}

function amountText(value: number): string {
  return value > 0 ? String(Math.trunc(value)) : '';
}

function numberFromText(value: string): number {
  return value ? Number(value) : 0;
}

export function BillingTerminEditor({
  billingId,
  termin,
  nextSequence,
  contractValue,
  existingTermins,
  submitting,
  onCancel,
  onSubmit,
}: BillingTerminEditorProps) {
  const [sequenceNo, setSequenceNo] = useState(String(termin?.sequence_no ?? nextSequence));
  const [name, setName] = useState(termin?.name ?? '');
  const [percentage, setPercentage] = useState(termin?.percentage === null || termin?.percentage === undefined ? '' : String(termin.percentage));
  const [plannedAmount, setPlannedAmount] = useState(amountText(termin?.planned_amount ?? 0));
  const [billedAmount, setBilledAmount] = useState(amountText(termin?.billed_amount ?? 0));
  const [paidAmount, setPaidAmount] = useState(amountText(termin?.paid_amount ?? 0));
  const [status, setStatus] = useState<BillingTerminStatus>(termin?.status ?? 'not_billed');
  const [billedDate, setBilledDate] = useState(termin?.billed_date ?? '');
  const [paidDate, setPaidDate] = useState(termin?.paid_date ?? '');
  const [notes, setNotes] = useState(termin?.notes ?? '');
  const [errors, setErrors] = useState<BillingTerminInputErrors>({});

  useEffect(() => {
    setSequenceNo(String(termin?.sequence_no ?? nextSequence));
    setName(termin?.name ?? '');
    setPercentage(termin?.percentage === null || termin?.percentage === undefined ? '' : String(termin.percentage));
    setPlannedAmount(amountText(termin?.planned_amount ?? 0));
    setBilledAmount(amountText(termin?.billed_amount ?? 0));
    setPaidAmount(amountText(termin?.paid_amount ?? 0));
    setStatus(termin?.status ?? 'not_billed');
    setBilledDate(termin?.billed_date ?? '');
    setPaidDate(termin?.paid_date ?? '');
    setNotes(termin?.notes ?? '');
    setErrors({});
  }, [nextSequence, termin]);

  const handleMoneyChange = (
    value: string,
    setter: (next: string) => void,
    field: keyof BillingTerminInputErrors,
  ) => {
    setter(sanitizeMoneyInput(value));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async () => {
    const input: BillingTerminInput = {
      billing_id: billingId,
      termin_id: termin?.id ?? null,
      sequence_no: Number(sequenceNo),
      name,
      percentage: percentage === '' ? null : Number(percentage),
      planned_amount: numberFromText(plannedAmount),
      billed_amount: numberFromText(billedAmount),
      paid_amount: numberFromText(paidAmount),
      status,
      billed_date: billedDate || null,
      paid_date: paidDate || null,
      notes,
    };

    const validationErrors = validateBillingTerminInput(input, contractValue, existingTermins);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    if (await onSubmit(input)) onCancel();
  };

  return (
    <div className="border-b border-gray-200 bg-brand-50/30 p-5">
      <div className="mb-4">
        <h4 className="text-sm font-bold text-gray-900">{termin ? `Edit ${termin.name}` : 'Tambah Termin'}</h4>
        <p className="mt-0.5 text-xs text-gray-500">Nilai tagihan dan pembayaran divalidasi terhadap nilai kontrak.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label>
          <span className="label">Urutan *</span>
          <input
            className="input"
            type="number"
            min="1"
            value={sequenceNo}
            disabled={submitting}
            onChange={(event) => {
              setSequenceNo(event.target.value);
              setErrors((current) => ({ ...current, sequence_no: undefined }));
            }}
          />
          {errors.sequence_no && <p className="mt-1 text-xs text-red-600">{errors.sequence_no}</p>}
        </label>

        <label className="sm:col-span-1 lg:col-span-2">
          <span className="label">Nama Termin *</span>
          <input
            className="input"
            value={name}
            disabled={submitting}
            placeholder="Contoh: Termin 1"
            onChange={(event) => {
              setName(event.target.value);
              setErrors((current) => ({ ...current, name: undefined }));
            }}
          />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
        </label>

        <label>
          <span className="label">Persentase</span>
          <input
            className="input"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={percentage}
            disabled={submitting}
            placeholder="Opsional"
            onChange={(event) => {
              setPercentage(event.target.value);
              setErrors((current) => ({ ...current, percentage: undefined }));
            }}
          />
          {errors.percentage && <p className="mt-1 text-xs text-red-600">{errors.percentage}</p>}
        </label>

        <MoneyField
          label="Nilai Rencana *"
          value={plannedAmount}
          error={errors.planned_amount}
          disabled={submitting}
          onChange={(value) => handleMoneyChange(value, setPlannedAmount, 'planned_amount')}
        />
        <MoneyField
          label="Nilai Ditagihkan"
          value={billedAmount}
          error={errors.billed_amount}
          disabled={submitting}
          onChange={(value) => handleMoneyChange(value, setBilledAmount, 'billed_amount')}
        />
        <MoneyField
          label="Nilai Dibayar"
          value={paidAmount}
          error={errors.paid_amount}
          disabled={submitting}
          onChange={(value) => handleMoneyChange(value, setPaidAmount, 'paid_amount')}
        />

        <label>
          <span className="label">Status *</span>
          <select
            className="input"
            value={status}
            disabled={submitting}
            onChange={(event) => {
              setStatus(event.target.value as BillingTerminStatus);
              setErrors((current) => ({ ...current, status: undefined }));
            }}
          >
            {BILLING_TERMIN_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          {errors.status && <p className="mt-1 text-xs text-red-600">{errors.status}</p>}
        </label>

        <label>
          <span className="label">Tanggal Tagihan</span>
          <input
            className="input"
            type="date"
            value={billedDate}
            disabled={submitting}
            onChange={(event) => {
              setBilledDate(event.target.value);
              setErrors((current) => ({ ...current, billed_date: undefined }));
            }}
          />
          {errors.billed_date && <p className="mt-1 text-xs text-red-600">{errors.billed_date}</p>}
        </label>

        <label>
          <span className="label">Tanggal Pembayaran</span>
          <input
            className="input"
            type="date"
            value={paidDate}
            disabled={submitting}
            onChange={(event) => {
              setPaidDate(event.target.value);
              setErrors((current) => ({ ...current, paid_date: undefined }));
            }}
          />
          {errors.paid_date && <p className="mt-1 text-xs text-red-600">{errors.paid_date}</p>}
        </label>
      </div>

      <label className="mt-4 block">
        <span className="label">Catatan Termin</span>
        <textarea
          className="input min-h-20 resize-y"
          value={notes}
          disabled={submitting}
          placeholder="Nomor invoice, progres administrasi, atau catatan pembayaran..."
          onChange={(event) => setNotes(event.target.value)}
        />
      </label>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div className="text-xs text-gray-500">
          <p>Rencana: <strong className="text-gray-700">{formatRupiah(numberFromText(plannedAmount))}</strong></p>
          <p>Ditagihkan: <strong className="text-blue-700">{formatRupiah(numberFromText(billedAmount))}</strong> · Dibayar: <strong className="text-green-700">{formatRupiah(numberFromText(paidAmount))}</strong></p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn-secondary" disabled={submitting} onClick={onCancel}>
            <X className="h-4 w-4" /> Batal
          </button>
          <button type="button" className="btn-primary" disabled={submitting} onClick={() => void handleSubmit()}>
            <Save className="h-4 w-4" /> {submitting ? 'Menyimpan...' : 'Simpan Termin'}
          </button>
        </div>
      </div>
    </div>
  );
}

function MoneyField({
  label,
  value,
  error,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  error?: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="label">{label}</span>
      <input
        className="input"
        type="text"
        inputMode="numeric"
        value={value}
        disabled={disabled}
        placeholder="0"
        onChange={(event) => onChange(event.target.value)}
      />
      <p className="mt-1 text-xs text-gray-500">{formatRupiah(numberFromText(value))}</p>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </label>
  );
}
