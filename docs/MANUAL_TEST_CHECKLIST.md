# Manual Test Checklist

- Login gagal: pakai password salah, pesan error muncul.
- Admin login: user role `admin` bisa masuk dan melihat tombol tambah/edit/hapus.
- Viewer login: user role `viewer` bisa masuk dan tombol mutasi tersembunyi.
- Akun inactive: set `active=false`, login ditolak oleh aplikasi/RLS.
- Admin CRUD: buat, edit, hapus project, cluster, dan semua jenis dokumen.
- Viewer read-only: viewer bisa lihat, cari, filter, print, export.
- Anonymous API: tanpa token, query tabel aplikasi ditolak.
- Project/cluster dokumen: keduanya opsional, independen, dan cluster beda project master tetap diterima.
- Nomor register: create dokumen menghasilkan format prefix benar dan sequence naik per tahun/subtype.
- Durasi sama tanggal: `tanggal_start=tanggal_finish` menghasilkan `durasi=1`.
- Finish invalid: `tanggal_finish < tanggal_start` ditolak.
- Referensi dokumen: referensi valid tersimpan.
- Cross-project reference: referensi beda project ditolak.
- Status gambar: hanya referensi dari `surat` ke `gambar` mengubah status menjadi `Sudah Dibuat Surat`.
- Restricted deletion: project/cluster yang masih dipakai gagal dihapus dengan pesan jelas.
- Logout: sesi keluar dan kembali ke login.
- Refresh browser: sesi login pulih otomatis.

## Remediasi 1.1

- Edit dokumen dengan referensi valid: data dan referensi berubah bersama.
- Edit dokumen lalu pilih referensi beda project: seluruh update rollback.
- Ubah jenis dokumen yang mengubah prefix register: ditolak.
- Ubah tanggal ke tahun berbeda dari register: ditolak.
- Coba update `status_tindak_lanjut` manual lewat browser role: ditolak/diabaikan oleh batas database.
- Buat Auth user sebelum migration lalu apply baseline: baris `app_users` otomatis tersedia setelah backfill.

## Billing Database Foundation

- Pastikan 9 tabel billing dan view `spk_billing_financial_summary` tersedia.
- Pastikan seed berisi 5 status, 9 tahapan, 2 template termin, dan 17 item template.
- Pastikan anonymous tidak dapat membaca tabel billing.
- Pastikan viewer aktif hanya dapat membaca.
- Pastikan admin aktif dapat membuat master dan billing record.
- Buat billing dengan `surat_penunjukan_id`; pembuatan kedua untuk SP yang sama harus ditolak.
- Pastikan Project dan Cluster billing boleh null dan tidak saling memfilter di level database.
- Pilih template termin saat membuat billing; stage progress dan termin aktual terbentuk otomatis.
- Pastikan total termin di atas nilai kontrak ditolak saat transaksi commit.

## Billing Master Data

- Login admin dan pastikan 6 tab Master Data tampil.
- Tambah kontraktor lengkap dengan PIC, telepon, email, alamat, dan status aktif.
- Edit kontraktor dan pastikan perubahan tampil setelah refresh data.
- Coba membuat kontraktor dengan nama duplikat; simpan harus ditolak dengan pesan jelas.
- Tambah Status Billing dengan kode, warna, urutan, terminal, dan status aktif.
- Edit seed status tanpa mengubah data billing yang sudah ada.
- Tambah Tahapan Approval dan pastikan urutan tabel sesuai `sort_order`.
- Nonaktifkan tahapan dan pastikan tahapan tidak ikut dibuat pada billing baru.
- Tambah Template Termin dengan beberapa item.
- Geser urutan item menggunakan tombol naik/turun dan simpan.
- Coba simpan template tanpa item aktif; simpan harus ditolak.
- Coba nama item duplikat; simpan harus ditolak.
- Coba total persentase aktif lebih dari 100%; simpan harus ditolak.
- Edit template dan pastikan header serta item berubah bersama.
- Coba hapus master yang sudah dipakai billing; penghapusan harus ditolak.
- Login viewer dan pastikan menu Master Data tidak tersedia serta mutation langsung ditolak RLS.
