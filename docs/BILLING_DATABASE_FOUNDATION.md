# Billing Database Foundation

## Tujuan

Modul Monitoring Billing diintegrasikan ke dalam `register-document`. Aplikasi ini tetap menjadi pemilik autentikasi, role, layout, master Project, master Cluster, Supabase client, dan migration history.

Patch ini hanya menambahkan fondasi database dan tipe domain. Halaman Monitoring Tagihan belum ditambahkan.

## Tabel baru

| Tabel | Fungsi |
| --- | --- |
| `contractors` | Master kontraktor. |
| `billing_statuses` | Master status monitoring. |
| `billing_stage_definitions` | Definisi urutan approval. |
| `billing_termin_templates` | Header template termin. |
| `billing_termin_template_items` | Detail item template termin. |
| `spk_billings` | Record utama monitoring SPK/tagihan. |
| `billing_stage_progress` | Progres approval per SPK. |
| `billing_termins` | Termin aktual, nilai rencana, tagihan, dan pembayaran. |
| `billing_activity_log` | Fondasi audit aktivitas billing. |

View `spk_billing_financial_summary` menjadi sumber nilai turunan `total_planned`, `total_billed`, `total_paid`, sisa kontrak, dan persentase.

## Relasi host application

- `spk_billings.surat_penunjukan_id` memakai `surat_penunjukan.id` dan unik ketika terisi.
- `spk_billings.project_id` memakai `projects.id`.
- `spk_billings.cluster_id` memakai `clusters.id`.
- Project dan Cluster pada billing opsional serta independen, mengikuti aturan dokumen Register Document.
- Tidak ada `master_projects`, `project_cluster text`, atau tabel user baru.

## Sumber kebenaran finansial

`spk_billings` hanya menyimpan `contract_value`. Nilai termin aktual disimpan pada `billing_termins`:

- `planned_amount`
- `billed_amount`
- `paid_amount`

Total tidak disimpan dua kali. View menghitung total dari termin dan trigger constraint mencegah:

- persentase termin aktif melebihi 100%;
- planned/billed total melebihi nilai kontrak;
- pembayaran melebihi nilai yang ditagihkan.

## Approval dan termin awal

Ketika `spk_billings` dibuat:

1. Seluruh tahapan aktif dibuat di `billing_stage_progress`.
2. Tahap `received_admin` langsung berstatus `completed`.
3. Bila template termin dipilih, item template disalin menjadi `billing_termins` aktual.

Perubahan template setelahnya tidak mengubah termin yang sudah terbentuk.

## Auth dan RLS

| Aktor | Read | Create/Update/Delete |
| --- | --- | --- |
| Anonymous | Tidak | Tidak |
| Inactive | Tidak | Tidak |
| Viewer aktif | Ya | Tidak |
| Admin aktif | Ya | Ya |

Seluruh policy memakai `current_user_active()` dan `current_user_admin()` dari Register Document. Migration lama Monitoring Billing yang memberikan CRUD kepada `anon` tidak digunakan.

## Seed

Migration menambahkan:

- 5 status: Open, In Progress, On Hold, Completed, Cancelled;
- 9 tahap approval dari Dokumen Diterima Admin sampai Completed;
- 2 template termin: Termin Bertahap dan BAST;
- 17 item template termin.

## Menjalankan secara lokal

```bash
npm run supabase:start
npm run db:reset
npm run db:test
npm run db:lint
npm run db:types
npm run check
```

`npm run db:types` wajib dijalankan setelah reset agar `src/lib/database.types.ts` mengikuti schema lokal terbaru.

## Remote

Jangan push sebelum semua pemeriksaan lokal hijau.

```bash
npx supabase migration list
npx supabase db push --dry-run
npx supabase db push
```

Perintah terakhir berdampak pada project remote dan dijalankan manual setelah review.

## Deferred ke patch berikutnya

- UI Master Kontraktor, Status, Tahapan, dan Template Termin.
- CRUD Monitoring Tagihan.
- Integrasi tombol pada Surat Penunjukan.
- UI timeline dan termin.
- Dashboard dan laporan billing.
- Import data lama dari `monitoring-billing`.
