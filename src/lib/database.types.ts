export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
export type AppRole = 'admin' | 'viewer';
export type DocType = 'gambar' | 'surat' | 'surat_penunjukan' | 'berita_acara';

type RowBase = { id: string; created_at: string; updated_at: string };
type ProjectOwned = { project_id: string; cluster_id: string | null };

export interface Database {
  public: {
    Tables: {
      app_users: { Row: { user_id: string; email: string | null; role: AppRole; active: boolean; created_at: string; updated_at: string }; Insert: { user_id: string; email?: string | null; role?: AppRole; active?: boolean }; Update: { email?: string | null } };
      projects: { Row: RowBase & { name: string; code: string | null }; Insert: { name: string; code?: string | null }; Update: { name?: string; code?: string | null } };
      clusters: { Row: RowBase & { project_id: string; name: string; code: string | null }; Insert: { project_id: string; name: string; code?: string | null }; Update: { project_id?: string; name?: string; code?: string | null } };
      register_seq: { Row: { document_type: string; document_subtype: string; year: number; last_seq: number; created_at: string; updated_at: string }; Insert: never; Update: never };
      gambar: { Row: RowBase & ProjectOwned & { register_no: string; judul_gambar: string; jenis_gambar: string; revisi: string | null; status_gambar: string; status_tindak_lanjut: string; tanggal_diterima: string; link_drive: string | null; keterangan: string | null }; Insert: never; Update: Partial<RowBase & ProjectOwned & { judul_gambar: string; jenis_gambar: string; revisi: string | null; status_gambar: string; tanggal_diterima: string; link_drive: string | null; keterangan: string | null }> };
      surat: { Row: RowBase & ProjectOwned & { register_no: string; nomor_surat: string; perihal: string; jenis_surat: string; kategori_surat: string | null; pengirim: string | null; penerima: string | null; tanggal_surat: string; link_drive: string | null; keterangan: string | null }; Insert: never; Update: Partial<RowBase & ProjectOwned & { nomor_surat: string; perihal: string; jenis_surat: string; kategori_surat: string | null; pengirim: string | null; penerima: string | null; tanggal_surat: string; link_drive: string | null; keterangan: string | null }> };
      surat_penunjukan: { Row: RowBase & ProjectOwned & { register_no: string; nomor_sp: string; tanggal_sp: string; nama_kontraktor: string; jenis_pekerjaan: string; lokasi: string | null; tanggal_start: string | null; tanggal_finish: string | null; durasi: number | null; tanggal_kickoff: string | null; link_risalah: string | null; keterangan: string | null }; Insert: never; Update: Partial<RowBase & ProjectOwned & { nomor_sp: string; tanggal_sp: string; nama_kontraktor: string; jenis_pekerjaan: string; lokasi: string | null; tanggal_start: string | null; tanggal_finish: string | null; tanggal_kickoff: string | null; link_risalah: string | null; keterangan: string | null }> };
      berita_acara: { Row: RowBase & ProjectOwned & { register_no: string; jenis_berita_acara: string; tanggal: string; perihal: string; link_drive: string | null; keterangan: string | null }; Insert: never; Update: Partial<RowBase & ProjectOwned & { jenis_berita_acara: string; tanggal: string; perihal: string; link_drive: string | null; keterangan: string | null }> };
      document_ref: { Row: { id: string; source_type: DocType; source_id: string; ref_type: DocType; ref_id: string; created_at: string; updated_at: string }; Insert: never; Update: never };
    };
    Functions: {
      create_gambar: { Args: Record<string, unknown>; Returns: Database['public']['Tables']['gambar']['Row'] };
      create_surat: { Args: Record<string, unknown>; Returns: Database['public']['Tables']['surat']['Row'] };
      create_surat_penunjukan: { Args: Record<string, unknown>; Returns: Database['public']['Tables']['surat_penunjukan']['Row'] };
      create_berita_acara: { Args: Record<string, unknown>; Returns: Database['public']['Tables']['berita_acara']['Row'] };
      set_document_refs: { Args: { p_source_type: string; p_source_id: string; p_refs: Json }; Returns: void };
    };
    Enums: Record<string, never>;
  };
}
