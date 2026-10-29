# Undangan Pernikahan Digital (lengkap)

Buka `index.html`, atau unggah semua file ke GitHub Pages / hosting statis apa pun.

| File | Fungsi |
|---|---|
| `index.html`, `katalog.js`, `katalog.css` | Katalog 18 template, asisten pemilih template, editor + pratinjau, tautan massal |
| `undangan.html`, `render-undangan.js`, `tema-undangan.css` | Halaman undangan untuk tamu |
| `dashboard.html`, `dashboard.js`, `dashboard.css` | Tamu, check-in QR, planner, laporan hari H |
| `smart.js` | Otak cerdas (logika lokal, tanpa server dan tanpa API) |
| `penyimpanan.js` | Penyimpanan localStorage bersama |
| `data.js` | Daftar template dan data contoh undangan lengkap |
| `contoh.js` | Generator data contoh dashboard (40 tamu, anggaran, tugas, hari H) |
| `foto/` | Sampul + 6 foto galeri contoh (ilustrasi buatan sendiri) |
| `musik/` | Musik latar contoh (komposisi orisinal, bebas hak cipta) |

- Pemindai kamera butuh `https://` atau `localhost`. Uji lokal: `python3 -m http.server`.
- Tambah template: objek baru di `data.js` dan kelas `.t-<id>` di `tema-undangan.css`.
- Data dashboard tersimpan di browser; unduh cadangan di tab Data secara berkala.

## Data contoh
- Semua isian undangan di `data.js` (`DEFAULT_DATA`) sudah terisi contoh: nama, orang tua, kisah cinta, rekening, foto, musik.
  **Ganti semuanya lewat `index.html` sebelum dibagikan.** Kolom yang Anda kosongkan tidak akan memakai data contoh.
- Foto dan musik boleh berkas lokal (`foto/…`, `musik/…`) atau tautan `https://`.
- Dashboard: tab Data > "Muat contoh", atau buka `dashboard.html?contoh=persiapan` / `?contoh=harih`.
- Nomor WhatsApp pada data contoh adalah rekaan.

## Pembaruan terbaru
- Perbaikan: sampul undangan tidak lagi mendorong teks keluar layar (bug blob CSS).
- Folder `foto/` dan `musik/` kini disertakan (ilustrasi dan musik orisinal buatan sendiri).
- Baru di undangan: bilah progres, kelopak/debu partikel sesuai tema, konfeti saat dibuka dan saat RSVP "Hadir", efek miring pada sampul, galeri lightbox (geser/panah/Esc), hitung mundur dengan angka bergulir dan pesan "Besok adalah harinya", tautan Google Kalender, jumlah tamu pada RSVP, rundown acara dan kode busana (kolom baru di editor), tombol musik yang menjeda otomatis saat tab disembunyikan.
- Kolom baru di editor: `rundown` (`09.00|Akad;11.30|Resepsi`) dan `busana` (teks + kode warna #hex).
- `undangan.js`/`undangan.css` lama (tidak terpakai) dihapus.

## Multi musik & video (baru)
- **Musik latar** (`musik`) kini boleh banyak, pisahkan koma: `musik/a.mp3, Judul|https://.../b.mp3`. Lagu diputar bergiliran lalu mengulang; ada tombol ⏮ ⏭ di pojok kanan atas.
- **Video & suara tambahan** (`media`) tampil sebagai bagian "Video & Musik" (menu Video). Mendukung: berkas/tautan `.mp4 .webm`, `.mp3 .m4a .wav .ogg`, YouTube, SoundCloud, Spotify, Vimeo, dan Google Drive (`/file/d/ID/view`, harus dibagikan "siapa saja yang memiliki tautan").
- Format tiap entri: `tautan` atau `Judul|tautan`, dipisah koma, titik koma, atau baris baru.
- Multi play: saat satu video/mp3 diputar, yang lain berhenti dan musik latar dijeda, lalu lanjut sendiri setelah selesai. (Pemutar sematan YouTube/SoundCloud/Spotify tidak bisa dijeda otomatis oleh halaman.)
- Tautan SoundCloud/YouTube di kolom Musik latar otomatis dipindah ke bagian media, karena bukan berkas audio langsung.
