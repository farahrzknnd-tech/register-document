# Billing Reports

Patch 7 menambahkan halaman **Laporan Tagihan** sebagai laporan read-only untuk admin dan viewer.

## Cakupan

- Rekap total monitoring aktif dan selesai.
- Nilai kontrak, rencana termin, tagihan, pembayaran, sisa kontrak, dan outstanding pembayaran.
- Filter pencarian, Project, Cluster, Kontraktor, Status, Tahun, dan rentang tanggal.
- Project dan Cluster tetap independen.
- Detail monitoring dan detail termin dalam dua tab.
- Export Excel dengan sheet `Rekap`, `Monitoring`, dan `Termin`.
- Export PDF landscape dengan ringkasan, detail monitoring, dan termin.
- Print melalui halaman khusus yang sudah melakukan HTML escaping.
- Spreadsheet text disanitasi untuk mencegah formula injection.

## Navigasi

Menu menggunakan hash:

```text
#/billingReports
```

Refresh browser mempertahankan halaman Laporan Tagihan.

## Sumber data

Laporan tidak menyimpan total keuangan baru. Nilai berasal dari:

- `spk_billings.contract_value`
- view `spk_billing_financial_summary`
- `billing_termins`

Dengan demikian, laporan tidak membuat sumber kebenaran finansial kedua.

## Export

Library `xlsx`, `jspdf`, dan `jspdf-autotable` dimuat secara dinamis hanya saat pengguna menjalankan export. Halaman Laporan Dokumen lama juga diperbarui menggunakan dynamic import agar library export tidak masuk ke initial bundle.

## Hak akses

- Admin: membaca, memfilter, membuka detail, export, dan print.
- Viewer: membaca, memfilter, membuka detail, export, dan print.
- Anonymous: tidak memiliki akses karena data mengikuti RLS billing yang sudah ada.

Patch ini tidak menambahkan migration database baru.
