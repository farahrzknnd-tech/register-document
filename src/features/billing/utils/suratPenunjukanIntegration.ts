import type { SuratPenunjukan } from '../../../lib/types';
import type { Contractor, SpkBillingInput } from '../types';

function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('id-ID');
}

export function findMatchingContractor(
  contractors: Contractor[],
  contractorName: string,
): Contractor | null {
  const normalized = normalizeName(contractorName);
  if (!normalized) return null;

  return contractors.find((contractor) => normalizeName(contractor.name) === normalized) ?? null;
}

export function buildBillingInputFromSuratPenunjukan(
  suratPenunjukan: SuratPenunjukan,
  contractors: Contractor[],
): SpkBillingInput {
  const matchedContractor = findMatchingContractor(
    contractors,
    suratPenunjukan.nama_kontraktor,
  );

  return {
    surat_penunjukan_id: suratPenunjukan.id,
    project_id: suratPenunjukan.project_id,
    cluster_id: suratPenunjukan.cluster_id,
    contractor_id: matchedContractor?.id ?? null,
    termin_template_id: null,
    billing_status_id: '',
    spk_number: suratPenunjukan.nomor_sp,
    spk_date: suratPenunjukan.tanggal_sp,
    contractor_name_snapshot: suratPenunjukan.nama_kontraktor,
    work_name: suratPenunjukan.jenis_pekerjaan,
    work_location: suratPenunjukan.lokasi ?? '',
    work_start_date: suratPenunjukan.tanggal_start,
    work_finish_date: suratPenunjukan.tanggal_finish,
    kickoff_date: suratPenunjukan.tanggal_kickoff,
    stage_weight: '',
    contract_value: 0,
    document_drive_url: suratPenunjukan.link_risalah ?? '',
    notes: suratPenunjukan.keterangan ?? '',
  };
}
