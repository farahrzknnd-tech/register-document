export interface LegacyStageState {
  status: string;
  date: string;
  time: string;
  note: string;
}

export interface LegacyTermin {
  name: string;
  percentage: number | null;
  nilaiTermin: number;
  nilaiDitagihkan: number;
  status: string;
}

export interface LegacySpkRecord {
  id?: string;
  nomorSpk: string;
  projectCluster: string;
  namaKontraktor: string;
  namaPekerjaan: string;
  lokasiPekerjaan: string;
  nilaiSpk: number;
  nilaiDitagihkan: number;
  bobotTahapan: string;
  status: string;
  linkGdrive: string;
  selectedStages: string[];
  stages: Record<string, LegacyStageState>;
  terminTemplateId: string | null;
  termins: LegacyTermin[];
  createdAt?: string;
  updatedAt?: string;
}

export interface LegacyMasterContractor {
  id?: string;
  name: string;
  pic: string;
  phone: string;
}

export interface LegacyMasterStatus {
  id?: string;
  name: string;
}

export interface LegacyTerminTemplateItem {
  name: string;
  percentage: number | null;
}

export interface LegacyTerminTemplate {
  id: string;
  name: string;
  termins: LegacyTerminTemplateItem[];
}

export interface LegacyBillingBackup {
  exportDate: string;
  spkRecords: LegacySpkRecord[];
  masterProjects: Array<{ id?: string; name: string }>;
  masterContractors: LegacyMasterContractor[];
  masterStatuses: LegacyMasterStatus[];
  masterStages: Array<{
    id?: string;
    stageKey: string;
    label: string;
    isActive: boolean;
    sortOrder: number;
  }>;
  masterTerminTemplates: LegacyTerminTemplate[];
}

export interface LegacyImportSummary {
  dry_run: boolean;
  total_records: number;
  importable_records: number;
  imported_records: number;
  duplicate_records: number;
  invalid_records: number;
  unresolved_scopes: number;
  created_contractors: number;
  created_statuses: number;
  created_templates: number;
  warnings: string[];
}

export interface BillingImportRun {
  id: string;
  source: string;
  file_name: string | null;
  checksum: string | null;
  imported_by: string | null;
  status: 'completed' | 'completed_with_warnings';
  summary: LegacyImportSummary;
  created_at: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function asNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  return asNumber(value);
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function parseStages(value: unknown): Record<string, LegacyStageState> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).map(([key, raw]) => {
      const stage = isRecord(raw) ? raw : {};
      return [key, {
        status: asString(stage.status),
        date: asString(stage.date),
        time: asString(stage.time),
        note: asString(stage.note),
      }];
    }),
  );
}

function parseTermins(value: unknown): LegacyTermin[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isRecord)
    .map((item) => ({
      name: asString(item.name).trim(),
      percentage: asNullableNumber(item.percentage),
      nilaiTermin: Math.max(0, asNumber(item.nilaiTermin)),
      nilaiDitagihkan: Math.max(0, asNumber(item.nilaiDitagihkan)),
      status: asString(item.status),
    }))
    .filter((item) => item.name.length > 0);
}

function parseSpkRecord(value: unknown): LegacySpkRecord | null {
  if (!isRecord(value)) return null;
  return {
    id: asString(value.id) || undefined,
    nomorSpk: asString(value.nomorSpk).trim(),
    projectCluster: asString(value.projectCluster).trim(),
    namaKontraktor: asString(value.namaKontraktor).trim(),
    namaPekerjaan: asString(value.namaPekerjaan).trim(),
    lokasiPekerjaan: asString(value.lokasiPekerjaan).trim(),
    nilaiSpk: Math.max(0, asNumber(value.nilaiSpk)),
    nilaiDitagihkan: Math.max(0, asNumber(value.nilaiDitagihkan)),
    bobotTahapan: asString(value.bobotTahapan).trim(),
    status: asString(value.status).trim() || 'Open',
    linkGdrive: asString(value.linkGdrive).trim(),
    selectedStages: asStringArray(value.selectedStages),
    stages: parseStages(value.stages),
    terminTemplateId: asString(value.terminTemplateId).trim() || null,
    termins: parseTermins(value.termins),
    createdAt: asString(value.createdAt) || undefined,
    updatedAt: asString(value.updatedAt) || undefined,
  };
}

export function parseLegacyBillingBackup(text: string): LegacyBillingBackup {
  if (text.length > 10 * 1024 * 1024) {
    throw new Error('Ukuran file import maksimal 10 MB.');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('File bukan JSON yang valid.');
  }

  if (!isRecord(parsed) || !Array.isArray(parsed.spkRecords)) {
    throw new Error('Format backup tidak valid: spkRecords wajib berupa array.');
  }

  if (parsed.spkRecords.length > 5000) {
    throw new Error('Satu file hanya boleh berisi maksimal 5.000 SPK.');
  }

  const records = parsed.spkRecords
    .map(parseSpkRecord)
    .filter((record): record is LegacySpkRecord => record !== null);

  const masterContractors = Array.isArray(parsed.masterContractors)
    ? parsed.masterContractors.filter(isRecord).map((item) => ({
      id: asString(item.id) || undefined,
      name: asString(item.name).trim(),
      pic: asString(item.pic).trim(),
      phone: asString(item.phone).trim(),
    })).filter((item) => item.name)
    : [];

  const masterStatuses = Array.isArray(parsed.masterStatuses)
    ? parsed.masterStatuses.filter(isRecord).map((item) => ({
      id: asString(item.id) || undefined,
      name: asString(item.name).trim(),
    })).filter((item) => item.name)
    : [];

  const masterTerminTemplates = Array.isArray(parsed.masterTerminTemplates)
    ? parsed.masterTerminTemplates.filter(isRecord).map((item) => ({
      id: asString(item.id),
      name: asString(item.name).trim(),
      termins: Array.isArray(item.termins)
        ? item.termins.filter(isRecord).map((termin) => ({
          name: asString(termin.name).trim(),
          percentage: asNullableNumber(termin.percentage),
        })).filter((termin) => termin.name)
        : [],
    })).filter((item) => item.id && item.name)
    : [];

  return {
    exportDate: asString(parsed.exportDate) || new Date().toISOString(),
    spkRecords: records,
    masterProjects: Array.isArray(parsed.masterProjects)
      ? parsed.masterProjects.filter(isRecord).map((item) => ({
        id: asString(item.id) || undefined,
        name: asString(item.name).trim(),
      })).filter((item) => item.name)
      : [],
    masterContractors,
    masterStatuses,
    masterStages: Array.isArray(parsed.masterStages)
      ? parsed.masterStages.filter(isRecord).map((item) => ({
        id: asString(item.id) || undefined,
        stageKey: asString(item.stageKey),
        label: asString(item.label),
        isActive: item.isActive !== false,
        sortOrder: asNumber(item.sortOrder),
      }))
      : [],
    masterTerminTemplates,
  };
}

export function summarizeLegacyBackup(data: LegacyBillingBackup) {
  const invalidRecords = data.spkRecords.filter(
    (record) => !record.nomorSpk || !record.namaKontraktor || !record.namaPekerjaan,
  ).length;

  return {
    records: data.spkRecords.length,
    validRecords: data.spkRecords.length - invalidRecords,
    invalidRecords,
    contractors: data.masterContractors.length,
    statuses: data.masterStatuses.length,
    templates: data.masterTerminTemplates.length,
    stages: data.masterStages.length,
  };
}

export async function sha256Text(value: string): Promise<string> {
  if (!globalThis.crypto?.subtle) return '';
  const bytes = new TextEncoder().encode(value);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
