# Admin Management System

Aplikasi register dokumen proyek berbasis React, TypeScript, Vite, Tailwind CSS, Supabase Auth, Supabase PostgreSQL, jsPDF, dan XLSX.

## Setup frontend

```bash
npm install
cp .env.example .env
npm run dev
```

Isi `.env` hanya dengan Project URL dan anon/publishable key. Jangan pernah memakai service-role key di frontend.

## Supabase lokal

```bash
supabase start
supabase db reset
supabase migration list
```

Migration aktif pertama: `supabase/migrations/20260719000000_register_document_baseline.sql`.

## Validasi

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run check
```

## Auth dan role

- Login memakai Supabase Auth email/password.
- Trigger `auth.users` membuat baris `app_users` otomatis.
- User baru default `viewer` dan aktif.
- Role valid: `admin`, `viewer`.
- RLS PostgreSQL jadi batas izin final; UI hanya menyembunyikan kontrol mutasi.

## Migration safety

- Jangan jalankan migration ke project remote otomatis dari agen.
- Review SQL dahulu, lalu jalankan manual ke dedicated Supabase project Admin Management System.
- Migration baseline diasumsikan untuk database kosong dan sengaja tidak dibuat terlalu idempotent.

## Billing Monitoring Foundation

Fondasi database Monitoring Billing ditambahkan melalui migration `20260719160000_add_billing_monitoring_foundation.sql`. Admin Management System tetap menjadi aplikasi induk dan menggunakan Auth, role, Project, Cluster, serta migration history yang sama.

Lihat `docs/BILLING_DATABASE_FOUNDATION.md`. Setelah migration lokal diterapkan, jalankan `npm run db:types` sebelum melanjutkan pengembangan UI billing.

## Billing Master Data

Patch 2 menambahkan tab Master Kontraktor, Status Billing, Tahapan Approval, dan Template Termin di halaman Master Data. Template beserta itemnya disimpan atomik melalui RPC admin-only.

## Billing Monitoring Core

Patch 3 menambahkan menu Monitoring Tagihan, daftar SPK/tagihan, filter, ringkasan finansial, form tambah/edit, detail monitoring, serta secure RPC untuk mutasi data inti. Lihat `docs/BILLING_MONITORING_CORE.md`.

## Billing Approval dan Termin

Patch 5 mengaktifkan pengelolaan timeline approval serta termin pembayaran untuk admin, termasuk catatan tahapan, realisasi tagihan/pembayaran, validasi finansial, activity log, dan secure RPC. Lihat `docs/BILLING_APPROVAL_TERMIN_MANAGEMENT.md`.

Lihat juga `docs/BILLING_MASTER_DATA.md`.

## Billing Dashboard

Patch 6 menambahkan halaman Dashboard Tagihan dengan KPI kontrak, tagihan, pembayaran, breakdown Project/Cluster/Status/Tahapan, serta daftar monitoring yang perlu perhatian. Lihat `docs/BILLING_DASHBOARD.md`.

## Billing Reports

Patch 7 menambahkan halaman Laporan Tagihan dengan filter independen, rekap finansial, detail monitoring, detail termin, export Excel/PDF, dan print. Export library dimuat secara dinamis untuk mengurangi initial bundle. Lihat `docs/BILLING_REPORTS.md`.

## Legacy Billing Import dan Final Hardening

Patch 8 menambahkan halaman admin `Import Data Legacy` untuk memigrasikan backup JSON dari aplikasi Monitoring Billing lama secara aman dan aditif. Import memiliki dry-run, perlindungan duplikat, mapping master data, audit history, serta tidak menimpa data yang sudah ada.

Branding aplikasi final adalah **Admin Management System**. Lihat:

- `docs/LEGACY_BILLING_IMPORT.md`
- `docs/FINAL_INTEGRATION_HARDENING.md`
