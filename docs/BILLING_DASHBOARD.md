# Billing Dashboard

Patch 6 menambahkan halaman **Dashboard Tagihan** sebagai ringkasan eksekutif modul Monitoring Tagihan. Halaman ini tetap menggunakan data, Auth, role, Project, Cluster, dan Supabase client milik Register Document.

## Navigasi

Menu baru tersedia di sidebar:

1. Dashboard Tagihan
2. Monitoring Tagihan

Dashboard Tagihan memakai URL hash `#/billingDashboard`, sehingga halaman tetap terbuka setelah browser di-refresh. Tombol **Lihat Monitoring** membuka daftar monitoring, sedangkan item pada tabel **Perlu Perhatian** membuka detail monitoring yang terkait.

## Filter

Filter tersedia secara independen untuk:

- Project;
- Cluster;
- Kontraktor;
- Status Billing.

Project dan Cluster tetap mengikuti keputusan domain Register Document: keduanya opsional serta independen. Memilih Project pada dashboard tidak mengubah atau membatasi pilihan Cluster.

## KPI

Dashboard menampilkan:

- total monitoring;
- total kontraktor unik;
- total nilai kontrak;
- total sudah ditagihkan;
- total sudah dibayar;
- sisa nilai kontrak yang belum ditagihkan;
- jumlah monitoring berstatus Completed;
- jumlah pekerjaan yang melewati tanggal selesai.

## Progress finansial

Sumber kebenaran tetap view `spk_billing_financial_summary`:

- realisasi tagihan = total tagihan / nilai kontrak;
- realisasi pembayaran = total pembayaran / total tagihan;
- tagihan belum dibayar = total tagihan - total pembayaran;
- kontrak belum ditagihkan = nilai kontrak - total tagihan.

Dashboard tidak menyimpan ulang total keuangan.

## Breakdown

Halaman menampilkan ringkasan berbentuk progress bar tanpa dependency chart tambahan:

- nilai tagihan per Project;
- nilai tagihan per Cluster;
- distribusi Status Billing;
- posisi Tahapan Approval.

Maksimal delapan kelompok terbesar ditampilkan pada setiap panel agar halaman tetap mudah dibaca.

## Perlu Perhatian

Monitoring dimasukkan ke daftar perhatian dengan urutan prioritas berikut:

1. pekerjaan melewati tanggal selesai tetapi status belum terminal;
2. nilai sudah ditagihkan tetapi belum seluruhnya dibayar;
3. kontrak belum memiliki realisasi tagihan;
4. pekerjaan akan selesai dalam 30 hari.

Satu monitoring hanya menampilkan kondisi dengan prioritas tertinggi agar tidak muncul berulang kali.

## Hak akses

Dashboard bersifat read-only untuk admin dan viewer. Semua data tetap dilindungi RLS yang sudah tersedia. Tidak ada mutation RPC atau migration baru pada Patch 6.

## Validasi

```bash
npm run check
```

Patch ini tidak mengubah schema database, sehingga `db reset`, `db push`, dan regenerasi database types tidak wajib untuk penerapan Patch 6.
