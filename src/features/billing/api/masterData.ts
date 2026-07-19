import { supabase } from '../../../lib/supabase';
import type { Database, Json } from '../../../lib/database.types';
import type {
  BillingStageDefinition,
  BillingStatus,
  BillingTerminTemplate,
  BillingTerminTemplateItem,
  Contractor,
} from '../types';
import type { TerminTemplateItemDraft } from '../utils/masterData';

type ContractorInsert = Database['public']['Tables']['contractors']['Insert'];
type BillingStatusInsert = Database['public']['Tables']['billing_statuses']['Insert'];
type BillingStageInsert = Database['public']['Tables']['billing_stage_definitions']['Insert'];
type BillingTerminTemplateRow = Database['public']['Tables']['billing_termin_templates']['Row'];

export interface ContractorInput {
  code: string;
  name: string;
  pic_name: string;
  phone: string;
  email: string;
  address: string;
  active: boolean;
}

export interface BillingStatusInput {
  code: string;
  name: string;
  description: string;
  color_key: BillingStatus['color_key'];
  sort_order: number;
  terminal: boolean;
  active: boolean;
}

export interface BillingStageInput {
  code: string;
  name: string;
  description: string;
  sort_order: number;
  active: boolean;
}

export interface BillingTerminTemplateInput {
  code: string;
  name: string;
  description: string;
  active: boolean;
  items: TerminTemplateItemDraft[];
}

export interface BillingTerminTemplateWithItems extends BillingTerminTemplate {
  items: BillingTerminTemplateItem[];
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export async function fetchContractors(): Promise<Contractor[]> {
  const { data, error } = await supabase
    .from('contractors')
    .select('*')
    .order('active', { ascending: false })
    .order('name');
  if (error) throw error;
  return data ?? [];
}

export async function createContractor(input: ContractorInput): Promise<Contractor> {
  const payload: ContractorInsert = {
    code: emptyToNull(input.code),
    name: input.name.trim(),
    pic_name: emptyToNull(input.pic_name),
    phone: emptyToNull(input.phone),
    email: emptyToNull(input.email),
    address: emptyToNull(input.address),
    active: input.active,
  };
  const { data, error } = await supabase.from('contractors').insert(payload).select('*').single();
  if (error) throw error;
  return data;
}

export async function updateContractor(id: string, input: ContractorInput): Promise<Contractor> {
  const payload: Database['public']['Tables']['contractors']['Update'] = {
    code: emptyToNull(input.code),
    name: input.name.trim(),
    pic_name: emptyToNull(input.pic_name),
    phone: emptyToNull(input.phone),
    email: emptyToNull(input.email),
    address: emptyToNull(input.address),
    active: input.active,
  };
  const { data, error } = await supabase.from('contractors').update(payload).eq('id', id).select('*').single();
  if (error) throw error;
  return data;
}

export async function deleteContractor(id: string): Promise<void> {
  const { error } = await supabase.from('contractors').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchBillingStatuses(): Promise<BillingStatus[]> {
  const { data, error } = await supabase
    .from('billing_statuses')
    .select('*')
    .order('sort_order')
    .order('name');
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...row,
    color_key: row.color_key as BillingStatus['color_key'],
  }));
}

export async function createBillingStatus(input: BillingStatusInput): Promise<BillingStatus> {
  const payload: BillingStatusInsert = {
    code: input.code.trim().toLowerCase(),
    name: input.name.trim(),
    description: emptyToNull(input.description),
    color_key: input.color_key,
    sort_order: input.sort_order,
    terminal: input.terminal,
    active: input.active,
  };
  const { data, error } = await supabase.from('billing_statuses').insert(payload).select('*').single();
  if (error) throw error;
  return { ...data, color_key: data.color_key as BillingStatus['color_key'] };
}

export async function updateBillingStatus(id: string, input: BillingStatusInput): Promise<BillingStatus> {
  const payload: Database['public']['Tables']['billing_statuses']['Update'] = {
    code: input.code.trim().toLowerCase(),
    name: input.name.trim(),
    description: emptyToNull(input.description),
    color_key: input.color_key,
    sort_order: input.sort_order,
    terminal: input.terminal,
    active: input.active,
  };
  const { data, error } = await supabase.from('billing_statuses').update(payload).eq('id', id).select('*').single();
  if (error) throw error;
  return { ...data, color_key: data.color_key as BillingStatus['color_key'] };
}

export async function deleteBillingStatus(id: string): Promise<void> {
  const { error } = await supabase.from('billing_statuses').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchBillingStages(): Promise<BillingStageDefinition[]> {
  const { data, error } = await supabase
    .from('billing_stage_definitions')
    .select('*')
    .order('sort_order')
    .order('name');
  if (error) throw error;
  return data ?? [];
}

export async function createBillingStage(input: BillingStageInput): Promise<BillingStageDefinition> {
  const payload: BillingStageInsert = {
    code: input.code.trim().toLowerCase(),
    name: input.name.trim(),
    description: emptyToNull(input.description),
    sort_order: input.sort_order,
    active: input.active,
  };
  const { data, error } = await supabase.from('billing_stage_definitions').insert(payload).select('*').single();
  if (error) throw error;
  return data;
}

export async function updateBillingStage(id: string, input: BillingStageInput): Promise<BillingStageDefinition> {
  const payload: Database['public']['Tables']['billing_stage_definitions']['Update'] = {
    code: input.code.trim().toLowerCase(),
    name: input.name.trim(),
    description: emptyToNull(input.description),
    sort_order: input.sort_order,
    active: input.active,
  };
  const { data, error } = await supabase.from('billing_stage_definitions').update(payload).eq('id', id).select('*').single();
  if (error) throw error;
  return data;
}

export async function deleteBillingStage(id: string): Promise<void> {
  const { error } = await supabase.from('billing_stage_definitions').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchBillingTerminTemplates(): Promise<BillingTerminTemplateWithItems[]> {
  const { data, error } = await supabase
    .from('billing_termin_templates')
    .select('*, items:billing_termin_template_items(*)')
    .order('active', { ascending: false })
    .order('name');
  if (error) throw error;

  return (data ?? []).map((row) => ({
    ...row,
    items: [...(row.items ?? [])].sort((a, b) => a.sequence_no - b.sequence_no),
  }));
}

export async function saveBillingTerminTemplate(
  id: string | null,
  input: BillingTerminTemplateInput,
): Promise<BillingTerminTemplateRow> {
  const items: Json = input.items.map((item, index) => ({
    sequence_no: index + 1,
    name: item.name.trim(),
    percentage: item.percentage,
    active: item.active,
  }));

  const { data, error } = await supabase.rpc('save_billing_termin_template', {
    p_template_id: id ?? undefined,
    p_code: input.code,
    p_name: input.name,
    p_description: input.description,
    p_active: input.active,
    p_items: items,
  });
  if (error) throw error;
  return data;
}

export async function deleteBillingTerminTemplate(id: string): Promise<void> {
  const { error } = await supabase.from('billing_termin_templates').delete().eq('id', id);
  if (error) throw error;
}
