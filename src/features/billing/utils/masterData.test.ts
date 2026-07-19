import { describe, expect, it } from 'vitest';
import {
  activeTerminPercentageTotal,
  createEmptyTerminItem,
  moveTerminItem,
  normalizeMasterCode,
  resequenceTerminItems,
  validateTerminTemplateItems,
} from './masterData';

describe('billing master data helpers', () => {
  it('normalizes master codes consistently', () => {
    expect(normalizeMasterCode('  BI Review & Signed  ')).toBe('bi_review_signed');
    expect(normalizeMasterCode('TERMIN--01')).toBe('termin_01');
  });

  it('moves and resequences termin items without mutating the source', () => {
    const source = [
      { ...createEmptyTerminItem(1), name: 'A' },
      { ...createEmptyTerminItem(2), name: 'B' },
      { ...createEmptyTerminItem(3), name: 'C' },
    ];
    const moved = moveTerminItem(source, 1, -1);

    expect(moved.map((item) => item.name)).toEqual(['B', 'A', 'C']);
    expect(moved.map((item) => item.sequence_no)).toEqual([1, 2, 3]);
    expect(source.map((item) => item.name)).toEqual(['A', 'B', 'C']);
    expect(resequenceTerminItems(source).map((item) => item.sequence_no)).toEqual([1, 2, 3]);
  });

  it('calculates active percentages and validates template items', () => {
    const items = [
      { ...createEmptyTerminItem(1), name: 'Termin 1', percentage: 60 },
      { ...createEmptyTerminItem(2), name: 'Termin 2', percentage: 40 },
      { ...createEmptyTerminItem(3), name: 'Nonaktif', percentage: 50, active: false },
    ];

    expect(activeTerminPercentageTotal(items)).toBe(100);
    expect(validateTerminTemplateItems(items)).toBeNull();
    expect(validateTerminTemplateItems([...items, { ...createEmptyTerminItem(4), name: 'Termin 4', percentage: 1 }]))
      .toBe('Total persentase item termin aktif tidak boleh melebihi 100%.');
  });

  it('rejects empty and duplicate active template definitions', () => {
    expect(validateTerminTemplateItems([{ ...createEmptyTerminItem(1), name: '', active: true }]))
      .toBe('Nama setiap item termin wajib diisi.');
    expect(validateTerminTemplateItems([
      { ...createEmptyTerminItem(1), name: 'Retensi' },
      { ...createEmptyTerminItem(2), name: 'retensi' },
    ])).toBe('Nama item termin tidak boleh duplikat.');
    expect(validateTerminTemplateItems([{ ...createEmptyTerminItem(1), name: 'Termin', active: false }]))
      .toBe('Template termin harus memiliki minimal satu item aktif.');
  });
});
