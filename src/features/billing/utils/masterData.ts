import type { BillingTerminTemplateItem } from '../types';

export interface TerminTemplateItemDraft {
  id?: string;
  sequence_no: number;
  name: string;
  percentage: number | null;
  active: boolean;
}

export function normalizeMasterCode(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function createEmptyTerminItem(sequenceNo: number): TerminTemplateItemDraft {
  return {
    sequence_no: sequenceNo,
    name: '',
    percentage: null,
    active: true,
  };
}

export function toTerminItemDraft(item: BillingTerminTemplateItem): TerminTemplateItemDraft {
  return {
    id: item.id,
    sequence_no: item.sequence_no,
    name: item.name,
    percentage: item.percentage,
    active: item.active,
  };
}

export function resequenceTerminItems(items: TerminTemplateItemDraft[]): TerminTemplateItemDraft[] {
  return items.map((item, index) => ({ ...item, sequence_no: index + 1 }));
}

export function moveTerminItem(
  items: TerminTemplateItemDraft[],
  index: number,
  direction: -1 | 1,
): TerminTemplateItemDraft[] {
  const targetIndex = index + direction;
  if (index < 0 || index >= items.length || targetIndex < 0 || targetIndex >= items.length) {
    return items;
  }

  const reordered = [...items];
  [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
  return resequenceTerminItems(reordered);
}

export function activeTerminPercentageTotal(items: TerminTemplateItemDraft[]): number {
  return items.reduce((total, item) => {
    if (!item.active || item.percentage === null || Number.isNaN(item.percentage)) return total;
    return total + item.percentage;
  }, 0);
}

export function validateTerminTemplateItems(items: TerminTemplateItemDraft[]): string | null {
  if (!items.some((item) => item.active)) {
    return 'Template termin harus memiliki minimal satu item aktif.';
  }

  const normalizedNames = new Set<string>();
  for (const item of items) {
    const name = item.name.trim();
    if (!name) return 'Nama setiap item termin wajib diisi.';

    const normalizedName = name.toLocaleLowerCase('id-ID');
    if (normalizedNames.has(normalizedName)) {
      return 'Nama item termin tidak boleh duplikat.';
    }
    normalizedNames.add(normalizedName);

    if (item.percentage !== null && (item.percentage < 0 || item.percentage > 100)) {
      return 'Persentase item termin harus berada antara 0 dan 100.';
    }
  }

  if (activeTerminPercentageTotal(items) > 100) {
    return 'Total persentase item termin aktif tidak boleh melebihi 100%.';
  }

  return null;
}
