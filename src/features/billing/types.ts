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


export interface BillingStageProgressInput {
  progress_id: string;
  status: BillingStageStatus;
  completed_at: string | null;
  note: string;
}

export interface BillingTerminInput {
  billing_id: string;
  termin_id: string | null;
  sequence_no: number;
  name: string;
  percentage: number | null;
  planned_amount: number;
  billed_amount: number;
  paid_amount: number;
  status: BillingTerminStatus;
  billed_date: string | null;
  paid_date: string | null;
  notes: string;
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

export interface BillingProjectSummary {
  id: string;
  name: string;
  code: string | null;
}

export interface BillingClusterSummary {
  id: string;
  name: string;
  code: string | null;
}

export interface BillingContractorSummary {
  id: string;
  name: string;
  code: string | null;
  active: boolean;
}

export interface BillingStatusSummary {
  id: string;
  code: string;
  name: string;
  color_key: BillingStatus['color_key'];
  sort_order: number;
  terminal: boolean;
  active: boolean;
}

export interface BillingSuratPenunjukanSummary {
  id: string;
  register_no: string | null;
  nomor_sp: string;
  tanggal_sp: string;
}

export interface BillingTerminTemplateSummary {
  id: string;
  code: string;
  name: string;
  active: boolean;
}

export interface BillingCurrentStage {
  id: string;
  code: string;
  name: string;
  sort_order: number;
  status: BillingStageStatus;
  completed_at: string | null;
}

export interface SpkBillingListItem extends SpkBilling {
  project: BillingProjectSummary | null;
  cluster: BillingClusterSummary | null;
  contractor: BillingContractorSummary | null;
  status: BillingStatusSummary;
  surat_penunjukan: BillingSuratPenunjukanSummary | null;
  termin_template: BillingTerminTemplateSummary | null;
  financial: SpkBillingFinancialSummary;
  current_stage: BillingCurrentStage | null;
}

export interface BillingStageProgressDetail extends BillingStageProgress {
  stage: BillingStageDefinition;
}

export interface BillingActivityLog {
  id: string;
  billing_id: string;
  entity_type: 'billing' | 'stage' | 'termin';
  entity_id: string | null;
  action: string;
  old_value: unknown;
  new_value: unknown;
  actor_user_id: string | null;
  created_at: string;
}

export interface SpkBillingDetail extends SpkBillingListItem {
  stages: BillingStageProgressDetail[];
  termins: BillingTermin[];
  activities: BillingActivityLog[];
}

export interface SpkBillingInput {
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
  work_location: string;
  work_start_date: string | null;
  work_finish_date: string | null;
  kickoff_date: string | null;
  stage_weight: string;
  contract_value: number;
  document_drive_url: string;
  notes: string;
}

export interface BillingFilterState {
  search: string;
  statusId: string;
  projectId: string;
  clusterId: string;
  contractorId: string;
  sort: 'newest' | 'oldest' | 'spk_asc' | 'contract_desc';
}

export interface BillingReportFilters {
  search: string;
  projectId: string;
  clusterId: string;
  contractorId: string;
  statusId: string;
  year: string;
  dateFrom: string;
  dateTo: string;
}

export interface BillingReportSummary {
  totalBillings: number;
  activeBillings: number;
  completedBillings: number;
  totalContractValue: number;
  totalPlanned: number;
  totalBilled: number;
  totalPaid: number;
  remainingUnbilled: number;
  outstandingPayment: number;
  billingPercentage: number;
  paymentPercentage: number;
}

export interface BillingReportRow {
  billingId: string;
  spkNumber: string;
  spkDate: string | null;
  contractorName: string;
  workName: string;
  workLocation: string | null;
  projectName: string;
  clusterName: string;
  statusName: string;
  currentStageName: string;
  workStartDate: string | null;
  workFinishDate: string | null;
  contractValue: number;
  plannedAmount: number;
  billedAmount: number;
  paidAmount: number;
  remainingUnbilled: number;
  outstandingPayment: number;
  billingPercentage: number;
  paymentPercentage: number;
  documentDriveUrl: string | null;
}

export interface BillingTerminReportRow {
  billingId: string;
  spkNumber: string;
  contractorName: string;
  projectName: string;
  clusterName: string;
  sequenceNo: number;
  terminName: string;
  percentage: number | null;
  plannedAmount: number;
  billedAmount: number;
  paidAmount: number;
  status: BillingTerminStatus;
  billedDate: string | null;
  paidDate: string | null;
  notes: string | null;
}
