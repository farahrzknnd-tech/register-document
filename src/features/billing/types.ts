export type BillingStageStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'skipped';

export type BillingTerminStatus =
  | 'not_billed'
  | 'in_process'
  | 'billed'
  | 'partially_paid'
  | 'paid'
  | 'cancelled';

export interface Contractor {
  id: string;
  code: string | null;
  name: string;
  pic_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BillingStatus {
  id: string;
  code: string;
  name: string;
  description: string | null;
  color_key: 'gray' | 'blue' | 'amber' | 'green' | 'red' | 'purple';
  sort_order: number;
  terminal: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BillingStageDefinition {
  id: string;
  code: string;
  name: string;
  description: string | null;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BillingTerminTemplate {
  id: string;
  code: string;
  name: string;
  description: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BillingTerminTemplateItem {
  id: string;
  template_id: string;
  sequence_no: number;
  name: string;
  percentage: number | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SpkBilling {
  id: string;
  surat_penunjukan_id: string | null;
  project_id: string | null;
  cluster_id: string | null;
  contractor_id: string | null;
  termin_template_id: string | null;
  billing_status_id: string;
  spk_number: string;
  spk_date: string | null;
  contractor_name_snapshot: string;
  work_name: string;
  work_location: string | null;
  work_start_date: string | null;
  work_finish_date: string | null;
  kickoff_date: string | null;
  stage_weight: string | null;
  contract_value: number;
  document_drive_url: string | null;
  notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BillingStageProgress {
  id: string;
  billing_id: string;
  stage_definition_id: string;
  status: BillingStageStatus;
  completed_at: string | null;
  note: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BillingTermin {
  id: string;
  billing_id: string;
  template_item_id: string | null;
  sequence_no: number;
  name: string;
  percentage: number | null;
  planned_amount: number;
  billed_amount: number;
  paid_amount: number;
  status: BillingTerminStatus;
  billed_date: string | null;
  paid_date: string | null;
  notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SpkBillingFinancialSummary {
  billing_id: string;
  contract_value: number;
  total_planned: number;
  total_billed: number;
  total_paid: number;
  remaining_contract: number;
  billing_percentage: number;
  payment_percentage: number;
}
