export function mapAppError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/JWT|auth|Authentication required/i.test(message)) return 'Login diperlukan.';
  if (/inactive|Account inactive/i.test(message)) return 'Akun tidak aktif.';
  if (/Admin permission|required|permission denied|42501/i.test(message)) return 'Akses admin diperlukan.';
  if (/system managed/i.test(message)) return 'Field sistem tidak boleh diubah manual.';
  if (/Register number is immutable/i.test(message)) return 'Nomor register tidak boleh diubah.';
  if (/Document date year must match/i.test(message)) return 'Tahun tanggal harus sama dengan tahun nomor register.';
  if (/Document subtype cannot change/i.test(message)) return 'Subtipe dokumen tidak boleh berubah dari nomor register.';
  if (/Project not found/i.test(message)) return 'Proyek tidak ditemukan.';
  if (/Cluster does not belong/i.test(message)) return 'Cluster tidak sesuai proyek.';
  if (/Unsupported document|Unsupported register/i.test(message)) return 'Jenis dokumen tidak didukung.';
  if (/Referenced document not found|P0002/i.test(message)) return 'Dokumen referensi tidak ditemukan.';
  if (/Cross-project/i.test(message)) return 'Referensi beda proyek ditolak.';
  if (/duplicate key|document_ref_source_id_ref_type_ref_id|23505/i.test(message)) return 'Referensi dokumen duplikat.';
  if (/foreign key|restrict|23503/i.test(message)) return 'Hapus ditolak karena data masih dipakai.';
  return message || 'Terjadi kesalahan.';
}
