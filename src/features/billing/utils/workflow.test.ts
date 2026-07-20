import { describe, expect, it } from 'vitest';
import type { BillingStageProgressInput, BillingTermin, BillingTerminInput } from '../types';
import {
  sanitizeMoneyInput,
  toDateTimeLocalValue,
  toIsoDateTime,
  validateBillingStageInput,
  validateBillingTerminInput,
} from './workflow';

const stageInput: BillingStageProgressInput = {
  progress_id: 'progress-1',
  status: 'completed',
  completed_at: null,
  note: '',
};

const terminInput: BillingTerminInput = {
  billing_id: 'billing-1',
  termin_id: null,
  sequence_no: 1,
  name: 'Termin 1',
  percentage: 50,
  planned_amount: 500_000,
  billed_amount: 0,
  paid_amount: 0,
  status: 'not_billed',
  billed_date: null,
  paid_date: null,
  notes: '',
};

const existing: BillingTermin = {
  id: 'termin-existing',
  billing_id: 'billing-1',
  template_item_id: null,
  sequence_no: 2,
  name: 'Termin 2',
  percentage: 50,
  planned_amount: 500_000,
  billed_amount: 0,
  paid_amount: 0,
  status: 'not_billed',
  billed_date: null,
  paid_date: null,
  notes: null,
  created_by: null,
  updated_by: null,
  created_at: '2026-07-20T00:00:00Z',
  updated_at: '2026-07-20T00:00:00Z',
};

describe('billing workflow utilities', () => {
  it('requires completion date for a completed stage', () => {
    expect(validateBillingStageInput(stageInput)).toHaveProperty('completed_at');
    expect(validateBillingStageInput({ ...stageInput, completed_at: '2026-07-20T10:00:00Z' })).toEqual({});
  });

  it('validates termin amount, status, dates, and sequence consistency', () => {
    expect(validateBillingTerminInput(terminInput, 1_000_000, [existing])).toEqual({});
    expect(validateBillingTerminInput({
      ...terminInput,
      sequence_no: 2,
      billed_amount: 600_000,
      paid_amount: 700_000,
      status: 'paid',
    }, 1_000_000, [existing])).toMatchObject({
      sequence_no: expect.any(String),
      billed_amount: expect.any(String),
      paid_amount: expect.any(String),
      billed_date: expect.any(String),
      paid_date: expect.any(String),
      status: expect.any(String),
    });
  });

  it('sanitizes money and converts datetime-local values safely', () => {
    expect(sanitizeMoneyInput('Rp 01.250.000')).toBe('1250000');
    const iso = toIsoDateTime('2026-07-20T10:30');
    expect(iso).toMatch(/^2026-07-20T/);
    expect(toDateTimeLocalValue(iso)).toBe('2026-07-20T10:30');
  });
});
