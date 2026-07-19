# Setup Supabase Register Document

## 1. Project Supabase

Buat atau pilih Supabase project khusus Register Document. Jangan gunakan project Disposal Management.

## 2. Ambil URL dan key

Di Supabase Dashboard buka Project Settings → API. Salin Project URL dan anon/publishable key.

## 3. Buat `.env`

```bash
cp .env.example .env
```

Isi:

```env
VITE_SUPABASE_URL=https://PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=ANON_OR_PUBLISHABLE_KEY
```

Jangan pernah menaruh service-role key di frontend.

## 4. Buat user pertama

Di Dashboard buka Authentication → Users → Add user. Buat user dengan email dan password.

## 5. Terapkan baseline migration

Lokal:

```bash
supabase start
supabase db reset
```

Remote nanti, setelah review:

```bash
supabase link --project-ref PROJECT_REF
supabase migration list
supabase db push
```

## 6. Promosikan admin pertama

Ganti email contoh dengan email user pertama.

```sql
update public.app_users
set role = 'admin', active = true, updated_at = now()
where lower(email) = lower('admin@example.com')
returning user_id, email, role, active;
```

Jika tidak ada baris kembali, pastikan user sudah dibuat dan trigger berjalan.

## 7. Verifikasi RLS

- Tanpa login: query tabel aplikasi harus ditolak atau kosong.
- Viewer: `select` boleh, `insert/update/delete` ditolak.
- Admin: CRUD boleh pada tabel domain.
- `register_seq` tidak bisa diakses langsung dari browser.

## 8. Jalankan frontend

```bash
npm install
npm run dev
```

Buka URL Vite, login dengan user Supabase Auth.

## 9. Troubleshooting

- `VITE_SUPABASE_URL wajib diisi`: `.env` belum lengkap.
- `Invalid login credentials`: email/password salah atau user belum dibuat.
- `Akun tidak aktif`: `app_users.active=false`.
- `Akses admin diperlukan`: user masih `viewer`.
- `Cluster tidak ditemukan`: cluster dokumen mengarah ke master cluster yang tidak ada.
- Hapus project/cluster gagal: masih ada data dependensi.

## 10. Peringatan service-role

Service-role key memberi akses penuh dan melewati RLS. Jangan pernah expose di `.env` frontend, kode React, repo, screenshot, atau browser.

## Remediasi 1.1

Baseline juga menjalankan backfill dari `auth.users` ke `public.app_users`, sehingga user yang sudah dibuat sebelum migration tetap mendapat role default `viewer`.

## Validasi Billing Foundation

Setelah menarik patch Billing Foundation, jalankan ulang local database dan tipe:

```bash
npm run supabase:start
npm run db:reset
npm run db:test
npm run db:lint
npm run db:types
npm run check
```

Pastikan migration list menampilkan `20260719160000_add_billing_monitoring_foundation.sql`. Jangan menjalankan `db push` remote sebelum semua pemeriksaan lokal berhasil.
