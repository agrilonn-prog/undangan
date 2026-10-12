/* Data contoh lengkap untuk dashboard. Nomor WhatsApp di bawah adalah nomor rekaan.
   Contoh.buat('persiapan') = dua bulan sebelum acara; Contoh.buat('harih') = suasana hari H (ada check-in, doorprize, hadiah).
   Bergantung pada: data.js, penyimpanan.js, smart.js */
const Contoh = (() => {
  const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const pad = n => String(n).padStart(2, '0');
  const tgl = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  // [nama, kelompok, jumlah orang]
  const TAMU = [
    ['Keluarga Bapak Wibowo', 'Keluarga', 4], ['Keluarga Ibu Rina Susanti', 'Keluarga', 3], ['Bapak Slamet Riyadi', 'Keluarga', 2], ['Ibu Tutik Handayani', 'Keluarga', 2],
    ['Keluarga Pakde Darmo', 'Keluarga', 5], ['Keluarga Bulik Wati', 'Keluarga', 4], ['Mas Eko Prasetyo', 'Keluarga', 2], ['Mbak Ayu Lestari', 'Keluarga', 2],
    ['Keluarga Om Rahmat', 'Keluarga', 3], ['Tante Dewi Kusuma', 'Keluarga', 2], ['Ibu Sri Rahayu', 'Keluarga', 2],
    ['Bapak H. Ahmad Fauzi', 'VIP', 2], ['Ibu Hj. Siti Aminah', 'VIP', 2], ['Bapak dr. Andi Setiawan', 'VIP', 2],
    ['Dimas Aditya', 'Teman', 1], ['Putri Rahmawati', 'Teman', 2], ['Fajar Nugroho', 'Teman', 1], ['Nadia Safitri', 'Teman', 2], ['Bayu Anggoro', 'Teman', 1],
    ['Citra Dewanti', 'Teman', 2], ['Rizky Ramadhan', 'Teman', 1], ['Intan Permata', 'Teman', 1], ['Galih Saputra', 'Teman', 2], ['Maya Anggraini', 'Teman', 1],
    ['Yoga Pratama', 'Teman', 1], ['Lia Fitriani', 'Teman', 1],
    ['Bapak Agus Hermawan', 'Kantor', 2], ['Ibu Wulan Sari', 'Kantor', 1], ['Tim Marketing PT Maju Jaya', 'Kantor', 6], ['Divisi Keuangan PT Maju Jaya', 'Kantor', 4],
    ['Bapak Doni Kurniawan', 'Kantor', 2], ['Ibu Ratna Dewi', 'Kantor', 1], ['Rekan Kantor Cabang Solo', 'Kantor', 3], ['Bapak Hendra Gunawan', 'Kantor', 2],
    ['Bapak RT Sumarno & istri', 'Lainnya', 2], ['Ibu Siti Nurhaliza', 'Lainnya', 1], ['Keluarga Pak Haji Ali', 'Lainnya', 3],
    // Sengaja berantakan agar fitur pembersih data & deteksi duplikat punya bahan latihan
    ['pak budi santoso', 'Teman', 2], ['Budi Santosa', 'Teman', 1], ['keluarga bu rina', 'Keluarga', 3]
  ];
  const DOA_HADIR = ['Selamat menempuh hidup baru, semoga sakinah mawaddah warahmah.', 'Bahagia selalu untuk kalian berdua!', 'Turut berbahagia. Doa terbaik menyertai.', 'Barakallah, semoga menjadi keluarga yang penuh berkah.', 'Sampai jumpa di hari bahagia kalian!'];
  const DOA_TIDAK = ['Maaf belum bisa hadir, semoga acaranya lancar dan penuh kebahagiaan.', 'Mohon maaf berhalangan hadir, doa terbaik dari kami.'];
  const HADIAH = [
    ['Keluarga Bapak Wibowo', 'Amplop tunai', 1500000, ''], ['Bapak H. Ahmad Fauzi', 'Amplop tunai', 2000000, 'Titip salam untuk orang tua'], ['Ibu Hj. Siti Aminah', 'Transfer', 1000000, ''],
    ['Tim Marketing PT Maju Jaya', 'Kado', 750000, 'Set peralatan makan'], ['Putri Rahmawati', 'Kado', 300000, 'Sprei dan bed cover'], ['Fajar Nugroho', 'Transfer', 500000, ''],
    ['Keluarga Pakde Darmo', 'Amplop tunai', 1250000, ''], ['Divisi Keuangan PT Maju Jaya', 'Amplop tunai', 1000000, 'Dari seluruh divisi'], ['Dimas Aditya', 'Kado', 250000, 'Teko listrik'],
    ['Bapak dr. Andi Setiawan', 'Amplop tunai', 1500000, '']
  ];

  function buat(mode = 'persiapan', sekarang = new Date()) {
    const uid = Simpan.uid, r = rng(mode === 'harih' ? 77 : 2026), harih = mode === 'harih';
    const {to: _to, ...data} = DEFAULT_DATA;
    if (harih) { data.tanggal = `${tgl(sekarang)}T09:00`; data.resepsi = `${tgl(sekarang)}T11:30`; }
    const tanggalAcara = new Date(data.tanggal);

    // --- Tamu ---
    const tamu = TAMU.map(([nama, kelompok, pax], i) => {
      // Pola tetap supaya contoh selalu memuat semua status (hadir, tidak hadir, ragu, belum menjawab)
      const POLA = harih ? ['hadir', 'hadir', 'hadir', 'hadir', 'tidak', 'hadir', 'hadir', 'ragu', 'hadir', 'belum'] : ['hadir', 'hadir', 'belum', 'hadir', 'tidak', 'belum', 'ragu', 'hadir', 'belum', 'hadir'];
      const rsvp = POLA[i % POLA.length];
      const nomor = `0812${String(3450000 + i * 137).padStart(7, '0')}`;
      const wa = i === TAMU.length - 1 ? '12345' : (i === TAMU.length - 3 || i === TAMU.length - 2) ? '0813-1111-2201' : '62' + nomor.slice(1);
      const kirim = r() < .85;
      return {id: uid(), nama, wa, kelompok, pax, meja: '', acara: i % 9 === 4 ? 'resepsi' : '', rsvp,
        doa: rsvp === 'hadir' && r() < .5 ? DOA_HADIR[Math.floor(r() * DOA_HADIR.length)] : rsvp === 'tidak' ? DOA_TIDAK[Math.floor(r() * DOA_TIDAK.length)] : '',
        checkin: null, terkirim: kirim ? new Date(+sekarang - (3 + Math.floor(r() * 25)) * 864e5).toISOString() : undefined};
    });
    // Dua tamu sengaja belum dirapikan namanya agar terlihat fitur pembersih; sisanya dirapikan seperti hasil impor biasa
    tamu.forEach((g, i) => { if (i < TAMU.length - 3) g.nama = Cerdas.parseNama(g.nama).tampil; });

    // --- Meja (disusun oleh algoritma yang sama dengan fitur "Susun meja otomatis") ---
    const kapasitas = 10, rencana = Cerdas.susunMeja(tamu, {kapasitas});
    tamu.forEach(g => { if (rencana.peta[g.id]) g.meja = rencana.peta[g.id]; });
    if (!harih) tamu.filter(g => g.rsvp === 'belum').slice(-4).forEach(g => (g.meja = '')); // sisakan beberapa tanpa meja

    // --- Check-in & doorprize (hanya mode hari H) ---
    const pemenang = []; let keluar = 0;
    if (harih) {
      const norm2 = () => { let s = 0; for (let k = 0; k < 6; k++) s += r(); return (s - 3) / 3; }; // mendekati kurva lonceng
      tamu.filter(g => g.rsvp === 'hadir' && r() < .9).forEach(g => {
        const menit = Math.round(Math.max(0, Math.min(150, 55 + norm2() * 70)));
        g.checkin = new Date(tanggalAcara.getFullYear(), tanggalAcara.getMonth(), tanggalAcara.getDate(), 8, 15 + menit).toISOString(); keluar += g.pax;
      });
      tamu.filter(g => !g.checkin && g.rsvp === 'ragu').forEach(g => { g.rsvp = 'hadir'; });
      const masuk = tamu.filter(g => g.checkin);
      [['Voucher menginap 2 malam', 0], ['Paket peralatan dapur', 1]].forEach(([hadiah, k]) => { const g = masuk[(k * 7 + 3) % masuk.length]; pemenang.push({id: uid(), tamuId: g.id, nama: g.nama, hadiah}); });
    }

    // --- Anggaran ---
    const harapan = Cerdas.prediksi(tamu).harapan, rancang = Cerdas.rancangAnggaran(75000000, harapan);
    const items = rancang.items.map(i => ({id: uid(), ...i}));
    const set = (nama, aktualPersen, lunas) => { const i = items.find(x => x.nama.startsWith(nama)); i.aktual = Math.round(i.estimasi * aktualPersen / 50000) * 50000; i.lunas = lunas; };
    if (harih) { set('Gedung', 1, true); set('Dekorasi', 1, true); set('Busana', 1, true); set('Dokumentasi', 1, true); set('Hiburan', 1, true); set('Undangan', 1, true); set('Mahar', 1, true); set('Transportasi', .9, true); set('Katering', .6, false); set('Dana', .3, false); }
    else { set('Gedung', 1, true); set('Dekorasi', .5, false); set('Busana', 1, true); set('Dokumentasi', .5, false); set('Undangan', .4, false); set('Mahar', 1, true); }

    // --- Tugas persiapan ---
    const tugas = Cerdas.jadwalTugas(tanggalAcara, sekarang).map(t => ({id: uid(), teks: t.teks, due: t.due, selesai: harih ? t.due <= tgl(sekarang) && !t.teks.startsWith('Kirim ucapan') && !t.teks.startsWith('Lunasi') : t.due < tgl(new Date(+sekarang - 3 * 864e5))}));

    // --- Hadiah (hanya hari H) ---
    const hadiah = harih ? HADIAH.map(([dari, jenis, nilai, catatan]) => ({id: uid(), dari, jenis, nilai, catatan})) : [];

    return {
      data, tamu, atur: {kapasitas, katering: Cerdas.prediksi(tamu).saranKatering + 5}, // sedikit di atas saran asisten
      anggaran: {total: 75000000, items, catatan: rancang.catatan},
      tugas, hadiah, souvenir: {stok: 120, keluar}, pemenang
    };
  }
  return {buat};
})();
