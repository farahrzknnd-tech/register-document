export function formatDate(d: string | null | undefined): string {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function calcDurasi(start: string | null, finish: string | null): number | null {
  if (!start || !finish) return null;
  const s = new Date(start);
  const f = new Date(finish);
  if (f < s) return null;
  return Math.round((f.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
}

import type { Gambar, Surat, SuratPenunjukan, BeritaAcara, DocumentSummary, DocType } from './types';

export function toDocSummary(type: DocType, doc: Gambar | Surat | SuratPenunjukan | BeritaAcara): DocumentSummary {
  if (type === 'gambar') {
    const g = doc as Gambar;
    return { id: g.id, type, register_no: g.register_no, title: g.judul_gambar, subtitle: g.jenis_gambar, date: g.tanggal_diterima };
  }
  if (type === 'surat') {
    const s = doc as Surat;
    return { id: s.id, type, register_no: s.register_no, title: s.perihal, subtitle: s.nomor_surat, date: s.tanggal_surat };
  }
  if (type === 'berita_acara') {
    const b = doc as BeritaAcara;
    return { id: b.id, type, register_no: b.register_no, title: b.perihal, subtitle: b.jenis_berita_acara, date: b.tanggal };
  }
  const sp = doc as SuratPenunjukan;
  return { id: sp.id, type, register_no: sp.register_no, title: sp.nomor_sp, subtitle: sp.nama_kontraktor, date: sp.tanggal_sp };
}

export function buildAllDocSummaries(
  gambar: Gambar[],
  surat: Surat[],
  suratPenunjukan: SuratPenunjukan[],
  beritaAcara: BeritaAcara[] = []
): DocumentSummary[] {
  return [
    ...gambar.map((g) => toDocSummary('gambar', g)),
    ...surat.map((s) => toDocSummary('surat', s)),
    ...suratPenunjukan.map((sp) => toDocSummary('surat_penunjukan', sp)),
    ...beritaAcara.map((b) => toDocSummary('berita_acara', b)),
  ];
}

export function findDoc(
  type: DocType,
  id: string,
  gambar: Gambar[],
  surat: Surat[],
  suratPenunjukan: SuratPenunjukan[],
  beritaAcara: BeritaAcara[] = []
): Gambar | Surat | SuratPenunjukan | BeritaAcara | undefined {
  if (type === 'gambar') return gambar.find((g) => g.id === id);
  if (type === 'surat') return surat.find((s) => s.id === id);
  if (type === 'berita_acara') return beritaAcara.find((b) => b.id === id);
  return suratPenunjukan.find((sp) => sp.id === id);
}

// ---- Google Drive URL helpers ----
// Extracts the file ID from a Google Drive URL (file or folder).
export function extractDriveId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/,
  /\/folders\/([a-zA-Z0-9_-]+)/,
  /id=([a-zA-Z0-9_-]+)/,
  /([a-zA-Z0-9_-]{25,})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m && m[1]) return m[1];
  }
  return null;
}

// Detects whether a Google Drive URL points to a folder.
export function isDriveFolder(url: string): boolean {
  if (!url) return false;
  return /\/folders\//i.test(url) || /[?&]id=[^&]+/.test(url) === false && /\/folders\/[a-zA-Z0-9_-]+/.test(url);
}

// Returns a direct-download URL for a Drive file, or null if it's a folder / invalid.
export function getDriveDownloadUrl(url: string): string | null {
  const id = extractDriveId(url);
  if (!id) return null;
  if (isDriveFolder(url)) return null;
  return `https://drive.google.com/uc?export=download&id=${id}`;
}

export function isValidDriveUrl(url: string): boolean {
  if (!url || url.trim() === '') return false;
  return /drive\.google\.com/i.test(url) || extractDriveId(url) !== null;
}
