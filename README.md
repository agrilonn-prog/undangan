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

## Ucapan: WhatsApp + dinding web
- Tamu menekan **Kirim ucapan via WhatsApp**: WhatsApp terbuka dengan pesan siap kirim ke nomor mempelai, dan ucapan langsung tampil di dinding web.
- Tanpa pengaturan tambahan, dinding hanya terlihat di HP tamu itu sendiri (GitHub Pages tidak punya server).
- **Dinding bersama (semua tamu saling melihat)**, gratis lewat Google Sheets:
  1. Buat Google Sheet baru > Ekstensi > Apps Script, hapus isinya, tempel kode di bawah.
  2. Terapkan > Deploy aplikasi web > Jalankan sebagai: Saya, Akses: Siapa saja. Salin URL `.../exec`.
  3. Tempel URL itu di kolom **Dinding ucapan bersama** pada editor, lalu salin tautan undangan.

```js
function aman(x){x=String(x);return /^[=+\-@]/.test(x)?"'"+x:x;}
function doPost(e){var b=JSON.parse(e.postData.contents),ss=SpreadsheetApp.getActiveSpreadsheet(),s=ss.getSheetByName('ucapan')||ss.insertSheet('ucapan');
  s.appendRow([new Date(),aman(String(b.key).slice(0,200)),aman(String(b.n).slice(0,60)),aman(String(b.h).slice(0,20)),Number(b.jm)||0,aman(String(b.t).slice(0,500))]);
  return ContentService.createTextOutput('ok');}
function doGet(e){var s=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ucapan'),out=[];
  if(s){var r=s.getDataRange().getValues();for(var i=r.length-1;i>=0&&out.length<50;i--){if(String(r[i][1]).replace(/^'/,'')==e.parameter.key)out.push({n:r[i][2],h:r[i][3],t:r[i][5]});}}
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);}
```
- Siapa pun yang punya tautan bisa mengirim ucapan; hapus baris di Sheet jika ada ucapan yang tidak pantas.

## YouTube sebagai musik latar otomatis
- Jika kolom **Musik latar** kosong dan kolom **Video & suara tambahan** berisi tautan YouTube, YouTube pertama otomatis diputar (berulang) saat tamu menekan **Buka undangan**, tanpa menekan play. Tombol ♫ di pojok kanan atas menjeda/memutar kembali.
- Jika Musik latar terisi mp3, mp3 itulah yang diputar dan YouTube tetap manual.
- Browser melarang suara otomatis sebelum ada ketukan, jadi pemutaran dimulai saat tamu menekan Buka undangan (bukan saat halaman baru dimuat).

- **Bisa dimatikan**: kolom editor *Putar musik otomatis saat undangan dibuka* (`autoplay=0` pada tautan) menonaktifkan pemutaran otomatis, baik mp3 maupun YouTube. Tamu juga selalu bisa menjeda lewat tombol ♫.

## Mode bisnis: pelanggan pilih template, isi sendiri, bayar
Alur: pelanggan memilih template di `index.html`, mengisi data, lalu menekan **Pesan & bayar**. Pratinjau memakai watermark. Setelah Anda mengubah status pesanan menjadi **lunas** di Google Sheet, undangan `undangan.html?id=KODE` tampil bersih dan siap dibagikan.

**Pasang (sekali saja)**
1. Google Sheet > Ekstensi > Apps Script: ganti seluruh isinya dengan isi `apps-script.gs`, simpan.
2. Terapkan > Kelola deployment > ikon pensil > Versi baru > Terapkan. (Jika belum pernah deploy: Deployment baru > Aplikasi web, akses "Siapa saja".) Salin URL `.../exec`.
3. Edit `bisnis.js`: `aktif: true`, isi `api` dengan URL tadi, lalu `nama`, `wa`, `paket` (harga dan isi paket), serta `bayar` (rekening, gambar QRIS opsional di folder `foto/`).
4. Unggah semua file ke GitHub.

**Setiap ada pesanan**
- Tab `pesanan` di Sheet berisi id, waktu, status, paket, kontak pelanggan, dan data undangan.
- Pelanggan membayar (QRIS/transfer) dan menekan tombol konfirmasi WhatsApp. Setelah uang masuk, ubah kolom `status` dari `menunggu` ke `lunas` (ada menu pilihan di sel).
- Halaman pelanggan memeriksa status tiap 20 detik; undangan otomatis aktif tanpa watermark.

**Catatan**
- `tanpa` pada tiap paket menonaktifkan fitur (`musik`, `media`, `sheet` untuk dinding ucapan, `galeri`, `live`, dan lainnya) pada paket itu.
- Pelanggan bisa memperbaiki data lewat tombol **Simpan perubahan ke pesanan** dari browser yang sama saat memesan. Untuk bantuan dari perangkat lain, ubah kolom `data` di Sheet atau minta pelanggan memesan ulang.
- Tautan tamu (tautan massal dan dashboard) otomatis memakai kode pesanan: `?id=KODE&to=Nama`.
- Pengamanan ini menahan penggunaan biasa, tetapi orang yang paham kode sumber halaman bisa saja menghapus watermark di browsernya sendiri. Untuk kunci yang benar-benar ketat, undangan perlu dirender di server (misalnya Cloudflare Workers atau Vercel).
- Kode pesanan tersimpan dalam Sheet Anda; jaga akses Sheet dan jangan membagikannya.
- Harga dan paket di `bisnis.js` hanya contoh. Tetapkan sendiri sesuai bisnis Anda.
