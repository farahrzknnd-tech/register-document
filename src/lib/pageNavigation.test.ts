import { describe, expect, it } from 'vitest';
import { pageToHash, parsePageHash } from './pageNavigation';

describe('page navigation', () => {
  it('restores a valid page from the URL hash', () => {
    expect(parsePageHash('#/billingDashboard')).toBe('billingDashboard');
    expect(parsePageHash('#/billing')).toBe('billing');
    expect(parsePageHash('#/suratPenunjukan')).toBe('suratPenunjukan');
  });

  it('falls back to dashboard for an unknown page', () => {
    expect(parsePageHash('#/unknown')).toBe('dashboard');
    expect(parsePageHash('')).toBe('dashboard');
  });

  it('builds a stable hash for browser refresh persistence', () => {
    expect(pageToHash('billingDashboard')).toBe('#/billingDashboard');
    expect(pageToHash('billing')).toBe('#/billing');
  });
});
