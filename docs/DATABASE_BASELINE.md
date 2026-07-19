# Database Baseline

## Tabel

- `app_users`: profil auth, role `admin/viewer`, status aktif.
- `projects`: master proyek.
- `clusters`: cluster per proyek.
- `register_seq`: counter register internal.
- `gambar`, `surat`, `surat_penunjukan`, `berita_acara`: tabel dokumen domain.
- `document_ref`: referensi terarah antar dokumen.

## Relasi

- Setiap cluster wajib punya `project_id`.
- Setiap dokumen wajib punya `project_id`.
- `cluster_id` dokumen opsional.
- Composite FK memastikan cluster dokumen berasal dari project sama.

## Nomor register

Counter dipisah per `document_type`, `document_subtype`, dan tahun. Prefix tidak valid melempar exception, tidak ada fallback.

## Referensi dokumen

Semantik: source document → referenced/previous document. Self-reference, duplikat, dokumen tidak ada, dan beda project ditolak. Referensi dibersihkan saat dokumen dihapus.

## Auth

Supabase Auth membuat user. Trigger `auth.users` membuat `app_users` default `viewer`.

## Matrix RLS

| Role | Select | Insert | Update | Delete |
| --- | --- | --- | --- | --- |
| Anonymous | Tidak | Tidak | Tidak | Tidak |
| Inactive | Tidak | Tidak | Tidak | Tidak |
| Viewer | Ya | Tidak | Tidak | Tidak |
| Admin | Ya | Ya | Ya | Ya |

`register_seq` tidak punya akses browser langsung.

## RPC atomik

- `create_gambar`
- `create_surat`
- `create_surat_penunjukan`
- `create_berita_acara`
- `set_document_refs`

Create RPC memvalidasi admin, project, cluster, nomor register, insert dokumen, dan simpan referensi dalam satu transaksi.

## Deferred work

Belum termasuk unified documents table, soft delete, audit history, import Excel massal, storage upload, organisasi multi-tenant, dan UI audit admin.

## Remediasi 1.1

- Baseline membuat `app_users` untuk Auth user lama melalui backfill `auth.users`.
- Update dokumen memakai RPC atomik `update_*` dan mengganti referensi dalam transaksi yang sama.
- `register_no`, `created_at`, `updated_at`, dan `status_tindak_lanjut` dilindungi sebagai field sistem.
- Subtipe dan tahun tanggal harus tetap cocok dengan prefix/tahun pada `register_no`.
