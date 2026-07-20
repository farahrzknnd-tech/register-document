import type { DocType, DocumentSummary, SuratPenunjukan } from '../lib/types';

export interface DashboardExplorerSelection {
  kind: 'all' | 'cluster' | 'type' | 'subtype';
  clusterName?: string;
  type?: DocType;
  subtype?: string;
}

export interface DashboardExplorerDocument {
  summary: Pick<DocumentSummary, 'type' | 'subtitle'>;
  clusterName: string;
  status: string;
}

export function matchesDashboardExplorerSelection(
  document: DashboardExplorerDocument,
  selection: DashboardExplorerSelection,
): boolean {
  if (selection.kind === 'all') return true;

  if (selection.clusterName && document.clusterName !== selection.clusterName) {
    return false;
  }

  if (selection.kind === 'cluster') {
    return Boolean(selection.clusterName);
  }

  if (selection.kind === 'type') {
    return selection.type ? document.summary.type === selection.type : true;
  }

  if (selection.kind === 'subtype') {
    if (selection.type && document.summary.type !== selection.type) return false;
    if (!selection.subtype) return true;

    return document.summary.subtitle === selection.subtype || document.status === selection.subtype;
  }

  return true;
}

export function getSuratPenunjukanDashboardTitle(
  suratPenunjukan: SuratPenunjukan,
): string {
  return suratPenunjukan.jenis_pekerjaan.trim() || suratPenunjukan.nomor_sp;
}

export function getSuratPenunjukanAgendaTitle(
  suratPenunjukan: SuratPenunjukan,
): string {
  return suratPenunjukan.jenis_pekerjaan.trim() || 'Surat Penunjukan';
}

export function getSuratPenunjukanAgendaSubtitle(
  suratPenunjukan: SuratPenunjukan,
): string {
  const nomorSuratPenunjukan = suratPenunjukan.nomor_sp.trim();

  return nomorSuratPenunjukan
    ? `Kick Off Meeting - ${nomorSuratPenunjukan}`
    : 'Kick Off Meeting';
}
