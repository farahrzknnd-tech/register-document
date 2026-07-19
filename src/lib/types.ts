export interface Project {
  id: string;
  name: string;
  code: string | null;
  created_at: string;
  updated_at?: string;
}

export interface Cluster {
  id: string;
  project_id: string;
  name: string;
  code: string | null;
  created_at: string;
  updated_at?: string;
  project?: Project | null;
}

export type JenisGambar =
  | 'Gambar Pelaksanaan'
  | 'Gambar Revisi Pelaksanaan'
  | 'Gambar Tender'
  | 'Gambar Revisi Tender'
  | 'Gambar Informasi'
  | 'As Built Drawing';

export type StatusGambar = 'Aktif (Latest)' | 'Digantikan (Obsolete)';
export type StatusTindakLanjut = 'Belum Ada Tindak Lanjut' | 'Sudah Dibuat Surat';

export interface Gambar {
  id: string;
  project_id: string;
  register_no: string | null;
  judul_gambar: string;
  cluster_id: string | null;
  jenis_gambar: JenisGambar;
  revisi: string | null;
  status_gambar: StatusGambar;
  status_tindak_lanjut: StatusTindakLanjut;
  tanggal_diterima: string;
  link_drive: string | null;
  keterangan: string | null;
  created_at: string;
  cluster?: Cluster | null;
  project?: Project | null;
}

export type JenisSurat = 'Surat Masuk' | 'Surat Keluar';

export type KategoriSurat = 'Surat Keluar' | 'IPP' | 'IPL' | 'Internal Memo';

export interface Surat {
  id: string;
  project_id: string;
  register_no: string | null;
  nomor_surat: string;
  perihal: string;
  cluster_id: string | null;
  jenis_surat: JenisSurat;
  kategori_surat: string | null;
  pengirim: string | null;
  penerima: string | null;
  tanggal_surat: string;
  link_drive: string | null;
  keterangan: string | null;
  created_at: string;
  cluster?: Cluster | null;
  project?: Project | null;
}

// ---- Document Reference System ----
export type DocType = 'gambar' | 'surat' | 'surat_penunjukan' | 'berita_acara';

export interface DocumentRef {
  id: string;
  source_type: DocType;
  source_id: string;
  ref_type: DocType;
  ref_id: string;
  created_at: string;
}

export interface DocumentSummary {
  id: string;
  type: DocType;
  register_no: string | null;
  title: string;
  subtitle: string;
  date: string;
}

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  gambar: 'Gambar',
  surat: 'Surat',
  surat_penunjukan: 'Surat Penunjukan',
  berita_acara: 'Berita Acara',
};

export type JenisBeritaAcara = 'Berita Acara Aanwijzing' | 'Berita Acara Klarifikasi';

export interface BeritaAcara {
  id: string;
  project_id: string;
  cluster_id: string | null;
  register_no: string | null;
  jenis_berita_acara: JenisBeritaAcara;
  tanggal: string;
  perihal: string;
  link_drive: string | null;
  keterangan: string | null;
  created_at: string;
  cluster?: Cluster | null;
  project?: Project | null;
}

export const JENIS_BERITA_ACARA_LIST: JenisBeritaAcara[] = [
  'Berita Acara Aanwijzing',
  'Berita Acara Klarifikasi',
];

export const BERITA_ACARA_PREFIXES: Record<JenisBeritaAcara, string> = {
  'Berita Acara Aanwijzing': 'AWZ',
  'Berita Acara Klarifikasi': 'KLR',
};

export interface SuratPenunjukan {
  id: string;
  project_id: string;
  cluster_id: string | null;
  register_no: string | null;
  nomor_sp: string;
  tanggal_sp: string;
  nama_kontraktor: string;
  jenis_pekerjaan: string;
  lokasi: string | null;
  tanggal_start: string | null;
  tanggal_finish: string | null;
  durasi: number | null;
  tanggal_kickoff: string | null;
  link_risalah: string | null;
  keterangan: string | null;
  created_at: string;
  cluster?: Cluster | null;
  project?: Project | null;
}

export const JENIS_GAMBAR_LIST: JenisGambar[] = [
  'Gambar Pelaksanaan',
  'Gambar Revisi Pelaksanaan',
  'Gambar Tender',
  'Gambar Revisi Tender',
  'Gambar Informasi',
  'As Built Drawing',
];

export const JENIS_SURAT_LIST: JenisSurat[] = ['Surat Masuk', 'Surat Keluar'];

export const KATEGORI_SURAT_LIST: KategoriSurat[] = [
  'Surat Keluar',
  'IPP',
  'IPL',
  'Internal Memo',
];

export const STATUS_GAMBAR_LIST: StatusGambar[] = [
  'Aktif (Latest)',
  'Digantikan (Obsolete)',
];

export const STATUS_TINDAK_LANJUT_LIST: StatusTindakLanjut[] = [
  'Belum Ada Tindak Lanjut',
  'Sudah Dibuat Surat',
];

export const GAMBAR_PREFIXES: Record<JenisGambar, string> = {
  'Gambar Pelaksanaan': 'GP',
  'Gambar Revisi Pelaksanaan': 'GRP',
  'Gambar Tender': 'GT',
  'Gambar Revisi Tender': 'GRT',
  'Gambar Informasi': 'GI',
  'As Built Drawing': 'ABD',
};

export const SURAT_PREFIXES: Record<JenisSurat, string> = {
  'Surat Masuk': 'SM',
  'Surat Keluar': 'SK',
};

export type UserRole = 'admin' | 'viewer';

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  viewer: 'Viewer (Read Only)',
};
