# Register Document

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
- Review SQL dahulu, lalu jalankan manual ke dedicated Supabase project Register Document.
- Migration baseline diasumsikan untuk database kosong dan sengaja tidak dibuat terlalu idempotent.

## Billing Monitoring Foundation

Fondasi database Monitoring Billing ditambahkan melalui migration `20260719160000_add_billing_monitoring_foundation.sql`. Register Document tetap menjadi aplikasi induk dan menggunakan Auth, role, Project, Cluster, serta migration history yang sama.

Lihat `docs/BILLING_DATABASE_FOUNDATION.md`. Setelah migration lokal diterapkan, jalankan `npm run db:types` sebelum melanjutkan pengembangan UI billing.
