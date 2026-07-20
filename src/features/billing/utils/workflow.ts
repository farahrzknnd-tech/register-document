import type {
  BillingStageProgressInput,
  BillingStageStatus,
  BillingTermin,
  BillingTerminInput,
  BillingTerminStatus,
} from '../types';

export const BILLING_STAGE_STATUS_OPTIONS: Array<{
  value: BillingStageStatus;
  label: string;
}> = [
  { value: 'not_started', label: 'Belum Dimulai' },
  { value: 'in_progress', label: 'Sedang Diproses' },
  { value: 'completed', label: 'Selesai' },
  { value: 'skipped', label: 'Dilewati' },
];

export const BILLING_TERMIN_STATUS_OPTIONS: Array<{
  value: BillingTerminStatus;
  label: string;
}> = [
  { value: 'not_billed', label: 'Belum Ditagihkan' },
  { value: 'in_process', label: 'Sedang Diproses' },
  { value: 'billed', label: 'Ditagihkan' },
  { value: 'partially_paid', label: 'Dibayar Sebagian' },
  { value: 'paid', label: 'Lunas' },
  { value: 'cancelled', label: 'Dibatalkan' },
];

export interface BillingStageInputErrors {
  completed_at?: string;
}

export interface BillingTerminInputErrors {
  sequence_no?: string;
  name?: string;
  percentage?: string;
  planned_amount?: string;
  billed_amount?: string;
  paid_amount?: string;
  billed_date?: string;
  paid_date?: string;
  status?: string;
}

export function sanitizeMoneyInput(value: string): string {
  const digitsOnly = value.replace(/\D/g, '');
  if (!digitsOnly) return '';
  return digitsOnly.replace(/^0+(?=\d)/, '');
}

export function toDateTimeLocalValue(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function toIsoDateTime(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function validateBillingStageInput(
  input: BillingStageProgressInput,
): BillingStageInputErrors {
  const errors: BillingStageInputErrors = {};
  if (input.status === 'completed' && !input.completed_at) {
    errors.completed_at = 'Tanggal dan waktu selesai wajib diisi.';
  }
  return errors;
}

export function validateBillingTerminInput(
  input: BillingTerminInput,
  contractValue: number,
  existingTermins: BillingTermin[],
): BillingTerminInputErrors {
  const errors: BillingTerminInputErrors = {};

  if (!Number.isInteger(input.sequence_no) || input.sequence_no <= 0) {
    errors.sequence_no = 'Urutan termin harus berupa bilangan lebih dari nol.';
  }
  if (!input.name.trim()) errors.name = 'Nama termin wajib diisi.';
  if (input.percentage !== null && (input.percentage < 0 || input.percentage > 100)) {
    errors.percentage = 'Persentase harus berada di antara 0 dan 100.';
  }
  if (!Number.isFinite(input.planned_amount) || input.planned_amount < 0) {
    errors.planned_amount = 'Nilai rencana tidak boleh negatif.';
  } else if (input.planned_amount > contractValue) {
    errors.planned_amount = 'Nilai rencana tidak boleh melebihi nilai kontrak.';
  }
  if (!Number.isFinite(input.billed_amount) || input.billed_amount < 0) {
    errors.billed_amount = 'Nilai ditagihkan tidak boleh negatif.';
  } else if (input.billed_amount > input.planned_amount) {
    errors.billed_amount = 'Nilai ditagihkan tidak boleh melebihi nilai rencana.';
  }
  if (!Number.isFinite(input.paid_amount) || input.paid_amount < 0) {
    errors.paid_amount = 'Nilai dibayar tidak boleh negatif.';
  } else if (input.paid_amount > input.billed_amount) {
    errors.paid_amount = 'Nilai dibayar tidak boleh melebihi nilai ditagihkan.';
  }
  if (input.billed_amount > 0 && !input.billed_date) {
    errors.billed_date = 'Tanggal tagihan wajib diisi ketika ada nilai ditagihkan.';
  }
  if (input.paid_amount > 0 && !input.paid_date) {
    errors.paid_date = 'Tanggal pembayaran wajib diisi ketika ada nilai dibayar.';
  }
  if (input.billed_date && input.paid_date && input.paid_date < input.billed_date) {
    errors.paid_date = 'Tanggal pembayaran tidak boleh lebih awal dari tanggal tagihan.';
  }

  const duplicateSequence = existingTermins.some(
    (termin) => termin.id !== input.termin_id && termin.sequence_no === input.sequence_no,
  );
  if (duplicateSequence) errors.sequence_no = 'Urutan termin sudah digunakan.';

  if (input.status === 'not_billed' || input.status === 'in_process') {
    if (input.billed_amount !== 0 || input.paid_amount !== 0) {
      errors.status = 'Status ini hanya dapat digunakan jika nilai tagihan dan pembayaran masih nol.';
    }
  }
  if (input.status === 'billed' && (input.billed_amount <= 0 || input.paid_amount !== 0)) {
    errors.status = 'Status Ditagihkan membutuhkan nilai tagihan dan nilai dibayar nol.';
  }
  if (
    input.status === 'partially_paid' &&
    (input.billed_amount <= 0 || input.paid_amount <= 0 || input.paid_amount >= input.billed_amount)
  ) {
    errors.status = 'Status Dibayar Sebagian membutuhkan pembayaran di bawah nilai tagihan.';
  }
  if (
    input.status === 'paid' &&
    (input.billed_amount <= 0 || input.paid_amount !== input.billed_amount)
  ) {
    errors.status = 'Status Lunas membutuhkan nilai dibayar sama dengan nilai tagihan.';
  }

  return errors;
}
