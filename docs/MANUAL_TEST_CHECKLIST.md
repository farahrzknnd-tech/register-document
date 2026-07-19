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
