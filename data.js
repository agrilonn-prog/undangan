// Daftar template. Tambah template baru: tambahkan objek di sini
// lalu buat kelas ".t-<id>" di css/undangan.css.
const TEMPLATES = [
  { id: 'klasik',  nama: 'Klasik Emas',    desc: 'Gading hangat dengan aksen emas dan huruf serif anggun.' },
  { id: 'rustic',  nama: 'Rustic Sage',    desc: 'Hijau sage dan krem, nuansa kebun untuk pesta outdoor.' },
  { id: 'modern',  nama: 'Modern Minimal', desc: 'Putih bersih, huruf tebal, aksen oranye tegas.' },
  { id: 'jawa',    nama: 'Adat Jawa',      desc: 'Cokelat sogan dan emas, cocok untuk pernikahan adat.' },
  { id: 'islami',  nama: 'Islami Zamrud',  desc: 'Hijau zamrud dengan ayat dan salam pembuka.' }
];

// Data bawaan, ditimpa oleh parameter di tautan (?pria=...&wanita=...)
const DEFAULT_DATA = {
  t: 'klasik',
  pria: 'Raka',
  wanita: 'Sinta',
  tanggal: '2026-12-20T09:00',
  tempat: 'Gedung Serbaguna Pemuda',
  alamat: 'Jl. Pemuda No. 1, Semarang',
  maps: '',
  wa: '',
  to: 'Bapak/Ibu/Saudara/i'
};
