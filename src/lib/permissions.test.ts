import { describe, expect, it } from 'vitest';
import { canMutate, clustersForProject, inclusiveDuration, normalizeRefs, yearFromDate } from './permissions';

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

  it('filters clusters by project', () => {
    expect(clustersForProject([
      { id: 'c1', project_id: 'p1', name: 'A', code: null, created_at: '' },
      { id: 'c2', project_id: 'p2', name: 'B', code: null, created_at: '' },
    ], 'p1').map((cluster) => cluster.id)).toEqual(['c1']);
  });

  it('maps refs and register date year', () => {
    expect(normalizeRefs([{ ref_type: 'gambar', ref_id: 'g1' }])).toEqual([{ ref_type: 'gambar', ref_id: 'g1' }]);
    expect(yearFromDate('2026-07-19')).toBe(2026);
  });
});
