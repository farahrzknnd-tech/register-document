import { describe, expect, it } from 'vitest';
import { canMutate, inclusiveDuration, normalizeRefs, yearFromDate } from './permissions';

describe('frontend permission helpers', () => {
  it('allows only admin mutations', () => {
    expect(canMutate('admin')).toBe(true);
    expect(canMutate('viewer')).toBe(false);
    expect(canMutate(null)).toBe(false);
  });

  it('calculates inclusive calendar duration', () => {
    expect(inclusiveDuration('2026-07-19', '2026-07-19')).toBe(1);
    expect(inclusiveDuration('2026-07-19', '2026-07-20')).toBe(2);
    expect(inclusiveDuration('2026-07-20', '2026-07-19')).toBeNull();
  });

  it('maps refs and register date year', () => {
    expect(normalizeRefs([{ ref_type: 'gambar', ref_id: 'g1' }])).toEqual([{ ref_type: 'gambar', ref_id: 'g1' }]);
    expect(yearFromDate('2026-07-19')).toBe(2026);
  });
});
