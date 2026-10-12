/* ============================================================
   OTAK CERDAS — heuristik lokal, tanpa server dan tanpa API.
   Semua fungsi murni (tidak menyentuh DOM) sehingga mudah diuji di Node.
   ============================================================ */
const Cerdas = (() => {
  'use strict';

  const rp = n => 'Rp ' + Math.round(n || 0).toLocaleString('id-ID');
  const norm = s => String(s == null ? '' : s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9\s'\-]/g, ' ').replace(/\s+/g, ' ').trim();
  const pax = t => Math.max(1, parseInt(t.pax, 10) || 1);
  const kel = t => t.kelompok || 'Lainnya';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));

  /* ---------- 1. REKOMENDASI TEMPLATE DARI KALIMAT BEBAS ---------- */
  // Bobot 3 = penanda kuat, 2 = sedang, 1 = lemah. Tanda * = awalan kata.
  const KATA = {
    klasik: {3: ['klasik', 'elegan*', 'mewah', 'formal'], 2: ['emas', 'tradisional', 'anggun', 'berkelas'], 1: ['umum', 'biasa', 'netral']},
    rustic: {3: ['rustic', 'kebun', 'garden', 'outdoor'], 2: ['alam', 'sage', 'hijau', 'pedesaan', 'piknik', 'santai', 'boho'], 1: ['natural', 'bunga', 'hangat']},
    modern: {3: ['modern', 'minimalis*', 'minimalist'], 2: ['simpel', 'sederhana', 'simple', 'bersih', 'kekinian', 'clean', 'oranye', 'orange'], 1: ['praktis', 'ringkas']},
    islami: {3: ['islam*', 'muslim*', 'ijab', 'kabul', 'akad nikah', 'hijriah', 'masjid', 'assalamualaikum', "syar'i", 'syari'], 2: ['akad', 'walimah', 'walimatul ursy', 'quran', 'alquran', 'sakinah', 'sunnah'], 1: ['nikah', 'barakallah']},
    minang: {3: ['minang*', 'padang', 'songket', 'sumbar', 'bundo', 'datuk'], 2: ['marapulai', 'anak daro', 'baralek'], 1: ['rendang']},
    jawa: {3: ['jawa', 'jogja', 'yogya*', 'solo', 'semarang', 'kejawen', 'midodareni', 'siraman', 'pasaran', 'temanten', 'sogan', 'kawung', 'javanese', 'surakarta'], 2: ['adat jawa', 'weton', 'panggih', 'blangkon', 'kebaya', 'batik'], 1: ['jateng', 'jatim', 'surabaya', 'malang']},
    sunda: {3: ['sunda', 'bandung', 'priangan', 'sampurasun', 'cianjur', 'garut', 'tasikmalaya', 'sukabumi'], 2: ['jabar', 'jawa barat', 'siger', 'bogor', 'cirebon'], 1: ['hejo']},
    batak: {3: ['batak', 'toba', 'ulos', 'horas', 'simalungun', 'mandailing', 'tapanuli', 'dalihan natolu', 'karo'], 2: ['medan', 'sumut', 'sumatera utara', 'marga', 'pesta adat'], 1: ['mangulosi']},
    bali: {3: ['bali*', 'pawiwahan', 'poleng', 'denpasar', 'ubud', 'gianyar', 'singaraja'], 2: ['pura', 'canang', 'hindu bali', 'om swastyastu'], 1: ['pulau dewata']},
    kristen: {3: ['kristen', 'protestan', 'gereja', 'injil', 'alkitab', 'jemaat', 'gki', 'hkbp', 'gpib', 'pdt', 'pendeta'], 2: ['pemberkatan', 'kasih', 'ayat'], 1: ['doa', 'tuhan']},
    katolik: {3: ['katolik', 'misa', 'paroki', 'sakramen', 'romo', 'katedral', 'ekaristi'], 2: ['pemberkatan nikah', 'santo', 'santa'], 1: ['rosario']},
    hindu: {3: ['hindu', 'veda', 'marigold', 'pandita', 'pedanda', 'om swastyastu'], 2: ['pura', 'swastika', 'dharma hindu'], 1: ['jingga']},
    buddha: {3: ['buddha', 'budha', 'buddhis*', 'vihara', 'teratai', 'namo buddhaya', 'bhikkhu', 'pandita buddhis'], 2: ['dharma', 'meditasi', 'metta'], 1: ['tenang']},
    tionghoa: {3: ['tionghoa', 'tionghua', 'cina', 'china', 'chinese', 'imlek', 'shuangxi', 'sangjit', 'teapai', 'tehpai', 'tea pai', 'angpao', 'angpau'], 2: ['merah', 'naga', 'hokkien', 'hakka', 'konghucu', 'klenteng', 'vihara'], 1: ['lampion']},
    pixel: {3: ['game*', 'gamer', 'gaming', '8-bit', 'pixel', 'esports', 'nerd', 'geek'], 2: ['retro game', 'arcade', 'anime', 'konsol', 'playstation', 'nintendo', 'level'], 1: ['seru', 'unik', 'beda', 'lucu', 'interaktif']},
    sinematik: {3: ['film', 'sinema*', 'cinematic', 'bioskop', 'dramatis', 'dark', 'gelap'], 2: ['malam', 'teater', 'movie', 'epik', 'misterius'], 1: ['romantis', 'intim']},
    salju: {3: ['salju', 'snow*', 'winter', 'musim dingin', 'frozen'], 2: ['dingin', 'biru es', 'korea', 'eropa', 'swiss', 'jepang'], 1: ['biru', 'putih', 'sejuk']},
    vintage: {3: ['vintage', 'jadul', 'antik', 'sepia', 'polaroid', 'jaman dulu', 'zaman dulu'], 2: ['retro', 'kuno', 'klasik tua', 'nostalgia*', '80an', '90an', 'tahun 80', 'tahun 90'], 1: ['foto lama', 'kertas tua']}
  };
  const NEG = ['bukan', 'tanpa', 'tidak', 'jangan', 'non', 'anti', 'hindari', 'gak', 'nggak', 'ga'];
  const kebal = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // true = cocok, 'neg' = cocok tetapi dinegasikan ("bukan islami"), false = tidak ada
  function cocok(teks, kw) {
    const awalan = kw.endsWith('*'), k = norm(kw.replace('*', ''));
    if (!k) return false;
    const re = new RegExp('(^|\\s)' + kebal(k) + (awalan ? '' : "(?=\\s|$)"));
    const m = re.exec(teks);
    if (!m) return false;
    const sebelum = teks.slice(0, m.index + m[1].length).trim().split(' ').slice(-2);
    return sebelum.some(w => NEG.includes(w)) ? 'neg' : true;
  }

  function rekomendasiTemplate(kalimat, TEMPLATES) {
    const teks = norm(kalimat);
    if (!teks) return [];
    const hasil = [];
    (TEMPLATES || []).forEach(t => {
      let skor = 0; const alasan = [];
      // Kamus bawaan; template baru yang belum punya kamus memakai nama, tag, dan deskripsinya
      const kamus = KATA[t.id] || (() => {
        const kata = x => norm(x).split(' ').filter(w => w.length > 3);
        return {2: [...kata(t.nama), ...(t.tag || [])], 1: kata(t.desc || '')};
      })();
      Object.entries(kamus).forEach(([bobot, daftar]) => daftar.forEach(kw => {
        const c = cocok(teks, kw);
        if (c === true) { skor += +bobot; alasan.push(kw.replace('*', '')); }
        else if (c === 'neg') skor -= +bobot * 2;
      }));
      if (skor > 0) hasil.push({id: t.id, skor, alasan: [...new Set(alasan)].slice(0, 5)});
    });
    return hasil.sort((a, b) => b.skor - a.skor).slice(0, 3);
  }

  /* ---------- 2. NAMA, SAPAAN, NOMOR WA ---------- */
  const TITEL = {pak: ['Bapak', 'L'], bpk: ['Bapak', 'L'], bapak: ['Bapak', 'L'], bu: ['Ibu', 'P'], ibu: ['Ibu', 'P'],
    mas: ['Mas', 'L'], mbak: ['Mbak', 'P'], mba: ['Mbak', 'P'], kak: ['Kak', null], kakak: ['Kak', null], dik: ['Dik', null],
    adik: ['Dik', null], om: ['Om', 'L'], tante: ['Tante', 'P'], bro: ['Bro', 'L'], sis: ['Sis', 'P']};
  const GELAR = {dr: 'dr.', drg: 'drg.', prof: 'Prof.', ir: 'Ir.', h: 'H.', hj: 'Hj.', ust: 'Ust.', ustadz: 'Ustadz', ustadzah: 'Ustadzah',
    pdt: 'Pdt.', romo: 'Romo', pastor: 'Pastor', ns: 'Ns.', kh: 'KH.', kyai: 'Kyai'};

  function titleCase(s) {
    const kata = s.split(' ');
    return kata.map((w, i) => {
      if (!w) return w;
      if (i > 0 && /^(bin|binti|van|de|der|den|al|el|dan)$/i.test(w)) return w.toLowerCase();
      if (w === w.toLowerCase() || w === w.toUpperCase())
        return w.split(/([-'’.])/).map(p => /[a-z]/i.test(p) ? p.charAt(0).toUpperCase() + p.slice(1).toLowerCase() : p).join('');
      return w; // campuran huruf (McDonald, DeLuca) dibiarkan
    }).join(' ');
  }

  function parseNama(raw) {
    let t = String(raw || '').trim().replace(/\s+/g, ' ');
    let keluarga = false, sapa = null, jk = null; const gelar = [];
    const m = t.match(/^(keluarga|kel\.?|family|fam\.?)\s+/i);
    if (m) { keluarga = true; t = t.slice(m[0].length); }
    const kata = t.split(' ').filter(Boolean);
    while (kata.length > 1) {
      const k = kata[0].toLowerCase().replace(/[.,]/g, '');
      if (!sapa && /^(bapak|bpk|pak)\/(ibu|bu)$/.test(k)) { sapa = 'Bapak/Ibu'; kata.shift(); }
      else if (!sapa && TITEL[k]) { [sapa, jk] = TITEL[k]; kata.shift(); }
      else if (GELAR[k]) { gelar.push(GELAR[k]); kata.shift(); }
      else break;
    }
    const inti = titleCase(kata.join(' '));
    const tampil = [keluarga ? 'Keluarga' : '', sapa || '', ...gelar, inti].filter(Boolean).join(' ');
    return {keluarga, sapa, jk, gelar, inti, tampil: tampil || String(raw || '').trim()};
  }

  function waNorm(no) {
    let n = String(no || '').replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
    if (!n) return {wa: '', valid: false, alasan: 'kosong'};
    const plus = n.startsWith('+'); n = n.replace('+', '');
    if (n.startsWith('620')) n = '62' + n.slice(3);
    else if (n.startsWith('0')) n = '62' + n.slice(1);
    else if (n.startsWith('8')) n = '62' + n;
    if (n.startsWith('62')) {
      if (!/^628\d{8,11}$/.test(n)) return {wa: n, valid: false, alasan: n.startsWith('628') ? 'panjang nomor tidak wajar' : 'bukan nomor seluler'};
      return {wa: n, valid: true, alasan: ''};
    }
    if (/^\d{9,15}$/.test(n) && (plus || n.length >= 10)) return {wa: n, valid: true, alasan: 'nomor luar negeri'};
    return {wa: n, valid: false, alasan: 'format tidak dikenali'};
  }

  /* ---------- 3. KEMIRIPAN NAMA & PENDETEKSI DUPLIKAT ---------- */
  function lev(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length; if (!b.length) return a.length;
    let p = Array.from({length: b.length + 1}, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      const c = [i];
      for (let j = 1; j <= b.length; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      p = c;
    }
    return p[b.length];
  }
  const inti = nama => norm(parseNama(nama).inti);
  function mirip(a, b) {
    a = inti(a); b = inti(b);
    if (!a || !b) return 0;
    if (a === b) return 1;
    const ta = a.split(' '), tb = b.split(' ');
    const sa = ta.slice().sort().join(' '), sb = tb.slice().sort().join(' ');
    const r = 1 - lev(sa, sb) / Math.max(sa.length, sb.length);
    const A = new Set(ta), B = new Set(tb), irisan = [...A].filter(x => B.has(x)).length, kecil = Math.min(A.size, B.size);
    const isi = irisan === kecil ? (kecil >= 2 ? .92 : .8) : (irisan / kecil) * .7;
    return Math.max(r, isi);
  }

  function cariTamu(nama, tamu, ambang = .8) {
    const urut = tamu.map(t => ({t, skor: mirip(nama, t.nama)})).filter(x => x.skor >= ambang).sort((x, y) => y.skor - x.skor);
    if (!urut.length) return {tamu: null, kandidat: []};
    const jelas = urut.length === 1 || urut[0].skor - urut[1].skor >= .06;
    return {tamu: jelas ? urut[0].t : null, skor: urut[0].skor, kandidat: urut.slice(0, 4).map(x => x.t)};
  }

  function duplikat(tamu) {
    const hasil = [];
    for (let i = 0; i < tamu.length; i++) for (let j = i + 1; j < tamu.length; j++) {
      const a = tamu[i], b = tamu[j];
      const wa1 = waNorm(a.wa).wa, wa2 = waNorm(b.wa).wa;
      if (wa1 && wa1 === wa2) { hasil.push({a: a.id, b: b.id, alasan: 'nomor WhatsApp sama'}); continue; }
      const ia = inti(a.nama), ib = inti(b.nama);
      if (!ia || !ib || ia[0] !== ib[0] || Math.abs(ia.length - ib.length) > 6) continue;
      const s = mirip(a.nama, b.nama);
      if (s >= .86) hasil.push({a: a.id, b: b.id, alasan: `nama mirip (${Math.round(s * 100)}%)`});
    }
    return hasil;
  }

  /* ---------- 4. SUSUN MEJA OTOMATIS ---------- */
  // mode 'semua': susun ulang seluruh tamu. mode 'sisa': hanya tamu yang belum punya meja.
  function susunMeja(tamu, {kapasitas = 10, mode = 'semua', gabung = true} = {}) {
    const aktif = tamu.filter(t => t.rsvp !== 'tidak');
    const urutan = ['VIP', 'Keluarga'];
    const jumlah = ks => ks.reduce((s, t) => s + pax(t), 0);
    const meja = []; // {no, sisa, isi:[tamu], vip}
    const sisaMode = mode === 'sisa';
    if (sisaMode) {
      const peta = new Map();
      aktif.filter(t => String(t.meja || '').trim()).forEach(t => { const k = String(t.meja).trim(); (peta.get(k) || peta.set(k, []).get(k)).push(t); });
      peta.forEach((isi, no) => meja.push({no, isi: isi.slice(), sisa: kapasitas - jumlah(isi), tetap: true, vip: isi.some(t => kel(t) === 'VIP')}));
    }
    const baru = sisaMode ? aktif.filter(t => !String(t.meja || '').trim()) : aktif;
    const grup = new Map();
    baru.forEach(t => (grup.get(kel(t)) || grup.set(kel(t), []).get(kel(t))).push(t));
    const kunci = [...grup.keys()].sort((a, b) => {
      const ia = urutan.indexOf(a), ib = urutan.indexOf(b);
      if (ia >= 0 || ib >= 0) return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
      return jumlah(grup.get(b)) - jumlah(grup.get(a));
    });
    const nomorBaru = () => { const n = meja.map(m => parseInt(m.no, 10)).filter(Number.isFinite); return n.length ? Math.max(...n) + 1 : 1; };
    kunci.forEach(k => {
      const milik = meja.filter(m => !m.tetap || m.isi.some(t => kel(t) === k));
      grup.get(k).slice().sort((a, b) => pax(b) - pax(a)).forEach(t => {
        const perlu = pax(t);
        const cocokMeja = milik.filter(m => m.sisa >= perlu && (k === 'VIP') === !!m.vip).sort((a, b) => a.sisa - b.sisa)[0];
        if (cocokMeja) { cocokMeja.isi.push(t); cocokMeja.sisa -= perlu; return; }
        const m = {no: String(sisaMode ? nomorBaru() : meja.length + 1), isi: [t], sisa: kapasitas - perlu, vip: k === 'VIP'};
        meja.push(m); milik.push(m);
      });
    });
    if (gabung && !sisaMode) { // gabungkan meja yang terlalu kosong, kecuali meja VIP
      const isiMeja = m => kapasitas - m.sisa;
      meja.slice().sort((a, b) => isiMeja(a) - isiMeja(b)).forEach(kecil => {
        if (!meja.includes(kecil) || kecil.vip || isiMeja(kecil) > kapasitas * .5) return;
        const tujuan = meja.filter(m => m !== kecil && !m.vip && m.sisa >= isiMeja(kecil)).sort((a, b) => a.sisa - b.sisa)[0];
        if (tujuan) { tujuan.isi.push(...kecil.isi); tujuan.sisa -= isiMeja(kecil); meja.splice(meja.indexOf(kecil), 1); }
      });
      meja.forEach((m, i) => (m.no = String(i + 1)));
    }
    const peta = {};
    meja.forEach(m => m.isi.forEach(t => (peta[t.id] = m.no)));
    return {
      peta,
      meja: meja.map(m => ({no: m.no, vip: m.vip, kelompok: [...new Set(m.isi.map(kel))], terisi: kapasitas - m.sisa, kapasitas, lebih: m.sisa < 0, nama: m.isi.map(t => t.nama)})),
      kursiKosong: meja.reduce((s, m) => s + Math.max(0, m.sisa), 0)
    };
  }

  /* ---------- 5. PREDIKSI KEHADIRAN & KATERING ---------- */
  function prediksi(tamu, {walkin = .03, prior = 4} = {}) {
    const dasar = {Keluarga: .88, VIP: .8, Teman: .68, Kantor: .62, Lainnya: .65};
    const stat = {};
    tamu.forEach(t => { // belajar dari tamu yang sudah menjawab
      if (t.rsvp === 'hadir' || t.rsvp === 'tidak') { const s = stat[kel(t)] || (stat[kel(t)] = {y: 0, n: 0}); s[t.rsvp === 'hadir' ? 'y' : 'n']++; }
    });
    const pk = k => { const a = dasar[k] != null ? dasar[k] : .65, s = stat[k] || {y: 0, n: 0}; return (a * prior + s.y) / (prior + s.y + s.n); };
    let e = 0, v = 0, pasti = 0, belum = 0; const rinci = {};
    tamu.forEach(t => {
      const p = t.rsvp === 'hadir' ? .95 : t.rsvp === 'tidak' ? .02 : t.rsvp === 'ragu' ? .5 : pk(kel(t)), x = pax(t);
      e += p * x; v += p * (1 - p) * x * x;
      if (t.rsvp === 'hadir') pasti += x;
      if (!t.rsvp || t.rsvp === 'belum') belum++;
      const r = rinci[kel(t)] || (rinci[kel(t)] = {undangan: 0, harapan: 0, peluang: pk(kel(t))});
      r.undangan += x; r.harapan += p * x;
    });
    const sd = Math.sqrt(v), tambah = 1 + walkin;
    Object.values(rinci).forEach(r => (r.harapan = Math.round(r.harapan)));
    return {
      harapan: Math.round(e), rendah: Math.max(0, Math.round(e - 1.645 * sd)), tinggi: Math.ceil(e + 1.645 * sd),
      saranKatering: Math.ceil((e + 1.28 * sd) * tambah), saranKursi: Math.ceil((e + 1.645 * sd) * tambah),
      terkonfirmasi: pasti, belum, rinci, totalUndangan: tamu.reduce((s, t) => s + pax(t), 0)
    };
  }

  /* ---------- 6. ANGGARAN PINTAR ---------- */
  const POS = [['Katering & konsumsi', 40], ['Gedung / tempat', 15], ['Dekorasi & pelaminan', 10], ['Busana & rias', 8],
    ['Dokumentasi (foto & video)', 7], ['Hiburan & MC', 4], ['Undangan & souvenir', 4], ['Mahar & seserahan', 4],
    ['Transportasi & akomodasi', 2], ['Dana tak terduga', 6]];
  function rancangAnggaran(total, jumlahTamu = 0) {
    const bulat = x => Math.round(x / 50000) * 50000;
    const items = POS.map(([nama, p]) => ({nama, estimasi: bulat(total * p / 100)}));
    const catatan = [];
    const MIN_PORSI = 70000;
    if (jumlahTamu > 0) {
      const perlu = MIN_PORSI * jumlahTamu;
      if (items[0].estimasi < perlu) { // geser dari pos yang paling fleksibel
        let kurang = perlu - items[0].estimasi, geser = 0;
        [2, 5, 9].forEach(i => { const ambil = Math.min(kurang, Math.floor(items[i].estimasi * .4 / 50000) * 50000); items[i].estimasi -= ambil; kurang -= ambil; geser += ambil; });
        items[0].estimasi += geser;
        catatan.push(`Katering untuk ${jumlahTamu} tamu butuh sekitar ${rp(perlu)} (minimal ${rp(MIN_PORSI)}/porsi). Saya geser ${rp(geser)} dari dekorasi, hiburan, dan dana tak terduga.`);
        if (kurang > 0) catatan.push(`Masih kurang ${rp(kurang)}. Pertimbangkan mengurangi jumlah tamu atau menaikkan total anggaran.`);
      }
      catatan.push(`Katering ≈ ${rp(items[0].estimasi / jumlahTamu)} per tamu.`);
    }
    const selisih = total - items.reduce((s, i) => s + i.estimasi, 0);
    items[items.length - 1].estimasi += selisih; // sisa pembulatan masuk dana tak terduga
    return {items: items.map(i => ({...i, aktual: 0, lunas: false})), catatan};
  }

  /* ---------- 7. PESAN WHATSAPP PERSONAL ---------- */
  const SALAM = {
    islami: ['Assalamu’alaikum warahmatullahi wabarakatuh', 'Wassalamu’alaikum warahmatullahi wabarakatuh'],
    kristen: ['Salam sejahtera dalam kasih Kristus', 'Tuhan memberkati'], katolik: ['Salam damai sejahtera dalam Kristus', 'Tuhan memberkati'],
    hindu: ['Om Swastyastu', 'Om Shanti Shanti Shanti Om'], buddha: ['Namo Buddhaya', 'Semoga semua makhluk berbahagia'],
    batak: ['Horas!', 'Mauliate godang'], sunda: ['Sampurasun', 'Hatur nuhun'], jawa: ['Sugeng rawuh', 'Matur nuwun'], umum: ['Halo', 'Terima kasih']
  };
  SALAM.minang = SALAM.islami; SALAM.bali = SALAM.hindu;
  const pasangan = (id, sapa, santai) => (SALAM[id] && !santai ? SALAM[id] : SALAM.umum);

  function pesanWA(g, ctx, {gaya = 'auto', pengingat = false} = {}) {
    const p = parseNama(g.nama), santai = gaya === 'santai' || (gaya === 'auto' && (g.kelompok === 'Teman' || ['Mas', 'Mbak', 'Kak', 'Dik', 'Bro', 'Sis'].includes(p.sapa)));
    const [buka, tutup] = pasangan(ctx.tema, p.sapa, santai);
    const anda = p.sapa || (p.keluarga ? 'Bapak/Ibu sekeluarga' : 'Saudara/i');
    const w = new Date(ctx.tanggal);
    const hari = isNaN(w) ? '' : w.toLocaleDateString('id-ID', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'});
    const jam = isNaN(w) ? '' : w.toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'}).replace(':', '.') + ' ' + (ctx.zona || 'WIB');
    const lokasi = [ctx.tempat, ctx.alamat].filter(Boolean).join(', ');
    const rinci = [hari && `📅 ${hari}`, jam && `🕘 ${jam}`, lokasi && `📍 ${lokasi}`, g.meja && `🪑 Meja ${g.meja}`].filter(Boolean).join('\n');
    const nama = `${ctx.pria} & ${ctx.wanita}`;
    if (santai) {
      const sebut = p.inti.split(' ')[0];
      return pengingat
        ? `Hai ${sebut}! 👋 Cuma mau ngingetin, acara nikahan ${nama} tinggal sebentar lagi.\n\n${rinci}\n\nBelum sempat konfirmasi ya? Yuk isi di sini (30 detik aja): ${g.link}\n\n${tutup}!`
        : `Hai ${sebut}! 🥳 Akhirnya kami mau nikah!\n\n${rinci}\n\nIni undangan digitalnya, khusus buat kamu: ${g.link}\n\nDitunggu kehadirannya ya, jangan lupa konfirmasi lewat tautan itu. ${tutup}!`;
    }
    return pengingat
      ? `${buka}\n\nKepada Yth. ${p.tampil},\n\nKami ingin mengingatkan dengan hormat bahwa pernikahan ${nama} akan segera dilaksanakan.\n\n${rinci}\n\nBila ${anda} belum sempat memberi konfirmasi kehadiran, mohon berkenan melalui tautan berikut:\n${g.link}\n\n${tutup}.`
      : `${buka}\n\nKepada Yth. ${p.tampil},\n\nDengan penuh kebahagiaan, kami ${nama} mengundang ${anda} untuk hadir pada acara pernikahan kami:\n\n${rinci}\n\nUndangan digital khusus untuk ${p.tampil}:\n${g.link}\n\nMohon berkenan memberi konfirmasi kehadiran melalui tautan tersebut. Merupakan kehormatan bagi kami atas doa restu ${anda}.\n\n${tutup}.`;
  }

  /* ---------- 8. JADWAL PERSIAPAN OTOMATIS ---------- */
  const TUGAS = [
    [-240, 'Tetapkan total anggaran dan prioritas bersama keluarga'], [-210, 'Pilih tanggal dan pesan gedung / tempat'],
    [-180, 'Survei dan pilih vendor katering, dekorasi, dan dokumentasi'], [-150, 'Susun draf daftar tamu dari kedua keluarga'],
    [-120, 'Pilih busana, rias, dan cincin'], [-90, 'Pesan souvenir dan cetakan yang dibutuhkan'],
    [-75, 'Urus berkas pernikahan (KUA / Catatan Sipil / pemuka agama)'], [-60, 'Siapkan undangan digital dan finalkan daftar tamu'],
    [-45, 'Sebar undangan gelombang 1: keluarga besar dan tamu VIP'], [-30, 'Sebar undangan gelombang 2: teman dan kolega; fitting busana'],
    [-21, 'Konfirmasi ulang semua vendor; cicip menu katering'], [-14, 'Kirim pengingat RSVP ke tamu yang belum menjawab'],
    [-10, 'Finalkan susunan meja dan rundown acara'], [-7, 'Kirim jumlah final tamu ke katering; gladi bersih'],
    [-3, 'Siapkan amplop, souvenir, doorprize; uji coba pemindai QR check-in'], [-1, 'Istirahat cukup; siapkan dokumen dan perlengkapan hari H'],
    [0, 'Hari H: check-in tamu, dokumentasi, catat hadiah'], [3, 'Kirim ucapan terima kasih kepada tamu dan vendor'], [7, 'Lunasi vendor; rekap amplop dan hadiah']
  ];
  function jadwalTugas(hariH, sekarang = new Date()) {
    const hari = 864e5, h0 = new Date(hariH); h0.setHours(0, 0, 0, 0);
    const s0 = new Date(sekarang); s0.setHours(0, 0, 0, 0);
    const sisa = Math.round((h0 - s0) / hari);
    const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const telat = TUGAS.filter(([o]) => o < 0 && sisa + o < 0);
    // tugas lewat tenggat disebar merata dari hari ini sampai tenggat tugas normal pertama (urutan tetap terjaga)
    const normal = TUGAS.map(([o]) => o).filter(o => o <= 0 && sisa + o >= 0);
    const rentang = normal.length ? sisa + Math.min(...normal) : 0;
    let i = 0;
    return TUGAS.map(([o, teks]) => {
      let due = new Date(h0.getTime() + o * hari), dipadatkan = false;
      if (o < 0 && sisa + o < 0) {
        due = new Date(s0.getTime() + Math.round(i++ * rentang / Math.max(1, telat.length)) * hari);
        dipadatkan = true;
      }
      return {teks, due: iso(due), dipadatkan};
    });
  }

  /* ---------- 9. IMPOR BALASAN WHATSAPP ---------- */
  const ANGKA = {berdua: 2, bertiga: 3, berempat: 4, berlima: 5, beramai: 0};
  function bacaBalasan(teks, tamu) {
    const TS = /^\[?\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4},?\s+\d{1,2}[.:]\d{2}(?:[.:]\d{2})?(?:\s?[AaPp]\.?[Mm]\.?)?\]?\s*(?:-\s*)?/;
    const baris = String(teks || '').replace(/\r/g, '').split('\n');
    const pesan = [];
    if (baris.some(b => TS.test(b))) {
      baris.forEach(b => {
        if (TS.test(b)) { const isi = b.replace(TS, ''), m = isi.match(/^([^:]{1,40}):\s*(.*)$/); pesan.push({pengirim: m ? m[1].trim() : '', isi: m ? m[2] : isi}); }
        else if (pesan.length) pesan[pesan.length - 1].isi += '\n' + b;
      });
    } else {
      const blok = /halo,? saya/i.test(teks) ? String(teks).split(/\n(?=\s*halo,? saya)/i) : String(teks).split(/\n\s*\n/);
      blok.forEach(b => b.trim() && pesan.push({pengirim: '', isi: b.trim()}));
    }
    return pesan.map(m => {
      const isi = m.isi.trim(), n = norm(isi);
      let status = null;
      const k = isi.match(/konfirmasi:\s*(hadir|tidak hadir|masih ragu)/i);
      if (k) status = {hadir: 'hadir', 'tidak hadir': 'tidak', 'masih ragu': 'ragu'}[k[1].toLowerCase()];
      else if (/\b(tidak|belum|gak|ga|nggak|enggak)\b.{0,12}\b(bisa|dapat)?\s*hadir|berhalangan|tidak bisa datang|maaf.{0,20}(tidak|belum)|absen/.test(n)) status = 'tidak';
      else if (/\bragu\b|belum pasti|usahakan|semoga bisa|mudah mudahan|mudah-mudahan|lihat nanti|insya ?allah (?:usahakan|semoga)/.test(n)) status = 'ragu';
      else if (/\bhadir\b|\bdatang\b|pasti ikut|siap hadir|\bikut\b|insya ?allah bisa/.test(n)) status = 'hadir';
      if (!status) return null;
      const nm = isi.match(/\bsaya\s+([^.\n,!]+?)(?:\s+(?:konfirmasi|ingin|akan|insya\w*|mau|hadir|tidak|belum)\b|[.\n,!]|$)/i);
      const nama = (nm ? nm[1] : m.pengirim).trim();
      if (!nama) return null;
      let jml = (isi.match(/(\d{1,2})\s*(?:orang|org|pax|tamu)\b/i) || [])[1];
      if (!jml) { const kata = Object.keys(ANGKA).find(a => n.includes(a)); jml = kata ? ANGKA[kata] : 0; }
      const doa = isi.replace(/^.*?konfirmasi:\s*(?:hadir|tidak hadir|masih ragu)\.?\s*/is, '').replace(/^halo,? saya[^\n]*\n?/i, '').trim();
      const cari = cariTamu(nama, tamu);
      return {nama, pengirim: m.pengirim, status, pax: +jml || 0, doa: k ? doa : '', tamuId: cari.tamu ? cari.tamu.id : null, skor: cari.skor || 0, kandidat: cari.kandidat.map(t => t.id)};
    }).filter(Boolean);
  }

  /* ---------- 10. STATISTIK, RADAR KESIAPAN, TANYA ASISTEN ---------- */
  function statistik(tamu) {
    const s = {tamu: tamu.length, pax: 0, hadir: 0, tidak: 0, ragu: 0, belum: 0, paxHadir: 0, checkin: 0, paxCheckin: 0, tanpaWA: 0, tanpaMeja: 0};
    tamu.forEach(t => {
      const p = pax(t); s.pax += p;
      const r = ['hadir', 'tidak', 'ragu'].includes(t.rsvp) ? t.rsvp : 'belum'; s[r]++;
      if (r === 'hadir') s.paxHadir += p;
      if (t.checkin) { s.checkin++; s.paxCheckin += p; }
      if (!waNorm(t.wa).valid) s.tanpaWA++;
      if (!String(t.meja || '').trim() && r !== 'tidak') s.tanpaMeja++;
    });
    return s;
  }

  function radar(S, sekarang = new Date(), hariH) {
    const temuan = [], tamu = S.tamu || [];
    const sisa = hariH ? Math.ceil((new Date(hariH) - sekarang) / 864e5) : null;
    const dekat = sisa != null && sisa <= 21, sangat = sisa != null && sisa <= 7;
    const st = statistik(tamu);
    let skor = 100;
    const add = (tingkat, teks, aksi, kena) => { temuan.push({tingkat, teks, aksi}); skor -= kena; };
    if (sisa != null && sisa < 0) temuan.push({tingkat: 'info', teks: `Acara sudah lewat ${-sisa} hari. Fokus ke rekap hadiah dan ucapan terima kasih.`, aksi: 'harih'});
    if (!tamu.length) add(sisa != null && sisa < 60 ? 'tinggi' : 'sedang', 'Daftar tamu masih kosong.', 'tamu', 20);
    else {
      if (st.tanpaWA) add(st.tanpaWA > tamu.length * .3 ? 'sedang' : 'info', `${st.tanpaWA} tamu belum punya nomor WhatsApp yang valid, jadi tidak bisa dikirimi undangan langsung.`, 'tamu', Math.min(10, st.tanpaWA));
      const dup = duplikat(tamu).length;
      if (dup) add('sedang', `${dup} pasangan tamu terindikasi ganda. Periksa agar katering dan souvenir tidak dobel.`, 'tamu', Math.min(8, dup * 2));
      const belumPersen = st.belum / tamu.length;
      if (dekat && belumPersen > .3) add(sangat ? 'tinggi' : 'sedang', `${st.belum} tamu (${Math.round(belumPersen * 100)}%) belum menjawab RSVP padahal acara ${sisa} hari lagi. Kirim pengingat.`, 'tamu', sangat ? 14 : 8);
      if (st.ragu && sangat) add('sedang', `${st.ragu} tamu masih ragu-ragu. Hubungi langsung untuk kepastian.`, 'tamu', 4);
      if (sisa != null && sisa <= 14 && st.tanpaMeja) add(sisa <= 7 ? 'tinggi' : 'sedang', `${st.tanpaMeja} tamu belum punya nomor meja. Gunakan “Susun meja otomatis”.`, 'tamu', sisa <= 7 ? 10 : 5);
      const kap = (S.atur && S.atur.kapasitas) || 10, per = {};
      tamu.filter(t => t.rsvp !== 'tidak' && String(t.meja || '').trim()).forEach(t => { per[t.meja] = (per[t.meja] || 0) + pax(t); });
      const penuh = Object.entries(per).filter(([, n]) => n > kap);
      if (penuh.length) add('sedang', `Meja ${penuh.map(([m]) => m).slice(0, 4).join(', ')} melebihi kapasitas ${kap} kursi.`, 'tamu', 5);
      const pr = prediksi(tamu);
      const pesan = S.atur && S.atur.katering;
      if (pesan) {
        if (pesan < pr.saranKatering * .9) add('tinggi', `Katering ${pesan} porsi kemungkinan kurang. Prediksi tamu hadir ${pr.harapan} (disarankan ${pr.saranKatering} porsi).`, 'harih', 12);
        else if (pesan > pr.saranKatering * 1.35) add('info', `Katering ${pesan} porsi terlalu longgar. Prediksi ${pr.harapan} hadir; ${pr.saranKatering} porsi sudah cukup aman. Potensi hemat.`, 'harih', 0);
      } else if (dekat) add('sedang', `Jumlah porsi katering belum dicatat. Berdasarkan RSVP, disarankan ${pr.saranKatering} porsi.`, 'harih', 5);
      const sv = S.souvenir || {};
      if (sv.stok && sv.stok < pr.saranKursi) add('info', `Stok souvenir ${sv.stok} mungkin kurang dari perkiraan puncak ${pr.saranKursi} orang.`, 'harih', 0);
    }
    const A = S.anggaran || {items: []}, est = A.items.reduce((s, i) => s + (+i.estimasi || 0), 0), akt = A.items.reduce((s, i) => s + (+i.aktual || 0), 0);
    if (!A.total && !est) add(sisa != null && sisa < 120 ? 'sedang' : 'info', 'Anggaran belum disusun. Masukkan total dan biarkan asisten membagi pos-posnya.', 'planner', 8);
    else {
      const total = A.total || est;
      if (est > total * 1.02) add('tinggi', `Total estimasi pos (${rp(est)}) melebihi anggaran (${rp(total)}) sebesar ${rp(est - total)}.`, 'planner', 10);
      const bengkak = A.items.filter(i => i.estimasi && i.aktual > i.estimasi * 1.1);
      if (bengkak.length) add('sedang', `Pengeluaran melebihi estimasi di: ${bengkak.map(i => i.nama).slice(0, 3).join(', ')}.`, 'planner', 5);
      if (akt > total) add('tinggi', `Pengeluaran aktual (${rp(akt)}) sudah melampaui anggaran.`, 'planner', 10);
      const belumLunas = A.items.filter(i => i.estimasi && !i.lunas);
      if (sangat && belumLunas.length) add('sedang', `${belumLunas.length} pos belum ditandai lunas menjelang hari H.`, 'planner', 4);
    }
    const tg = S.tugas || [], today = new Date(sekarang).toISOString().slice(0, 10);
    if (!tg.length) add('info', 'Belum ada daftar tugas. Buat jadwal persiapan otomatis dari tanggal acara.', 'planner', 4);
    else {
      const telat = tg.filter(t => !t.selesai && t.due && t.due < today);
      if (telat.length) add(telat.length > 3 ? 'tinggi' : 'sedang', `${telat.length} tugas lewat tenggat, mulai dari “${telat[0].teks}”.`, 'planner', Math.min(12, telat.length * 3));
    }
    const urut = {tinggi: 0, sedang: 1, info: 2};
    temuan.sort((a, b) => urut[a.tingkat] - urut[b.tingkat]);
    skor = Math.max(0, Math.min(100, skor));
    return {skor, label: skor >= 85 ? 'Siap' : skor >= 65 ? 'Cukup siap' : skor >= 40 ? 'Perlu perhatian' : 'Mendesak', temuan, sisa};
  }

  function tanya(q, S, sekarang = new Date(), hariH) {
    const n = norm(q), tamu = S.tamu || [], st = statistik(tamu);
    const daftar = arr => arr.map(t => `${t.nama}${t.meja ? ' (meja ' + t.meja + ')' : ''}`);
    const ada = (...k) => k.some(x => new RegExp('\\b' + x).test(n));
    const jml = (arr, pk) => `${arr.length} undangan${pk ? ' (' + arr.reduce((s, t) => s + pax(t), 0) + ' orang)' : ''}`;
    const jawab = (teks, list) => ({teks, daftar: list || []});
    if (!n) return jawab('Tanyakan sesuatu, misalnya “siapa yang belum konfirmasi?”.');
    if (ada('bantuan', 'bisa apa', 'help')) return jawab('Saya bisa menjawab: jumlah tamu, siapa yang belum konfirmasi / hadir / tidak hadir / ragu, siapa yang sudah atau belum check-in, isi meja tertentu, mencari tamu, anggaran, katering, tugas, hari tersisa, hadiah, dan ringkasan kesiapan.');
    const mMeja = n.match(/\bmeja\s+(\d+[a-z]?)\b/);
    if (mMeja) {
      const isi = tamu.filter(t => norm(t.meja) === mMeja[1]);
      return isi.length ? jawab(`Meja ${mMeja[1]} berisi ${jml(isi, true)}:`, daftar(isi)) : jawab(`Belum ada tamu di meja ${mMeja[1]}.`);
    }
    if (/\bbelum hadir\b/.test(n)) { // sebelum acara = belum RSVP, saat acara berlangsung = belum check-in
      const lagi = tamu.some(t => t.checkin);
      const x = lagi ? tamu.filter(t => !t.checkin && t.rsvp !== 'tidak') : tamu.filter(t => !t.rsvp || t.rsvp === 'belum');
      return jawab(`${jml(x, true)} ${lagi ? 'belum check-in' : 'belum menjawab RSVP'}:`, daftar(x));
    }
    if (ada('belum') && ada('check in', 'checkin', 'datang', 'tiba', 'masuk')) { const x = tamu.filter(t => !t.checkin && t.rsvp !== 'tidak'); return jawab(`${jml(x, true)} belum check-in:`, daftar(x)); }
    if (ada('sudah') && ada('check in', 'checkin', 'datang', 'tiba', 'masuk', 'hadir')) { const x = tamu.filter(t => t.checkin); return jawab(`${jml(x, true)} sudah check-in:`, daftar(x)); }
    if (ada('belum') && ada('konfirmasi', 'balas', 'rsvp', 'jawab', 'respon', 'menjawab')) { const x = tamu.filter(t => !t.rsvp || t.rsvp === 'belum'); return jawab(`${jml(x, true)} belum menjawab RSVP:`, daftar(x)); }
    if (ada('tidak hadir', 'absen', 'batal', 'menolak', 'berhalangan')) { const x = tamu.filter(t => t.rsvp === 'tidak'); return jawab(`${jml(x, true)} tidak hadir:`, daftar(x)); }
    if (ada('ragu')) { const x = tamu.filter(t => t.rsvp === 'ragu'); return jawab(`${jml(x, true)} masih ragu:`, daftar(x)); }
    if (ada('siapa') && ada('hadir', 'konfirmasi', 'datang')) { const x = tamu.filter(t => t.rsvp === 'hadir'); return jawab(`${jml(x, true)} akan hadir:`, daftar(x)); }
    if (ada('tanpa wa', 'nomor wa', 'belum punya nomor', 'tanpa nomor', 'nomor kosong')) { const x = tamu.filter(t => !waNorm(t.wa).valid); return jawab(`${x.length} tamu tanpa nomor WA yang valid:`, daftar(x)); }
    if (ada('tanpa meja', 'belum punya meja', 'belum dapat meja', 'belum ada meja')) { const x = tamu.filter(t => !String(t.meja || '').trim() && t.rsvp !== 'tidak'); return jawab(`${x.length} tamu belum punya meja:`, daftar(x)); }
    if (ada('katering', 'porsi', 'konsumsi', 'prediksi', 'perkiraan', 'estimasi tamu')) {
      if (!tamu.length) return jawab('Belum ada data tamu untuk membuat prediksi.');
      const p = prediksi(tamu);
      return jawab(`Perkiraan tamu hadir ${p.harapan} orang (rentang ${p.rendah}–${p.tinggi}). Sudah pasti hadir ${p.terkonfirmasi} orang. Saran katering ${p.saranKatering} porsi, siapkan ${p.saranKursi} kursi untuk skenario ramai.`);
    }
    if (ada('anggaran', 'biaya', 'dana', 'budget', 'pengeluaran', 'sisa uang')) {
      const A = S.anggaran || {items: []}, est = A.items.reduce((s, i) => s + (+i.estimasi || 0), 0), akt = A.items.reduce((s, i) => s + (+i.aktual || 0), 0), total = A.total || est;
      if (!total) return jawab('Anggaran belum diisi. Buka tab Planner.');
      return jawab(`Anggaran ${rp(total)}. Estimasi pos ${rp(est)}, sudah dibayar/terpakai ${rp(akt)}, sisa dari anggaran ${rp(total - akt)}.`);
    }
    if (ada('tugas', 'todo', 'persiapan', 'dikerjakan', 'to do')) {
      const tg = (S.tugas || []).filter(t => !t.selesai).sort((a, b) => String(a.due).localeCompare(String(b.due)));
      return tg.length ? jawab(`${tg.length} tugas belum selesai. Yang terdekat:`, tg.slice(0, 5).map(t => `${t.due || 'tanpa tanggal'}: ${t.teks}`)) : jawab('Semua tugas sudah selesai, atau daftar tugas belum dibuat.');
    }
    if (ada('hari lagi', 'hitung mundur', 'kapan', 'tinggal berapa')) {
      if (!hariH) return jawab('Tanggal acara belum diisi.');
      const sisa = Math.ceil((new Date(hariH) - sekarang) / 864e5);
      return jawab(sisa > 0 ? `Acara tinggal ${sisa} hari lagi.` : sisa === 0 ? 'Acara berlangsung hari ini!' : `Acara sudah lewat ${-sisa} hari.`);
    }
    if (ada('hadiah', 'amplop', 'sumbangan', 'kado')) { const h = S.hadiah || [], tot = h.reduce((s, x) => s + (+x.nilai || 0), 0); return jawab(`${h.length} hadiah tercatat dengan total nilai ${rp(tot)}.`); }
    if (ada('ringkas', 'ringkasan', 'status', 'siap', 'kesiapan', 'kondisi')) {
      const r = radar(S, sekarang, hariH);
      return jawab(`Skor kesiapan ${r.skor}/100 (${r.label}). ${r.temuan.length ? 'Yang perlu diperhatikan:' : 'Tidak ada temuan.'}`, r.temuan.slice(0, 5).map(t => t.teks));
    }
    if (ada('berapa', 'jumlah', 'total') && ada('tamu', 'undangan', 'orang')) {
      return jawab(`${st.tamu} undangan (${st.pax} orang). Hadir ${st.hadir} · tidak hadir ${st.tidak} · ragu ${st.ragu} · belum menjawab ${st.belum}. Sudah check-in ${st.checkin}.`);
    }
    const nama = n.replace(/\b(cari|siapa|dimana|di mana|meja|tamu|nomor|wa|whatsapp|itu|nya|yang|apakah|sudah|belum|hadir|konfirmasi|check in|checkin|rsvp|status|apa|bapak|ibu|pak|bu)\b/g, ' ').replace(/\s+/g, ' ').trim();
    if (nama.length >= 2) {
      const hit = tamu.filter(t => norm(t.nama).includes(nama) || mirip(nama, t.nama) >= .8);
      if (hit.length) return jawab(`Ditemukan ${hit.length} tamu:`, hit.slice(0, 8).map(t => `${t.nama} · ${({hadir: 'hadir', tidak: 'tidak hadir', ragu: 'ragu', belum: 'belum menjawab'})[t.rsvp || 'belum']}${t.meja ? ' · meja ' + t.meja : ''}${t.checkin ? ' · sudah check-in' : ''}`));
    }
    return jawab('Maaf, saya belum paham pertanyaan itu. Ketik “bantuan” untuk melihat contoh pertanyaan.');
  }

  /* ---------- 11a. TEBAKAN CERDAS DARI NAMA ---------- */
  function tebakKelompok(nama) {
    const n = norm(nama);
    if (/^(keluarga|kel|family|fam)\b/.test(n)) return 'Keluarga';
    if (/\b(pt|cv|kantor|tim|divisi|dept|departemen|bank|rekan|kolega)\b/.test(n)) return 'Kantor';
    return 'Lainnya';
  }
  function tebakPax(nama) {
    const n = String(nama || '').toLowerCase();
    if (/^(keluarga|kel\.?|family|fam\.?)\s/.test(n)) return 3;
    if (/(&|\bdan\b|\+)\s*(istri|suami|pasangan|partner|keluarga|anak)/.test(n) || /\+\s*1\b/.test(n)) return 2;
    return 1;
  }

  /* ---------- 11. PEMERIKSA FORM UNDANGAN ---------- */
  function periksaForm(d) {
    const m = [];
    const tgl = d.tanggal ? new Date(d.tanggal) : null;
    if (tgl && !isNaN(tgl) && tgl < new Date()) m.push({t: 'sedang', s: 'Tanggal akad sudah lewat. Pastikan tahun dan tanggalnya benar.'});
    if (d.resepsi && d.tanggal && new Date(d.resepsi) < new Date(d.tanggal)) m.push({t: 'sedang', s: 'Jam resepsi lebih awal dari akad. Kosongkan jika ingin otomatis 2 jam setelah akad.'});
    if (d.wa && !waNorm(d.wa).valid) m.push({t: 'tinggi', s: `Nomor WhatsApp RSVP tampak tidak valid (${waNorm(d.wa).alasan}). Gunakan format 62812…`});
    if (d.warna && !/^#?[0-9a-f]{6}$/i.test(d.warna)) m.push({t: 'sedang', s: 'Warna aksen harus berupa kode hex 6 digit, misalnya #c8a24a.'});
    if (d.bank && !d.norek) m.push({t: 'sedang', s: 'Nama bank diisi tetapi nomor rekening kosong, jadi kartu amplop digital tidak akan muncul.'});
    if (d.norek && !d.bank) m.push({t: 'sedang', s: 'Nomor rekening diisi tetapi nama bank kosong, jadi kartu amplop digital tidak akan muncul.'});
    if (d.norek && !/^\d{6,20}$/.test(d.norek.replace(/[\s-]/g, ''))) m.push({t: 'sedang', s: 'Nomor rekening sebaiknya hanya berisi angka.'});
    if (d.maps && !/^https?:\/\//.test(d.maps)) m.push({t: 'sedang', s: 'Tautan Google Maps harus diawali https://'});
    if (d.cerita) {
      const salah = d.cerita.split(';').filter(x => x.trim() && x.split('|').length < 2);
      if (salah.length) m.push({t: 'sedang', s: 'Kisah cinta: setiap bagian harus berformat tahun|judul|cerita, dipisah titik koma.'});
    }
    if (d.galeri && d.galeri.split(',').some(x => x.trim() && !/^https?:\/\//.test(x.trim()))) m.push({t: 'info', s: 'Ada tautan galeri yang tidak diawali https:// dan akan diabaikan.'});
    if (d.t === 'islami' || d.t === 'minang') m.push({t: 'info', s: 'Tema ini menampilkan tanggal Hijriah otomatis dari tanggal akad.'});
    if (d.t === 'jawa') m.push({t: 'info', s: 'Tema ini menampilkan hari pasaran Jawa otomatis dari tanggal akad.'});
    if (d.t === 'tionghoa') m.push({t: 'info', s: 'Tema ini menampilkan penanggalan Imlek otomatis dari tanggal akad.'});
    return m;
  }

  return {rp, norm, esc, rekomendasiTemplate, parseNama, titleCase, waNorm, mirip, cariTamu, duplikat, susunMeja, prediksi, rancangAnggaran,
    pesanWA, jadwalTugas, bacaBalasan, statistik, radar, tanya, periksaForm, tebakKelompok, tebakPax, POS};
})();
if (typeof module !== 'undefined') module.exports = Cerdas;
