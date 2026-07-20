export const PAGE_IDS = [
  'dashboard',
  'gambar',
  'surat',
  'beritaAcara',
  'suratPenunjukan',
  'billingDashboard',
  'billing',
  'billingReports',
  'master',
  'laporan',
] as const;

export type PageId = (typeof PAGE_IDS)[number];

export function parsePageHash(hash: string): PageId {
  const normalized = hash.replace(/^#\/?/, '').trim();
  return PAGE_IDS.includes(normalized as PageId)
    ? (normalized as PageId)
    : 'dashboard';
}

export function pageToHash(page: PageId): string {
  return `#/${page}`;
}

export function getInitialPage(): PageId {
  if (typeof window === 'undefined') return 'dashboard';
  return parsePageHash(window.location.hash);
}
