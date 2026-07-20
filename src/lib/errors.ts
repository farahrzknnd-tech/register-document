function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    const candidate = error as Record<string, unknown>;
    const parts = [candidate.message, candidate.details, candidate.hint, candidate.code]
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
    if (parts.length > 0) return parts.join(' — ');
  }
  return 'Terjadi kesalahan.';
}

export function mapAppError(error: unknown): string {
  const message = extractErrorMessage(error);
  if (/JWT|auth|Authentication required/i.test(message)) return 'Login diperlukan.';
  if (/inactive|Account inactive/i.test(message)) return 'Akun tidak aktif.';
  if (/Admin permission|required|permission denied|42501/i.test(message)) return 'Akses admin diperlukan.';
  if (/system managed/i.test(message)) return 'Field sistem tidak boleh diubah manual.';
  if (/Register number is immutable/i.test(message)) return 'Nomor register tidak boleh diubah.';
  if (/Document date year must match/i.test(message)) return 'Tahun tanggal harus sama dengan tahun nomor register.';
  if (/Document subtype cannot change/i.test(message)) return 'Subtipe dokumen tidak boleh berubah dari nomor register.';
  if (/Project not found/i.test(message)) return 'Proyek tidak ditemukan.';
  if (/Cluster not found/i.test(message)) return 'Cluster tidak ditemukan.';
  if (/Unsupported document|Unsupported register/i.test(message)) return 'Jenis dokumen tidak didukung.';
  if (/Referenced document not found|P0002/i.test(message)) return 'Dokumen referensi tidak ditemukan.';
  if (/Cross-project/i.test(message)) return 'Referensi beda proyek ditolak.';
  if (/SPK billing not found/i.test(message)) return 'Monitoring tagihan tidak ditemukan.';
  if (/SPK number is required/i.test(message)) return 'Nomor SPK wajib diisi.';
  if (/Work name is required/i.test(message)) return 'Nama pekerjaan wajib diisi.';
  if (/Contractor name is required/i.test(message)) return 'Nama kontraktor wajib diisi.';
  if (/Contract value must be zero or greater/i.test(message)) return 'Nilai kontrak tidak boleh negatif.';
  if (/Contract value is locked after termin initialization/i.test(message)) return 'Nilai kontrak tidak dapat diubah setelah termin dibuat.';
  if (/Work finish date cannot be earlier/i.test(message)) return 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai.';
  if (/Billing status not found or inactive/i.test(message)) return 'Status billing tidak ditemukan atau sudah nonaktif.';
  if (/Billing status not found/i.test(message)) return 'Status billing tidak ditemukan.';
  if (/Contractor not found/i.test(message)) return 'Kontraktor tidak ditemukan.';
  if (/Surat Penunjukan not found/i.test(message)) return 'Surat Penunjukan tidak ditemukan.';
  if (/Billing termin template not found/i.test(message)) return 'Template termin tidak ditemukan.';
  if (/requires at least one active item/i.test(message)) return 'Template termin harus memiliki minimal satu item aktif.';
  if (/contains invalid items/i.test(message)) return 'Item template termin belum valid.';
  if (/item sequence must be unique/i.test(message)) return 'Urutan item termin tidak boleh duplikat.';
  if (/item name must be unique/i.test(message)) return 'Nama item termin tidak boleh duplikat.';
  if (/percentage total cannot exceed 100/i.test(message)) return 'Total persentase item termin aktif tidak boleh melebihi 100%.';
  if (/duplicate key|23505/i.test(message)) return 'Kode atau nama duplikat dan sudah digunakan oleh data lain.';
  if (/foreign key|restrict|23503/i.test(message)) return 'Hapus ditolak karena data masih dipakai.';
  if (/Failed to fetch|NetworkError|fetch failed/i.test(message)) return 'Tidak dapat terhubung ke server.';
  return message || 'Terjadi kesalahan.';
}
