# Integrasi Surat Penunjukan dan Monitoring Tagihan

Patch 4 menghubungkan modul Register Surat Penunjukan dengan Monitoring Tagihan tanpa
mengubah kepemilikan data masing-masing modul.

## Aturan Relasi

- Satu Surat Penunjukan dapat memiliki maksimal satu Monitoring Tagihan.
- Monitoring Tagihan boleh tetap dibuat manual tanpa Surat Penunjukan.
- Pencegahan duplikat ditegakkan oleh unique index
  `spk_billings_surat_penunjukan_unique` pada database.
- Admin dapat membuat monitoring dari detail Surat Penunjukan.
- Admin dan viewer dapat membuka monitoring yang sudah terhubung.
- Detail Monitoring Tagihan dapat membuka kembali Surat Penunjukan sumbernya.

## Pemetaan Data Awal

Saat admin memilih **Buat Monitoring Tagihan**, form billing diisi otomatis sebagai
berikut:

| Surat Penunjukan | Monitoring Tagihan |
|---|---|
| `id` | `surat_penunjukan_id` |
| `project_id` | `project_id` |
| `cluster_id` | `cluster_id` |
| `nomor_sp` | `spk_number` |
| `tanggal_sp` | `spk_date` |
| `nama_kontraktor` | `contractor_name_snapshot` |
| `jenis_pekerjaan` | `work_name` |
| `lokasi` | `work_location` |
| `tanggal_start` | `work_start_date` |
| `tanggal_finish` | `work_finish_date` |
| `tanggal_kickoff` | `kickoff_date` |
| `link_risalah` | `document_drive_url` |
| `keterangan` | `notes` |

Nilai kontrak dan template termin tidak diperkirakan otomatis. Admin wajib memeriksa
data hasil prefill dan mengisi Nilai Kontrak sebelum menyimpan.

Bila nama kontraktor pada Surat Penunjukan cocok dengan Master Kontraktor setelah
normalisasi huruf besar/kecil dan spasi, `contractor_id` dipilih otomatis. Nama pada SP
tetap disimpan sebagai snapshot historis.

## Alur Penggunaan

1. Buka **Register Surat Penunjukan**.
2. Buka detail salah satu Surat Penunjukan.
3. Pilih **Buat Monitoring Tagihan** bila belum ada relasi.
4. Periksa data prefill, pilih status/template bila diperlukan, dan isi Nilai Kontrak.
5. Simpan Monitoring Tagihan.
6. Saat detail Surat Penunjukan dibuka kembali, tombol berubah menjadi
   **Lihat Monitoring Tagihan**.
7. Dari detail Monitoring Tagihan, pilih **Lihat Surat Penunjukan** untuk kembali ke
   dokumen sumber.

## Keamanan

- Viewer tidak dapat membuat monitoring.
- Create tetap menggunakan RPC `create_spk_billing` yang memvalidasi admin.
- Query link mengikuti RLS select milik `spk_billings`.
- Duplicate link tetap ditolak database walaupun dua request terjadi bersamaan.

## Verifikasi Manual

- Buat monitoring dari Surat Penunjukan dan pastikan semua field terpetakan.
- Pastikan Nilai Kontrak tetap kosong dan wajib diisi.
- Pastikan Surat Penunjukan yang sudah terhubung tidak menampilkan tombol create lagi.
- Pastikan duplicate create menghasilkan pesan yang mudah dipahami.
- Login sebagai viewer dan pastikan hanya tombol lihat yang tersedia.
- Dari detail billing, buka kembali Surat Penunjukan sumber.
