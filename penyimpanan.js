// Penyimpanan lokal bersama (katalog + dashboard). Semua data tinggal di browser, tanpa server.
const Simpan = (() => {
  const K = 'und:v1';
  const awal = () => ({
    data: {},                                   // isian undangan dari katalog
    tamu: [],                                   // {id,nama,wa,kelompok,pax,meja,acara,rsvp,doa,checkin}
    atur: {kapasitas: 10, katering: 0},
    anggaran: {total: 0, items: []},            // items: {id,nama,estimasi,aktual,lunas}
    tugas: [],                                  // {id,teks,due,selesai}
    hadiah: [],                                 // {id,dari,jenis,nilai,catatan}
    souvenir: {stok: 0, keluar: 0},
    pemenang: []                                // {id,tamuId,nama,hadiah}
  });
  const baca = () => {
    const a = awal();
    try {
      const x = JSON.parse(localStorage.getItem(K)) || {};
      return {...a, ...x, atur: {...a.atur, ...x.atur}, anggaran: {...a.anggaran, ...x.anggaran}, souvenir: {...a.souvenir, ...x.souvenir}};
    } catch (e) { return a; }
  };
  let s = baca();
  return {
    get state() { return s; },
    save() { try { localStorage.setItem(K, JSON.stringify(s)); return true; } catch (e) { return false; } },
    reload() { s = baca(); return s; },
    replace(obj) { s = {...awal(), ...obj}; return this.save(); },
    reset() { s = awal(); return this.save(); },
    uid: () => Math.random().toString(36).slice(2, 9)
  };
})();
