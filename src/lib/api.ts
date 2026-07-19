import { supabase } from './supabase';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QueryBuilder = any;
type DbClient = { from: (table: string) => QueryBuilder; rpc: (fn: string, args?: unknown) => Promise<{ data: unknown; error: unknown }> };
const db = supabase as never as DbClient;
import type { Gambar, Surat, SuratPenunjukan, BeritaAcara, Project, Cluster, JenisGambar, JenisSurat, StatusGambar, JenisBeritaAcara, DocType, DocumentRef } from './types';

// ---- Projects ----
export async function fetchProjects(): Promise<Project[]> {
  const { data, error } = await db.from('projects').select('*').order('name');
  if (error) throw error;
  return data ?? [];
}

export async function createProject(name: string, code: string): Promise<Project> {
  const { data, error } = await db
    .from('projects').insert({ name, code: code || null }).select('*').single();
  if (error) throw error;
  return data;
}

export async function updateProject(id: string, name: string, code: string): Promise<Project> {
  const { data, error } = await db
    .from('projects').update({ name, code: code || null }).eq('id', id).select('*').single();
  if (error) throw error;
  return data;
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await db.from('projects').delete().eq('id', id);
  if (error) throw error;
}

// ---- Clusters ----
export async function fetchClusters(): Promise<Cluster[]> {
  const { data, error } = await db.from('clusters').select('*').order('name');
  if (error) throw error;
  return data ?? [];
}

export async function createCluster(projectId: string, name: string, code: string): Promise<Cluster> {
  const { data, error } = await db
    .from('clusters').insert({ project_id: projectId, name, code: code || null }).select('*').single();
  if (error) throw error;
  return data;
}

export async function updateCluster(id: string, projectId: string, name: string, code: string): Promise<Cluster> {
  const { data, error } = await db
    .from('clusters').update({ project_id: projectId, name, code: code || null }).eq('id', id).select('*').single();
  if (error) throw error;
  return data;
}

export async function deleteCluster(id: string): Promise<void> {
  const { error } = await db.from('clusters').delete().eq('id', id);
  if (error) throw error;
}

// ---- Gambar ----
export interface GambarInput {
  project_id: string;
  cluster_id: string | null;
  judul_gambar: string;
  jenis_gambar: JenisGambar;
  revisi: string;
  status_gambar: StatusGambar;
  tanggal_diterima: string;
  link_drive: string;
  keterangan: string;
}

export async function fetchGambar(): Promise<Gambar[]> {
  const { data, error } = await db
    .from('gambar')
    .select('*, project:projects(*), cluster:clusters(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createGambar(input: GambarInput, refs: DocRefInput[] = []): Promise<Gambar> {
  const { data, error } = await db.rpc('create_gambar', {
    p_project_id: input.project_id, p_cluster_id: input.cluster_id, p_judul_gambar: input.judul_gambar,
    p_jenis_gambar: input.jenis_gambar, p_revisi: input.revisi || null, p_status_gambar: input.status_gambar,
    p_tanggal_diterima: input.tanggal_diterima, p_link_drive: input.link_drive || null, p_keterangan: input.keterangan || null, p_refs: refs,
  });
  if (error) throw error;
  return data as Gambar;
}

export async function updateGambar(id: string, input: GambarInput, refs: DocRefInput[] = []): Promise<Gambar> {
  const { data, error } = await db.rpc('update_gambar', {
    p_id: id, p_project_id: input.project_id, p_cluster_id: input.cluster_id, p_judul_gambar: input.judul_gambar,
    p_jenis_gambar: input.jenis_gambar, p_revisi: input.revisi || null, p_status_gambar: input.status_gambar,
    p_tanggal_diterima: input.tanggal_diterima, p_link_drive: input.link_drive || null, p_keterangan: input.keterangan || null, p_refs: refs,
  });
  if (error) throw error;
  return data as Gambar;
}

export async function updateGambarStatus(id: string, status: StatusGambar): Promise<void> {
  const { error } = await db.from('gambar').update({ status_gambar: status }).eq('id', id);
  if (error) throw error;
}

export async function deleteGambar(id: string): Promise<void> {
  const { error } = await db.from('gambar').delete().eq('id', id);
  if (error) throw error;
}

// ---- Surat ----
export interface SuratInput {
  project_id: string;
  cluster_id: string | null;
  nomor_surat: string;
  perihal: string;
  jenis_surat: JenisSurat;
  kategori_surat: string | null;
  pengirim: string;
  penerima: string;
  tanggal_surat: string;
  link_drive: string;
  keterangan: string;
}

export async function fetchSurat(): Promise<Surat[]> {
  const { data, error } = await db
    .from('surat')
    .select('*, project:projects(*), cluster:clusters(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createSurat(input: SuratInput, refs: DocRefInput[] = []): Promise<Surat> {
  const { data, error } = await db.rpc('create_surat', {
    p_project_id: input.project_id, p_cluster_id: input.cluster_id, p_nomor_surat: input.nomor_surat, p_perihal: input.perihal,
    p_jenis_surat: input.jenis_surat, p_kategori_surat: input.kategori_surat || null, p_pengirim: input.pengirim || null,
    p_penerima: input.penerima || null, p_tanggal_surat: input.tanggal_surat, p_link_drive: input.link_drive || null, p_keterangan: input.keterangan || null, p_refs: refs,
  });
  if (error) throw error;
  return data as Surat;
}

export async function updateSurat(id: string, input: SuratInput, refs: DocRefInput[] = []): Promise<Surat> {
  const { data, error } = await db.rpc('update_surat', {
    p_id: id, p_project_id: input.project_id, p_cluster_id: input.cluster_id, p_nomor_surat: input.nomor_surat, p_perihal: input.perihal,
    p_jenis_surat: input.jenis_surat, p_kategori_surat: input.kategori_surat || null, p_pengirim: input.pengirim || null,
    p_penerima: input.penerima || null, p_tanggal_surat: input.tanggal_surat, p_link_drive: input.link_drive || null, p_keterangan: input.keterangan || null, p_refs: refs,
  });
  if (error) throw error;
  return data as Surat;
}

export async function deleteSurat(id: string): Promise<void> {
  const { error } = await db.from('surat').delete().eq('id', id);
  if (error) throw error;
}

// ---- Surat Penunjukan ----
export interface SuratPenunjukanInput {
  project_id: string;
  cluster_id: string | null;
  nomor_sp: string;
  tanggal_sp: string;
  nama_kontraktor: string;
  jenis_pekerjaan: string;
  lokasi: string;
  tanggal_start: string | null;
  tanggal_finish: string | null;
  tanggal_kickoff: string | null;
  link_risalah: string;
  keterangan: string;
}

export async function fetchSuratPenunjukan(): Promise<SuratPenunjukan[]> {
  const { data, error } = await db
    .from('surat_penunjukan')
    .select('*, project:projects(*), cluster:clusters(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createSuratPenunjukan(input: SuratPenunjukanInput, refs: DocRefInput[] = []): Promise<SuratPenunjukan> {
  const { data, error } = await db.rpc('create_surat_penunjukan', {
    p_project_id: input.project_id, p_cluster_id: input.cluster_id, p_nomor_sp: input.nomor_sp, p_tanggal_sp: input.tanggal_sp,
    p_nama_kontraktor: input.nama_kontraktor, p_jenis_pekerjaan: input.jenis_pekerjaan, p_lokasi: input.lokasi || null,
    p_tanggal_start: input.tanggal_start, p_tanggal_finish: input.tanggal_finish, p_tanggal_kickoff: input.tanggal_kickoff,
    p_link_risalah: input.link_risalah || null, p_keterangan: input.keterangan || null, p_refs: refs,
  });
  if (error) throw error;
  return data as SuratPenunjukan;
}

export async function updateSuratPenunjukan(id: string, input: SuratPenunjukanInput, refs: DocRefInput[] = []): Promise<SuratPenunjukan> {
  const { data, error } = await db.rpc('update_surat_penunjukan', {
    p_id: id, p_project_id: input.project_id, p_cluster_id: input.cluster_id, p_nomor_sp: input.nomor_sp, p_tanggal_sp: input.tanggal_sp,
    p_nama_kontraktor: input.nama_kontraktor, p_jenis_pekerjaan: input.jenis_pekerjaan, p_lokasi: input.lokasi || null,
    p_tanggal_start: input.tanggal_start, p_tanggal_finish: input.tanggal_finish, p_tanggal_kickoff: input.tanggal_kickoff,
    p_link_risalah: input.link_risalah || null, p_keterangan: input.keterangan || null, p_refs: refs,
  });
  if (error) throw error;
  return data as SuratPenunjukan;
}

export async function deleteSuratPenunjukan(id: string): Promise<void> {
  const { error } = await db.from('surat_penunjukan').delete().eq('id', id);
  if (error) throw error;
}

// ---- Document References (generic, many-to-many) ----

export interface DocRefInput {
  ref_type: DocType;
  ref_id: string;
}

export async function fetchBeritaAcara(): Promise<BeritaAcara[]> {
  const { data, error } = await db
    .from('berita_acara')
    .select('*, project:projects(*), cluster:clusters(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export interface BeritaAcaraInput {
  project_id: string;
  cluster_id: string | null;
  jenis_berita_acara: JenisBeritaAcara;
  tanggal: string;
  perihal: string;
  link_drive: string;
  keterangan: string;
}

export async function createBeritaAcara(input: BeritaAcaraInput, refs: DocRefInput[] = []): Promise<BeritaAcara> {
  const { data, error } = await db.rpc('create_berita_acara', {
    p_project_id: input.project_id, p_cluster_id: input.cluster_id, p_jenis_berita_acara: input.jenis_berita_acara,
    p_tanggal: input.tanggal, p_perihal: input.perihal, p_link_drive: input.link_drive || null, p_keterangan: input.keterangan || null, p_refs: refs,
  });
  if (error) throw error;
  return data as BeritaAcara;
}

export async function updateBeritaAcara(id: string, input: BeritaAcaraInput, refs: DocRefInput[] = []): Promise<BeritaAcara> {
  const { data, error } = await db.rpc('update_berita_acara', {
    p_id: id, p_project_id: input.project_id, p_cluster_id: input.cluster_id, p_jenis_berita_acara: input.jenis_berita_acara,
    p_tanggal: input.tanggal, p_perihal: input.perihal, p_link_drive: input.link_drive || null, p_keterangan: input.keterangan || null, p_refs: refs,
  });
  if (error) throw error;
  return data as BeritaAcara;
}

export async function deleteBeritaAcara(id: string): Promise<void> {
  const { error } = await db.from('berita_acara').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchDocRefs(sourceType: DocType, sourceId: string): Promise<DocumentRef[]> {
  const { data, error } = await db
    .from('document_ref')
    .select('*')
    .eq('source_type', sourceType)
    .eq('source_id', sourceId);
  if (error) throw error;
  return data ?? [];
}

export async function fetchDocReferrers(refType: DocType, refId: string): Promise<DocumentRef[]> {
  const { data, error } = await db
    .from('document_ref')
    .select('*')
    .eq('ref_type', refType)
    .eq('ref_id', refId);
  if (error) throw error;
  return data ?? [];
}

export async function setDocRefs(sourceType: DocType, sourceId: string, refs: DocRefInput[]): Promise<void> {
  const { error } = await db.rpc('set_document_refs', { p_source_type: sourceType, p_source_id: sourceId, p_refs: refs });
  if (error) throw error;
}
