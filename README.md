# Template Undangan Pernikahan Digital

Situs statis (HTML + CSS + JS), tanpa build dan tanpa server.

## Struktur
- `index.html` : katalog template + formulir pembuat tautan
- `undangan.html` : halaman undangan yang dibaca tamu
- `css/style.css` : gaya katalog
- `css/undangan.css` : gaya undangan + 5 tema (variabel warna & huruf)
- `js/data.js` : daftar template & data bawaan
- `js/katalog.js` : logika katalog, pratinjau, salin tautan
- `js/undangan.js` : render undangan, hitung mundur, RSVP WhatsApp

## Cara pakai
1. Upload semua file ke repo GitHub.
2. Settings > Pages > Source: branch `main`, folder `/ (root)`.
3. Buka `https://username.github.io/nama-repo/`, isi data, salin tautan, kirim ke tamu.

Data mempelai dibawa lewat parameter tautan, contoh:
`undangan.html?t=rustic&pria=Raka&wanita=Sinta&tanggal=2026-12-20T09:00&wa=6281234567890&to=Budi`

## Menambah template
1. Tambah objek di `TEMPLATES` (`js/data.js`).
2. Tambah kelas `.t-<id>` di `css/undangan.css` dengan variabel `--bg --fg --ac --card --hf`.
