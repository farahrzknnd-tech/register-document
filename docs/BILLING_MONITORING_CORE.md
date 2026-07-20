# Billing Monitoring Core

Patch 3 mengintegrasikan fitur inti Monitoring Tagihan ke dalam aplikasi Admin Management System. Admin Management System tetap menjadi host aplikasi, sehingga modul baru menggunakan layout, Auth, role, Project, Cluster, Toast, Modal, dan Supabase client yang sama.

## Ruang Lingkup

Fitur yang tersedia:

- Menu **Monitoring Tagihan** pada sidebar.
- Daftar SPK/tagihan dengan pencarian, filter, sorting, dan pagination.
- Ringkasan total monitoring, nilai kontrak, nilai ditagihkan, dan nilai dibayar.
- Form tambah monitoring untuk admin.
- Form edit data inti monitoring untuk admin.
- Detail monitoring untuk admin dan viewer.
- Informasi read-only timeline approval dan termin pembayaran.
- Hapus monitoring untuk admin.
- Viewer hanya dapat melihat, mencari, memfilter, dan membuka detail.
- Activity log otomatis untuk create dan update data inti.

## Mutation Boundary

Browser tidak lagi memiliki privilege langsung untuk `INSERT`, `UPDATE`, atau `DELETE` pada `spk_billings`. Mutasi dilakukan melalui RPC berikut:

- `create_spk_billing`
- `update_spk_billing`
- `delete_spk_billing`

Ketiganya menggunakan `SECURITY DEFINER`, secure search path, dan validasi `current_user_admin()`.

## Aturan Project dan Cluster

Sesuai aturan Admin Management System:

- Project opsional.
- Cluster opsional.
- Project dan Cluster independen.
- Memilih Project tidak memfilter Cluster.
- Memilih Cluster tidak mengubah Project.

## Template Termin

Template termin dapat dipilih ketika monitoring dibuat. Trigger foundation akan membuat baris termin aktual dari template tersebut. Pada Patch 3, template dikunci setelah monitoring dibuat. Pengelolaan timeline dan termin aktual akan ditambahkan pada Patch 5.

## Surat Penunjukan

Kolom relasi `surat_penunjukan_id` telah tersedia di database, tetapi alur tombol **Buat Monitoring Tagihan** dari Register Surat Penunjukan belum diaktifkan pada Patch 3. Integrasi dua arah tersebut menjadi ruang lingkup Patch 4.

## Validasi Lokal

```bash
npm run supabase:start
npm run db:reset
npm run db:test
npm run db:lint
npm run db:types
npm run check
```

Setelah `db:types`, commit perubahan generated `src/lib/database.types.ts` bila ada.
