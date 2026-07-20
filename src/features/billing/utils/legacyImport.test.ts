import { describe, expect, it } from 'vitest';
import { parseLegacyBillingBackup, summarizeLegacyBackup } from './legacyImport';

const validBackup = JSON.stringify({
  exportDate: '2026-07-20T00:00:00.000Z',
  spkRecords: [
    {
      id: 'legacy-1',
      nomorSpk: 'SPK-001',
      projectCluster: 'CLUSTER CHELIA',
      namaKontraktor: 'PT Contoh',
      namaPekerjaan: 'Pekerjaan Contoh',
      lokasiPekerjaan: 'Jakarta',
      nilaiSpk: 1000000,
      nilaiDitagihkan: 250000,
      bobotTahapan: '10%',
      status: 'In Progress',
      linkGdrive: '',
      selectedStages: ['diterimaAdmin'],
      stages: {
        diterimaAdmin: { status: 'Selesai', date: '2026-07-20', time: '10:00', note: 'Diterima' },
      },
      terminTemplateId: null,
      termins: [
        { name: 'Termin 1', percentage: 25, nilaiTermin: 250000, nilaiDitagihkan: 250000, status: 'Selesai Ditagihkan' },
      ],
      createdAt: '2026-07-20T00:00:00.000Z',
      updatedAt: '2026-07-20T00:00:00.000Z',
    },
  ],
  masterProjects: [],
  masterContractors: [{ name: 'PT Contoh', pic: 'Budi', phone: '0812' }],
  masterStatuses: [{ name: 'In Progress' }],
  masterStages: [],
  masterTerminTemplates: [],
});

describe('legacy billing import parser', () => {
  it('parses the legacy backup format without trusting unknown values', () => {
    const backup = parseLegacyBillingBackup(validBackup);
    expect(backup.spkRecords).toHaveLength(1);
    expect(backup.spkRecords[0].nomorSpk).toBe('SPK-001');
    expect(backup.spkRecords[0].termins[0].nilaiDitagihkan).toBe(250000);
    expect(summarizeLegacyBackup(backup)).toMatchObject({
      records: 1,
      validRecords: 1,
      invalidRecords: 0,
      contractors: 1,
    });
  });

  it('rejects invalid JSON and missing spkRecords', () => {
    expect(() => parseLegacyBillingBackup('{invalid')).toThrow(/JSON/i);
    expect(() => parseLegacyBillingBackup(JSON.stringify({ exportDate: 'x' }))).toThrow(/spkRecords/i);
  });

  it('marks incomplete records as invalid without dropping them from preview', () => {
    const backup = parseLegacyBillingBackup(JSON.stringify({
      spkRecords: [{ nomorSpk: '', namaKontraktor: '', namaPekerjaan: '' }],
    }));
    expect(summarizeLegacyBackup(backup)).toMatchObject({
      records: 1,
      validRecords: 0,
      invalidRecords: 1,
    });
  });
});
