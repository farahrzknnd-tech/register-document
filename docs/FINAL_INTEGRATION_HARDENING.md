# Final Integration Hardening

Patch 8 menyelesaikan integrasi Document Registry dan Monitoring Billing ke dalam **Admin Management System**.

## Perubahan Utama

- Branding aplikasi diubah menjadi Admin Management System.
- Halaman Import Data Legacy ditambahkan untuk admin.
- Import memakai dry-run, checksum file, duplicate protection, audit history, dan warning mapping.
- Initial application load tidak lagi gagal diam-diam ke console; tersedia error screen, retry, dan logout.
- Callback refresh data menjadi `Promise` sehingga mutation dapat menunggu reload selesai.
- Billing Dashboard, Monitoring, Reports, dan Import dimuat secara lazy untuk mengurangi initial bundle.
- Auth dan Toast context dipisahkan dari provider component agar Fast Refresh tidak menghasilkan warning.
- Supabase typed client dipakai langsung untuk `app_users`; bridge `any` pada Auth dihapus.
- Metadata Bolt/Vite starter dihapus.
- File dokumentasi duplikat dan state lokal `supabase/.temp` dikeluarkan dari repository.

## Batasan Import

- Import hanya mendukung format JSON backup dari Monitoring Billing lama.
- Mapping Project/Cluster bersifat exact-name dan tidak membuat master Project/Cluster baru.
- Data pembayaran legacy tidak tersedia, sehingga `paid_amount` diimpor sebagai nol.
- Import tidak menghubungkan otomatis ke Surat Penunjukan karena aplikasi lama tidak menyimpan ID dokumen sumber.
- Record duplikat berdasarkan nomor SPK tidak diperbarui.
