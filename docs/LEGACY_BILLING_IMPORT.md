# Import Data Monitoring Billing Legacy

## Tujuan

Admin Management System menyediakan jalur import aditif untuk file JSON hasil **Download Backup** dari aplikasi Monitoring Billing lama.

Import ini bukan restore penuh. Sistem tidak menghapus atau menimpa data yang sudah ada.

## Aturan Import

- Hanya user `admin` yang dapat menjalankan import.
- File maksimal 10 MB dan 5.000 SPK per proses.
- Validasi/dry-run wajib dilakukan sebelum import aktual.
- Nomor SPK yang sudah ada dilewati.
- Record tanpa nomor SPK, kontraktor, atau nama pekerjaan dilewati.
- Project/Cluster legacy dicocokkan berdasarkan nama persis tanpa membedakan huruf besar/kecil.
- Jika nama cocok dengan Master Cluster, `cluster_id` dan Master Project cluster tersebut dipakai.
- Jika hanya cocok dengan Master Project, hanya `project_id` yang dipakai.
- Jika tidak cocok, Project dan Cluster dibiarkan kosong dan masuk daftar peringatan.
- Kontraktor, Status Billing, dan Template Termin yang belum ada dapat dibuat otomatis.
- Tahapan approval legacy dipetakan ke tahapan standar Admin Management System.
- Nilai tagihan legacy disimpan sebagai termin. Jika total legacy lebih besar daripada jumlah termin, sistem menambahkan termin `Penyesuaian Import Legacy`.
- Data pembayaran tidak diimpor karena aplikasi lama tidak menyimpan nilai pembayaran.
- Seluruh import dicatat di `billing_import_runs` dan `billing_activity_log`.

## Cara Menggunakan

1. Login sebagai admin.
2. Buka **Import Data Legacy**.
3. Pilih file JSON backup Monitoring Billing lama.
4. Klik **Validasi Import**.
5. Periksa jumlah data valid, duplikat, record tidak valid, dan scope yang tidak terpetakan.
6. Centang konfirmasi.
7. Klik **Import**.
8. Buka Monitoring Tagihan dan periksa hasilnya.

## Keamanan

Mutation dilakukan oleh RPC `import_legacy_billing_backup` dengan `SECURITY DEFINER`, secure search path, dan validasi admin internal. Browser tidak memiliki privilege langsung untuk menulis atau menghapus riwayat import.

RPC bersifat aditif dan tidak menjalankan `TRUNCATE`, bulk delete, atau overwrite record berdasarkan ID legacy.
