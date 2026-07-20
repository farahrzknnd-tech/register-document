import { describe, expect, it } from 'vitest';
import type { SuratPenunjukan } from '../../../lib/types';
import type { Contractor } from '../types';
import {
  buildBillingInputFromSuratPenunjukan,
  findMatchingContractor,
} from './suratPenunjukanIntegration';

const suratPenunjukan: SuratPenunjukan = {
  id: 'sp-1',
  project_id: 'project-1',
  cluster_id: 'cluster-1',
  register_no: 'SP-26-0001',
  nomor_sp: '001/SP/VII/2026',
  tanggal_sp: '2026-07-19',
  nama_kontraktor: 'PT Contoh Karya',
  jenis_pekerjaan: 'Pekerjaan Struktur',
  lokasi: 'Cluster A',
  tanggal_start: '2026-07-20',
  tanggal_finish: '2026-08-20',
  durasi: 32,
  tanggal_kickoff: '2026-07-21',
  link_risalah: 'https://drive.google.com/file/d/example/view',
  keterangan: 'Catatan SP',
  created_at: '2026-07-19T00:00:00Z',
};

const contractor: Contractor = {
  id: 'contractor-1',
  code: 'CTR-001',
  name: 'PT CONTOH   KARYA',
  pic_name: null,
  phone: null,
  email: null,
  address: null,
  active: true,
  created_at: '2026-07-19T00:00:00Z',
  updated_at: '2026-07-19T00:00:00Z',
};

describe('Surat Penunjukan billing integration', () => {
  it('matches contractor names case-insensitively and ignores repeated spaces', () => {
    expect(findMatchingContractor([contractor], suratPenunjukan.nama_kontraktor)?.id)
      .toBe('contractor-1');
  });

  it('prefills billing fields without inventing a contract value or termin template', () => {
    expect(buildBillingInputFromSuratPenunjukan(suratPenunjukan, [contractor])).toEqual({
      surat_penunjukan_id: 'sp-1',
      project_id: 'project-1',
      cluster_id: 'cluster-1',
      contractor_id: 'contractor-1',
      termin_template_id: null,
      billing_status_id: '',
      spk_number: '001/SP/VII/2026',
      spk_date: '2026-07-19',
      contractor_name_snapshot: 'PT Contoh Karya',
      work_name: 'Pekerjaan Struktur',
      work_location: 'Cluster A',
      work_start_date: '2026-07-20',
      work_finish_date: '2026-08-20',
      kickoff_date: '2026-07-21',
      stage_weight: '',
      contract_value: 0,
      document_drive_url: 'https://drive.google.com/file/d/example/view',
      notes: 'Catatan SP',
    });
  });
});
