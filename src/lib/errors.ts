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
  if (/Unsupported application role/i.test(message)) return 'Role pengguna tidak didukung.';
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
  if (/PGRST202.*(import_legacy_billing_backup|list_billing_import_runs)|Could not find the function public\.(import_legacy_billing_backup|list_billing_import_runs)/i.test(message)) {
    return 'Fungsi import data legacy belum tersedia. Terapkan migration Patch 8 ke Supabase yang digunakan, lalu muat ulang aplikasi.';
  }
  if (/Legacy billing payload must be a JSON object/i.test(message)) return 'Format file import harus berupa object JSON.';
  if (/Legacy billing payload spkRecords must be an array/i.test(message)) return 'Format file import tidak valid: spkRecords wajib berupa array.';
  if (/supports at most 5000 records/i.test(message)) return 'Satu file import hanya boleh berisi maksimal 5.000 SPK.';
  if (/Legacy import preview returned no result/i.test(message)) return 'Validasi import tidak menghasilkan ringkasan.';
  if (/Legacy import returned no result/i.test(message)) return 'Import tidak menghasilkan ringkasan.';
  if (/PGRST202.*(update_billing_stage_progress|sync_billing_stage_progress|save_billing_termin|delete_billing_termin)|Could not find the function public\.(update_billing_stage_progress|sync_billing_stage_progress|save_billing_termin|delete_billing_termin)/i.test(message)) {
    return 'Fungsi Approval dan Termin belum tersedia pada Supabase yang sedang digunakan. Terapkan migration Patch 5, lalu muat ulang aplikasi.';
  }
  if (/PGRST202|Could not find the function public\.create_spk_billing|Could not find the function public\.update_spk_billing/i.test(message)) {
    return 'Fungsi Monitoring Tagihan belum tersedia pada Supabase yang sedang digunakan. Terapkan migration Patch 3 ke Supabase Cloud, lalu muat ulang aplikasi.';
  }
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
  if (/Billing stage progress not found/i.test(message)) return 'Tahapan approval tidak ditemukan.';
  if (/Unsupported billing stage status/i.test(message)) return 'Status tahapan approval tidak didukung.';
  if (/Billing termin not found/i.test(message)) return 'Termin pembayaran tidak ditemukan.';
  if (/Billing termin sequence must be greater than zero/i.test(message)) return 'Urutan termin harus lebih dari nol.';
  if (/Billing termin name is required/i.test(message)) return 'Nama termin wajib diisi.';
  if (/Billing termin percentage must be between zero and 100/i.test(message)) return 'Persentase termin harus berada di antara 0 dan 100.';
  if (/Billing termin amounts cannot be negative/i.test(message)) return 'Nilai termin tidak boleh negatif.';
  if (/Billing termin planned amount exceeds contract value/i.test(message)) return 'Nilai rencana termin melebihi nilai kontrak.';
  if (/Billing termin billed amount exceeds planned amount/i.test(message)) return 'Nilai ditagihkan melebihi nilai rencana termin.';
  if (/Billing termin paid amount exceeds billed amount/i.test(message)) return 'Nilai dibayar melebihi nilai ditagihkan.';
  if (/Billing termin billed date is required/i.test(message)) return 'Tanggal tagihan wajib diisi.';
  if (/Billing termin paid date is required/i.test(message)) return 'Tanggal pembayaran wajib diisi.';
  if (/Billing termin paid date cannot be earlier/i.test(message)) return 'Tanggal pembayaran tidak boleh lebih awal dari tanggal tagihan.';
  if (/Unsupported billing termin status/i.test(message)) return 'Status termin tidak didukung.';
  if (/Not billed termin cannot contain/i.test(message)) return 'Termin Belum Ditagihkan harus memiliki nilai tagihan dan pembayaran nol.';
  if (/In process termin cannot contain/i.test(message)) return 'Termin Sedang Diproses harus memiliki nilai tagihan dan pembayaran nol.';
  if (/Billed termin requires/i.test(message)) return 'Status Ditagihkan membutuhkan nilai tagihan dan nilai pembayaran nol.';
  if (/Partially paid termin requires/i.test(message)) return 'Status Dibayar Sebagian membutuhkan pembayaran di bawah nilai tagihan.';
  if (/Paid termin requires/i.test(message)) return 'Status Lunas membutuhkan nilai dibayar sama dengan nilai tagihan.';
  if (/Billing termin with financial realization cannot be deleted/i.test(message)) return 'Termin yang sudah memiliki nilai tagihan atau pembayaran tidak dapat dihapus.';
  if (/spk_billings_surat_penunjukan_unique|Surat Penunjukan.*already.*billing/i.test(message)) {
    return 'Surat Penunjukan ini sudah memiliki Monitoring Tagihan.';
  }
  if (/spk_billings_spk_number_lower_key/i.test(message)) return 'Nomor SPK sudah digunakan pada Monitoring Tagihan lain.';
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
