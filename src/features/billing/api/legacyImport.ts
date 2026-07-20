import { supabase } from '../../../lib/supabase';
import type {
  BillingImportRun,
  LegacyBillingBackup,
  LegacyImportSummary,
} from '../utils/legacyImport';

interface LegacyImportRpc {
  (
    functionName: 'import_legacy_billing_backup',
    args: {
      p_payload: LegacyBillingBackup;
      p_file_name: string | null;
      p_checksum: string | null;
      p_dry_run: boolean;
    },
  ): PromiseLike<{ data: LegacyImportSummary | null; error: unknown | null }>;
  (
    functionName: 'list_billing_import_runs',
    args?: Record<string, never>,
  ): PromiseLike<{ data: BillingImportRun[] | null; error: unknown | null }>;
}

const legacyImportRpc = supabase.rpc.bind(supabase) as unknown as LegacyImportRpc;

export async function previewLegacyBillingImport(
  payload: LegacyBillingBackup,
  fileName: string,
  checksum: string,
): Promise<LegacyImportSummary> {
  const { data, error } = await legacyImportRpc('import_legacy_billing_backup', {
    p_payload: payload,
    p_file_name: fileName || null,
    p_checksum: checksum || null,
    p_dry_run: true,
  });
  if (error) throw error;
  if (!data) throw new Error('Legacy import preview returned no result');
  return data;
}

export async function executeLegacyBillingImport(
  payload: LegacyBillingBackup,
  fileName: string,
  checksum: string,
): Promise<LegacyImportSummary> {
  const { data, error } = await legacyImportRpc('import_legacy_billing_backup', {
    p_payload: payload,
    p_file_name: fileName || null,
    p_checksum: checksum || null,
    p_dry_run: false,
  });
  if (error) throw error;
  if (!data) throw new Error('Legacy import returned no result');
  return data;
}

export async function fetchBillingImportRuns(): Promise<BillingImportRun[]> {
  const { data, error } = await legacyImportRpc('list_billing_import_runs');
  if (error) throw error;
  return data ?? [];
}
