# Billing Master Data

## Tujuan

Patch 2 menambahkan UI master data untuk modul Monitoring Billing dengan tetap memakai fondasi Register Document:

- Supabase Auth yang sama;
- role `admin` dan `viewer` yang sama;
- RLS yang sudah dibuat pada Billing Database Foundation;
- komponen Modal, ConfirmDialog, Toast, Loading, dan layout yang sama;
- Master Project dan Master Cluster yang sudah ada.

Tidak ada sidebar, Supabase client, atau halaman master data kedua dari repository lama `monitoring-billing`.

## Tab baru

Halaman **Master Data** sekarang memiliki:

1. Master Project
2. Master Cluster
3. Kontraktor
4. Status Billing
5. Tahapan Approval
6. Template Termin

Halaman Master Data tetap hanya dapat dibuka oleh admin melalui navigation guard yang sudah ada.

## Master Kontraktor

Field yang dikelola:

- kode;
- nama kontraktor;
- PIC;
- telepon;
- email;
- alamat;
- status aktif.

Kode bersifat opsional. Nama wajib dan unik tanpa membedakan huruf besar/kecil. Penghapusan ditolak oleh foreign key jika kontraktor sudah digunakan oleh monitoring tagihan.

## Status Billing

Field yang dikelola:

- kode;
- nama;
- deskripsi;
- warna badge;
- urutan;
- status terminal;
- status aktif.

Status terminal menandai status akhir seperti `Completed` atau `Cancelled`. Penghapusan status yang sudah digunakan pada `spk_billings` akan ditolak.

## Tahapan Approval

Field yang dikelola:

- kode;
- nama tahap;
- deskripsi;
- urutan;
- status aktif.

Tahapan aktif disalin menjadi `billing_stage_progress` saat monitoring baru dibuat. Mengubah master tahap tidak mengubah progress billing yang sudah terbentuk. Penghapusan tahap yang sudah dipakai akan ditolak.

## Template Termin

Template terdiri dari header dan item terurut.

Header:

- kode;
- nama;
- deskripsi;
- status aktif.

Item:

- urutan;
- nama;
- persentase opsional;
- status aktif.

Penyimpanan header dan seluruh item memakai RPC `save_billing_termin_template` dalam satu transaksi. Jika salah satu item tidak valid, seluruh perubahan dibatalkan.

Validasi:

- minimal satu item aktif;
- nama item wajib;
- nama item tidak boleh duplikat;
- urutan item tidak boleh duplikat;
- persentase antara 0–100;
- total persentase item aktif tidak boleh lebih dari 100%.

Persentase tidak diwajibkan mencapai tepat 100% karena beberapa template lama masih menentukan nilai termin secara manual. Aturan yang lebih ketat dapat dikunci pada milestone termin aktual.

## Keamanan

- Anonymous tidak memiliki akses.
- Viewer aktif dapat membaca tabel master billing melalui RLS, tetapi halaman Master Data tidak tersedia di navigasi viewer.
- Admin aktif dapat CRUD.
- RPC template termin memeriksa `current_user_admin()` di dalam fungsi.
- Function execution dicabut dari `PUBLIC` dan `anon`.

## Migration

Patch ini menambahkan:

```text
supabase/migrations/20260719173000_add_billing_master_data_rpcs.sql
```

Migration hanya menambahkan RPC atomic untuk template termin. Tabel master sudah dibuat oleh Patch 1.

## Validasi lokal

```bash
npm run supabase:start
npm run db:reset
npm run db:test
npm run db:lint
npm run db:types
npm run check
```

Setelah `db:types`, pastikan perubahan generated type ikut dimasukkan ke commit.

## Remote

Review terlebih dahulu:

```bash
npx supabase migration list
npx supabase db push --dry-run
```

Push remote dilakukan manual:

```bash
npx supabase db push
```
