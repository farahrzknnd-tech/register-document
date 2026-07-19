import { supabase } from './supabase';
import type { Gambar, Surat, SuratPenunjukan, BeritaAcara, Project, Cluster, JenisGambar, JenisSurat, StatusGambar, JenisBeritaAcara, DocType, DocumentRef } from './types';
import { calcDurasi } from './utils';

// ---- Projects ----
export async function fetchProjects(): Promise<Project[]> {
  const { data, error } = await supabase.from('projects').select('*').order('name');
  if (error) throw error;
  return data ?? [];
}

export async function createProject(name: string, code: string): Promise<Project> {
  const { data, error } = await supabase
    .from('projects').insert({ name, code: code || null }).select('*').single();
  if (error) throw error;
  return data;
}

export async function updateProject(id: string, name: string, code: string): Promise<Project> {
  const { data, error } = await supabase
    .from('projects').update({ name, code: code || null }).eq('id', id).select('*').single();
  if (error) throw error;
  return data;
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) throw error;
}

// ---- Clusters ----
export async function fetchClusters(): Promise<Cluster[]> {
  const { data, error } = await supabase.from('clusters').select('*').order('name');
  if (error) throw error;
  return data ?? [];
}

export async function createCluster(name: string, code: string): Promise<Cluster> {
  const { data, error } = await supabase
    .from('clusters').insert({ name, code: code || null }).select('*').single();
  if (error) throw error;
  return data;
}

export async function updateCluster(id: string, name: string, code: string): Promise<Cluster> {
  const { data, error } = await supabase
    .from('clusters').update({ name, code: code || null }).eq('id', id).select('*').single();
  if (error) throw error;
  return data;
}

export async function deleteCluster(id: string): Promise<void> {
  const { error } = await supabase.from('clusters').delete().eq('id', id);
  if (error) throw error;
}

// ---- Gambar ----
export interface GambarInput {
  judul_gambar: string;
  cluster_id: string | null;
  jenis_gambar: JenisGambar;
  revisi: string;
  status_gambar: StatusGambar;
  tanggal_diterima: string;
  link_drive: string;
  keterangan: string;
}

export async function fetchGambar(): Promise<Gambar[]> {
  const { data, error } = await supabase
    .from('gambar')
    .select('*, cluster:clusters(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createGambar(input: GambarInput): Promise<Gambar> {
  const year = new Date(input.tanggal_diterima).getFullYear();
  const { data: regNo, error: rpcError } = await supabase
    .rpc('next_gambar_register_no', { p_jenis: input.jenis_gambar, p_tahun: year });
  if (rpcError) throw rpcError;

  const { data, error } = await supabase
    .from('gambar').insert({ ...input, register_no: regNo })
    .select('*, cluster:clusters(*)').single();
  if (error) throw error;
  return data;
}

export async function updateGambar(id: string, input: GambarInput): Promise<Gambar> {
  const { data, error } = await supabase
    .from('gambar').update(input).eq('id', id)
    .select('*, cluster:clusters(*)').single();
  if (error) throw error;
  return data;
}

export async function updateGambarStatus(id: string, status: StatusGambar): Promise<void> {
  const { error } = await supabase.from('gambar').update({ status_gambar: status }).eq('id', id);
  if (error) throw error;
}

export async function deleteGambar(id: string): Promise<void> {
  const { error } = await supabase.from('gambar').delete().eq('id', id);
  if (error) throw error;
}

// ---- Surat ----
export interface SuratInput {
  nomor_surat: string;
  perihal: string;
  cluster_id: string | null;
  jenis_surat: JenisSurat;
  kategori_surat: string | null;
  pengirim: string;
  penerima: string;
  tanggal_surat: string;
  link_drive: string;
  keterangan: string;
}

export async function fetchSurat(): Promise<Surat[]> {
  const { data, error } = await supabase
    .from('surat')
    .select('*, cluster:clusters(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createSurat(input: SuratInput): Promise<Surat> {
  const year = new Date(input.tanggal_surat).getFullYear();
  const { data: regNo, error: rpcError } = await supabase
    .rpc('next_surat_register_no', { p_jenis: input.jenis_surat, p_tahun: year });
  if (rpcError) throw rpcError;

  const { data, error } = await supabase
    .from('surat').insert({ ...input, register_no: regNo })
    .select('*, cluster:clusters(*)').single();
  if (error) throw error;
  return data;
}

export async function updateSurat(id: string, input: SuratInput): Promise<Surat> {
  const { data, error } = await supabase
    .from('surat').update(input).eq('id', id)
    .select('*, cluster:clusters(*)').single();
  if (error) throw error;
  return data;
}

export async function deleteSurat(id: string): Promise<void> {
  const { error } = await supabase.from('surat').delete().eq('id', id);
  if (error) throw error;
}

// ---- Surat Penunjukan ----
export interface SuratPenunjukanInput {
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
  const { data, error } = await supabase
    .from('surat_penunjukan')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createSuratPenunjukan(input: SuratPenunjukanInput): Promise<SuratPenunjukan> {
  const year = new Date(input.tanggal_sp).getFullYear();
  const { data: regNo, error: rpcError } = await supabase
    .rpc('next_surat_penunjukan_register_no', { p_tahun: year });
  if (rpcError) throw rpcError;

  const durasi = calcDurasi(input.tanggal_start, input.tanggal_finish);
  const { data, error } = await supabase
    .from('surat_penunjukan').insert({ ...input, register_no: regNo, durasi })
    .select('*').single();
  if (error) throw error;
  return data;
}

export async function updateSuratPenunjukan(id: string, input: SuratPenunjukanInput): Promise<SuratPenunjukan> {
  const durasi = calcDurasi(input.tanggal_start, input.tanggal_finish);
  const { data, error } = await supabase
    .from('surat_penunjukan').update({ ...input, durasi }).eq('id', id)
    .select('*').single();
  if (error) throw error;
  return data;
}

export async function deleteSuratPenunjukan(id: string): Promise<void> {
  const { error } = await supabase.from('surat_penunjukan').delete().eq('id', id);
  if (error) throw error;
}

// ---- Document References (generic, many-to-many) ----

export interface DocRefInput {
  ref_type: DocType;
  ref_id: string;
}

export async function fetchBeritaAcara(): Promise<BeritaAcara[]> {
  const { data, error } = await supabase
    .from('berita_acara')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export interface BeritaAcaraInput {
  jenis_berita_acara: JenisBeritaAcara;
  tanggal: string;
  perihal: string;
  link_drive: string;
  keterangan: string;
}

export async function createBeritaAcara(input: BeritaAcaraInput): Promise<BeritaAcara> {
  const year = new Date(input.tanggal).getFullYear();
  const { data: regNo, error: rpcError } = await supabase
    .rpc('next_berita_acara_register_no', { p_jenis: input.jenis_berita_acara, p_tahun: year });
  if (rpcError) throw rpcError;

  const { data, error } = await supabase
    .from('berita_acara').insert({ ...input, register_no: regNo })
    .select('*').single();
  if (error) throw error;
  return data;
}

export async function updateBeritaAcara(id: string, input: BeritaAcaraInput): Promise<BeritaAcara> {
  const { data, error } = await supabase
    .from('berita_acara').update(input).eq('id', id)
    .select('*').single();
  if (error) throw error;
  return data;
}

export async function deleteBeritaAcara(id: string): Promise<void> {
  const { error } = await supabase.from('berita_acara').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchDocRefs(sourceType: DocType, sourceId: string): Promise<DocumentRef[]> {
  const { data, error } = await supabase
    .from('document_ref')
    .select('*')
    .eq('source_type', sourceType)
    .eq('source_id', sourceId);
  if (error) throw error;
  return data ?? [];
}

export async function fetchDocReferrers(refType: DocType, refId: string): Promise<DocumentRef[]> {
  const { data, error } = await supabase
    .from('document_ref')
    .select('*')
    .eq('ref_type', refType)
    .eq('ref_id', refId);
  if (error) throw error;
  return data ?? [];
}

export async function setDocRefs(
  sourceType: DocType,
  sourceId: string,
  refs: DocRefInput[]
): Promise<void> {
  const { error: delError } = await supabase
    .from('document_ref')
    .delete()
    .eq('source_type', sourceType)
    .eq('source_id', sourceId);
  if (delError) throw delError;

  if (refs.length > 0) {
    const rows = refs.map((r) => ({
      source_type: sourceType,
      source_id: sourceId,
      ref_type: r.ref_type,
      ref_id: r.ref_id,
    }));
    const { error: insError } = await supabase.from('document_ref').insert(rows);
    if (insError) throw insError;
  }
}
