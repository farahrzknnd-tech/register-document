# Billing Approval Timeline dan Termin Pembayaran

Patch 5 mengaktifkan pengelolaan timeline approval dan termin pembayaran pada detail Monitoring Tagihan. Admin Management System tetap menjadi host aplikasi dan seluruh mutasi mengikuti Auth, role, RLS, Toast, Modal, serta Supabase client yang sudah ada.

## Fitur Timeline Approval

Admin dapat:

- Mengubah status tahapan menjadi `Belum Dimulai`, `Sedang Diproses`, `Selesai`, atau `Dilewati`.
- Mengisi tanggal dan waktu selesai untuk status `Selesai`.
- Menambahkan atau memperbarui catatan tahapan.
- Menyinkronkan tahapan aktif dari Master Tahapan Approval ke monitoring yang sudah ada.

Viewer hanya dapat membaca timeline.

Mutasi dilakukan melalui RPC:

- `update_billing_stage_progress`
- `sync_billing_stage_progress`

Setiap perubahan dicatat ke `billing_activity_log`.

## Fitur Termin Pembayaran

Admin dapat:

- Menambah termin manual.
- Mengedit termin hasil template maupun termin manual.
- Mengatur urutan, nama, persentase, nilai rencana, nilai ditagihkan, dan nilai dibayar.
- Mengisi tanggal tagihan dan tanggal pembayaran.
- Mengatur status termin.
- Menghapus termin yang belum memiliki realisasi tagihan atau pembayaran.

Viewer hanya dapat membaca termin dan ringkasan keuangan.

Mutasi dilakukan melalui RPC:

- `save_billing_termin`
- `delete_billing_termin`

## Aturan Keuangan

Database menegakkan aturan berikut:

- Nilai rencana tidak boleh negatif atau melebihi nilai kontrak.
- Nilai ditagihkan tidak boleh melebihi nilai rencana.
- Nilai dibayar tidak boleh melebihi nilai ditagihkan.
- Tanggal tagihan wajib diisi ketika nilai ditagihkan lebih dari nol.
- Tanggal pembayaran wajib diisi ketika nilai dibayar lebih dari nol.
- Tanggal pembayaran tidak boleh lebih awal dari tanggal tagihan.
- Total persentase termin aktif tidak boleh melebihi 100%.
- Total nilai rencana dan tagihan tidak boleh melebihi nilai kontrak.
- Termin dengan realisasi finansial tidak dapat dihapus.

Status termin harus konsisten dengan nilainya:

| Status | Aturan |
|---|---|
| Belum Ditagihkan | Nilai tagihan dan pembayaran = 0 |
| Sedang Diproses | Nilai tagihan dan pembayaran = 0 |
| Ditagihkan | Nilai tagihan > 0 dan pembayaran = 0 |
| Dibayar Sebagian | 0 < pembayaran < tagihan |
| Lunas | Pembayaran = tagihan dan tagihan > 0 |
| Dibatalkan | Tidak dihitung dalam ringkasan keuangan |

## Keamanan

Browser role tidak memiliki privilege langsung untuk `INSERT`, `UPDATE`, atau `DELETE` pada:

- `billing_stage_progress`
- `billing_termins`

Browser juga tidak dapat menulis langsung ke `billing_activity_log`. Semua mutasi melewati RPC admin-only dengan `SECURITY DEFINER`, secure search path, dan validasi `current_user_admin()`.

## Validasi Lokal

```bash
npm run supabase:start
npm run db:reset
npm run db:test
npm run db:lint
npm run db:types
npm run check
```

Setelah `db:types`, masukkan perubahan `src/lib/database.types.ts` ke commit bila file tersebut berubah.
