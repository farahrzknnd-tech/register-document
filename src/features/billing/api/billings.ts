import { supabase } from '../../../lib/supabase';
import type { Database } from '../../../lib/database.types';
import type {
  BillingActivityLog,
  BillingStageProgressDetail,
  BillingStatus,
  BillingTermin,
  SpkBilling,
  SpkBillingDetail,
  SpkBillingFinancialSummary,
  SpkBillingInput,
  SpkBillingListItem,
} from '../types';
import { normalizeNullable, resolveCurrentBillingStage } from '../utils/monitoring';

type SpkBillingRow = Database['public']['Tables']['spk_billings']['Row'];

const BILLING_SELECT = `
  *,
  project:projects(id,name,code),
  cluster:clusters(id,name,code),
  contractor:contractors(id,name,code,active),
  status:billing_statuses(id,code,name,color_key,sort_order,terminal,active),
  surat_penunjukan:surat_penunjukan(id,register_no,nomor_sp,tanggal_sp),
  termin_template:billing_termin_templates(id,code,name,active)
`;

function emptyFinancial(billing: SpkBilling): SpkBillingFinancialSummary {
  return {
    billing_id: billing.id,
    contract_value: billing.contract_value,
    total_planned: 0,
    total_billed: 0,
    total_paid: 0,
    remaining_contract: billing.contract_value,
    billing_percentage: 0,
    payment_percentage: 0,
  };
}

export async function fetchSpkBillings(): Promise<SpkBillingListItem[]> {
  const [billingResult, financialResult, stageResult] = await Promise.all([
    supabase
      .from('spk_billings')
      .select(BILLING_SELECT)
      .order('created_at', { ascending: false }),
    supabase.from('spk_billing_financial_summary').select('*'),
    supabase
      .from('billing_stage_progress')
      .select(`
        id,
        billing_id,
        stage_definition_id,
        status,
        completed_at,
        note,
        created_by,
        updated_by,
        created_at,
        updated_at,
        stage:billing_stage_definitions(*)
      `),
  ]);

  if (billingResult.error) throw billingResult.error;
  if (financialResult.error) throw financialResult.error;
  if (stageResult.error) throw stageResult.error;

  const financialByBilling = new Map<string, SpkBillingFinancialSummary>();
  for (const row of financialResult.data ?? []) {
    if (!row.billing_id) continue;
    financialByBilling.set(row.billing_id, {
      billing_id: row.billing_id,
      contract_value: row.contract_value ?? 0,
      total_planned: row.total_planned ?? 0,
      total_billed: row.total_billed ?? 0,
      total_paid: row.total_paid ?? 0,
      remaining_contract: row.remaining_contract ?? 0,
      billing_percentage: row.billing_percentage ?? 0,
      payment_percentage: row.payment_percentage ?? 0,
    });
  }

  const stagesByBilling = new Map<string, BillingStageProgressDetail[]>();
  for (const row of stageResult.data ?? []) {
    if (!row.stage) continue;
    const detail: BillingStageProgressDetail = {
      id: row.id,
      billing_id: row.billing_id,
      stage_definition_id: row.stage_definition_id,
      status: row.status as BillingStageProgressDetail['status'],
      completed_at: row.completed_at,
      note: row.note,
      created_by: row.created_by,
      updated_by: row.updated_by,
      created_at: row.created_at,
      updated_at: row.updated_at,
      stage: row.stage,
    };
    const group = stagesByBilling.get(row.billing_id) ?? [];
    group.push(detail);
    stagesByBilling.set(row.billing_id, group);
  }

  return (billingResult.data ?? []).map((row) => {
    if (!row.status) {
      throw new Error(`Billing status tidak ditemukan untuk SPK ${row.spk_number}.`);
    }

    const base: SpkBilling = {
      id: row.id,
      surat_penunjukan_id: row.surat_penunjukan_id,
      project_id: row.project_id,
      cluster_id: row.cluster_id,
      contractor_id: row.contractor_id,
      termin_template_id: row.termin_template_id,
      billing_status_id: row.billing_status_id,
      spk_number: row.spk_number,
      spk_date: row.spk_date,
      contractor_name_snapshot: row.contractor_name_snapshot,
      work_name: row.work_name,
      work_location: row.work_location,
      work_start_date: row.work_start_date,
      work_finish_date: row.work_finish_date,
      kickoff_date: row.kickoff_date,
      stage_weight: row.stage_weight,
      contract_value: row.contract_value,
      document_drive_url: row.document_drive_url,
      notes: row.notes,
      created_by: row.created_by,
      updated_by: row.updated_by,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };

    const financial = financialByBilling.get(row.id) ?? emptyFinancial(base);
    const stages = stagesByBilling.get(row.id) ?? [];

    return {
      ...base,
      project: row.project,
      cluster: row.cluster,
      contractor: row.contractor,
      status: {
        ...row.status,
        color_key: row.status.color_key as BillingStatus['color_key'],
      },
      surat_penunjukan: row.surat_penunjukan,
      termin_template: row.termin_template,
      financial,
      current_stage: resolveCurrentBillingStage(stages),
    };
  });
}

export async function fetchSpkBillingDetail(
  billing: SpkBillingListItem,
): Promise<SpkBillingDetail> {
  const [stageResult, terminResult, activityResult] = await Promise.all([
    supabase
      .from('billing_stage_progress')
      .select('*, stage:billing_stage_definitions(*)')
      .eq('billing_id', billing.id),
    supabase
      .from('billing_termins')
      .select('*')
      .eq('billing_id', billing.id)
      .order('sequence_no'),
    supabase
      .from('billing_activity_log')
      .select('*')
      .eq('billing_id', billing.id)
      .order('created_at', { ascending: false }),
  ]);

  if (stageResult.error) throw stageResult.error;
  if (terminResult.error) throw terminResult.error;
  if (activityResult.error) throw activityResult.error;

  const stages: BillingStageProgressDetail[] = (stageResult.data ?? [])
    .filter((row) => row.stage !== null)
    .map((row) => ({
      id: row.id,
      billing_id: row.billing_id,
      stage_definition_id: row.stage_definition_id,
      status: row.status as BillingStageProgressDetail['status'],
      completed_at: row.completed_at,
      note: row.note,
      created_by: row.created_by,
      updated_by: row.updated_by,
      created_at: row.created_at,
      updated_at: row.updated_at,
      stage: row.stage!,
    }))
    .sort((a, b) => a.stage.sort_order - b.stage.sort_order);

  const termins: BillingTermin[] = (terminResult.data ?? []).map((row) => ({
    ...row,
    status: row.status as BillingTermin['status'],
  }));

  const activities: BillingActivityLog[] = (activityResult.data ?? []).map((row) => ({
    ...row,
    entity_type: row.entity_type as BillingActivityLog['entity_type'],
    old_value: row.old_value,
    new_value: row.new_value,
  }));

  return { ...billing, stages, termins, activities };
}

type CreateSpkBillingArgs = Database['public']['Functions']['create_spk_billing']['Args'];
type UpdateSpkBillingArgs = Database['public']['Functions']['update_spk_billing']['Args'];

function assignOptional<T extends object, K extends keyof T>(
  target: T,
  key: K,
  value: T[K] | null | undefined,
): void {
  if (value !== null && value !== undefined && value !== '') {
    target[key] = value;
  }
}

function buildCreateArgs(input: SpkBillingInput): CreateSpkBillingArgs {
  const args: CreateSpkBillingArgs = {
    p_billing_status_id: input.billing_status_id,
    p_spk_number: input.spk_number.trim(),
    p_contractor_name_snapshot: input.contractor_name_snapshot.trim(),
    p_work_name: input.work_name.trim(),
    p_contract_value: input.contract_value,
  };

  assignOptional(args, 'p_surat_penunjukan_id', input.surat_penunjukan_id);
  assignOptional(args, 'p_project_id', input.project_id);
  assignOptional(args, 'p_cluster_id', input.cluster_id);
  assignOptional(args, 'p_contractor_id', input.contractor_id);
  assignOptional(args, 'p_termin_template_id', input.termin_template_id);
  assignOptional(args, 'p_spk_date', input.spk_date);
  assignOptional(args, 'p_work_location', normalizeNullable(input.work_location));
  assignOptional(args, 'p_work_start_date', input.work_start_date);
  assignOptional(args, 'p_work_finish_date', input.work_finish_date);
  assignOptional(args, 'p_kickoff_date', input.kickoff_date);
  assignOptional(args, 'p_stage_weight', normalizeNullable(input.stage_weight));
  assignOptional(args, 'p_document_drive_url', normalizeNullable(input.document_drive_url));
  assignOptional(args, 'p_notes', normalizeNullable(input.notes));

  return args;
}

function buildUpdateArgs(id: string, input: SpkBillingInput): UpdateSpkBillingArgs {
  const args: UpdateSpkBillingArgs = {
    p_billing_id: id,
    p_billing_status_id: input.billing_status_id,
    p_spk_number: input.spk_number.trim(),
    p_contractor_name_snapshot: input.contractor_name_snapshot.trim(),
    p_work_name: input.work_name.trim(),
    p_contract_value: input.contract_value,
  };

  assignOptional(args, 'p_project_id', input.project_id);
  assignOptional(args, 'p_cluster_id', input.cluster_id);
  assignOptional(args, 'p_contractor_id', input.contractor_id);
  assignOptional(args, 'p_spk_date', input.spk_date);
  assignOptional(args, 'p_work_location', normalizeNullable(input.work_location));
  assignOptional(args, 'p_work_start_date', input.work_start_date);
  assignOptional(args, 'p_work_finish_date', input.work_finish_date);
  assignOptional(args, 'p_kickoff_date', input.kickoff_date);
  assignOptional(args, 'p_stage_weight', normalizeNullable(input.stage_weight));
  assignOptional(args, 'p_document_drive_url', normalizeNullable(input.document_drive_url));
  assignOptional(args, 'p_notes', normalizeNullable(input.notes));

  return args;
}

export async function createSpkBilling(input: SpkBillingInput): Promise<SpkBillingRow> {
  const { data, error } = await supabase.rpc('create_spk_billing', buildCreateArgs(input));
  if (error) throw error;
  return data;
}

export async function updateSpkBilling(
  id: string,
  input: SpkBillingInput,
): Promise<SpkBillingRow> {
  const { data, error } = await supabase.rpc('update_spk_billing', buildUpdateArgs(id, input));
  if (error) throw error;
  return data;
}

export async function deleteSpkBilling(id: string): Promise<void> {
  const { error } = await supabase.rpc('delete_spk_billing', { p_billing_id: id });
  if (error) throw error;
}
