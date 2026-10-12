# Undangan Pernikahan Digital (lengkap)

Buka `index.html`, atau unggah semua file ke GitHub Pages / hosting statis apa pun.

| File | Fungsi |
|---|---|
| `index.html`, `katalog.js`, `katalog.css` | Katalog 18 template, asisten pemilih template, editor + pratinjau, tautan massal |
| `undangan.html`, `render-undangan.js`, `tema-undangan.css` | Halaman undangan untuk tamu |
| `dashboard.html`, `dashboard.js`, `dashboard.css` | Tamu, check-in QR, planner, laporan hari H |
| `smart.js` | Otak cerdas (logika lokal, tanpa server dan tanpa API) |
| `penyimpanan.js` | Penyimpanan localStorage bersama |
| `data.js` | Daftar template dan data bawaan |

- Pemindai kamera butuh `https://` atau `localhost`. Uji lokal: `python3 -m http.server`.
- Tambah template: objek baru di `data.js` dan kelas `.t-<id>` di `tema-undangan.css`.
- Data dashboard tersimpan di browser; unduh cadangan di tab Data secara berkala.
