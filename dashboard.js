/* Dashboard tamu. Bergantung pada: data.js, penyimpanan.js, smart.js
   Semua data tersimpan di browser (localStorage). Tidak ada server. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = Cerdas.esc, rp = Cerdas.rp, uid = Simpan.uid;
  let S = Simpan.state;

  const KEL = ['Keluarga', 'Teman', 'Kantor', 'VIP', 'Lainnya'];
  const RSVP = [['belum', 'Belum menjawab'], ['hadir', 'Hadir'], ['ragu', 'Masih ragu'], ['tidak', 'Tidak hadir']];
  const ACARA = [['', 'Semua acara'], ['akad', 'Akad saja'], ['resepsi', 'Resepsi saja']];
  const ZON = {WIB: '+07:00', WITA: '+08:00', WIT: '+09:00'};
  const opsi = (arr, pilih) => arr.map(x => { const [v, l] = Array.isArray(x) ? x : [x, x]; return `<option value="${esc(v)}"${String(v) === String(pilih) ? ' selected' : ''}>${esc(l)}</option>`; }).join('');

  const toast = t => { const el = $('#toast'); el.textContent = t; el.classList.add('tampil'); clearTimeout(toast.h); toast.h = setTimeout(() => el.classList.remove('tampil'), 3400); };
  const simpan = () => { if (!Simpan.save()) toast('Penyimpanan browser penuh atau diblokir. Segera unduh cadangan di tab Data.'); };
  const salin = async t => { try { await navigator.clipboard.writeText(t); return true; } catch (e) { return false; } };
  const unduh = (nama, isi, tipe) => { const a = Object.assign(document.createElement('a'), {href: URL.createObjectURL(new Blob([isi], {type: tipe})), download: nama}); a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };
  const cari = id => S.tamu.find(g => g.id === id);
  const jamStr = iso => new Date(iso).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'}).replace(':', '.');
  const pax = g => Math.max(1, parseInt(g.pax, 10) || 1);

  /* ---------- Data undangan & tautan ---------- */
  const D = () => ({...DEFAULT_DATA, ...S.data});
  const hariH = () => new Date(String(D().tanggal).slice(0, 16) + ':00' + (ZON[D().zona] || ZON.WIB));
  const sisaHari = () => Math.ceil((hariH() - Date.now()) / 864e5);
  const ctxPesan = () => { const d = D(); return {tema: d.t, pria: d.pria, wanita: d.wanita, tanggal: d.tanggal, zona: d.zona, tempat: d.tempat, alamat: d.alamat}; };
  const BASE = new URL('undangan.html', location.href);
  function tautan(g) {
    const u = new URL(BASE);
    Object.entries(D()).forEach(([k, v]) => { v = String(v == null ? '' : v).trim(); if (k !== 'to' && v !== String(DEFAULT_DATA[k] == null ? '' : DEFAULT_DATA[k])) u.searchParams.set(k, v); });
    u.searchParams.set('to', Cerdas.parseNama(g.nama).tampil);
    if (g.meja) u.searchParams.set('meja', g.meja);
    if (g.acara) u.searchParams.set('acara', g.acara);
    return u.href;
  }

  /* ---------- Kerangka: tab, header ---------- */
  const TABS = [['ringkas', 'Ringkasan'], ['tamu', 'Tamu'], ['checkin', 'Check-in'], ['planner', 'Planner'], ['harih', 'Hari H'], ['data', 'Data']];
  let tab = TABS.some(t => t[0] === location.hash.slice(1)) ? location.hash.slice(1) : 'ringkas';

  function segarHeader() {
    const d = D(), s = sisaHari();
    $('#judul').textContent = `${d.pria} & ${d.wanita}`;
    $('#subjudul').textContent = `${hariH().toLocaleDateString('id-ID', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'})} · ${d.tempat}`;
    $('#hmin').innerHTML = s > 0 ? `H-${s}<small>menuju acara</small>` : s === 0 ? 'Hari H<small>hari ini</small>' : `H+${-s}<small>setelah acara</small>`;
  }
  function pindah(t) {
    if (t !== 'checkin') hentiKamera();
    tab = t; history.replaceState(null, '', '#' + t); render(); $('#panel').scrollIntoView({block: 'start'});
  }
  function render() {
    segarHeader();
    $('#tabs').innerHTML = TABS.map(([k, l]) => `<button role="tab" id="tab-${k}" data-aksi="pergi" data-tab="${k}" aria-selected="${k === tab}" aria-controls="panel">${l}</button>`).join('');
    const p = $('#panel'); p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', 'tab-' + tab);
    p.innerHTML = VIEW[tab]();
    (AFTER[tab] || (() => {}))();
  }

  /* ============================================================
     TAB RINGKASAN
     ============================================================ */
  const CONTOH = ['Siapa yang belum konfirmasi?', 'Berapa jumlah tamu?', 'Berapa porsi katering yang disarankan?', 'Ringkasan kesiapan', 'Tugas apa yang harus dikerjakan?', 'Berapa hari lagi?'];
  function vRingkas() {
    const st = Cerdas.statistik(S.tamu), rd = Cerdas.radar(S, new Date(), hariH());
    const warna = rd.skor >= 85 ? 'var(--k-ok)' : rd.skor >= 65 ? '#8a9a1b' : rd.skor >= 40 ? 'var(--k-warn)' : 'var(--k-bad)';
    const K = 2 * Math.PI * 52, ikon = {tinggi: '🔴', sedang: '🟠', info: '🔵'};
    const kosong = !S.tamu.length ? `<div class="catatan"><b>Dashboard masih kosong.</b> Ingin melihat cara kerjanya dengan data lengkap?<br>
      <button class="btn kecil" data-aksi="contoh-muat" data-mode="persiapan">Isi dengan data contoh (2 bulan sebelum acara)</button>
      <button class="btn kecil ghost" data-aksi="contoh-muat" data-mode="harih">Isi dengan data contoh (hari H)</button></div>` : '';
    return `${kosong}${Object.keys(S.data).length ? '' : '<div class="catatan">Data undangan belum diisi, jadi tautan tamu memakai contoh bawaan (Raka &amp; Sinta). <a href="index.html#editor">Isi data undangan dulu</a>.</div>'}
    <section class="stat" aria-label="Statistik tamu">
      <div><b>${st.tamu}</b><span>undangan · ${st.pax} orang</span></div>
      <div><b>${st.hadir}</b><span>hadir · ${st.paxHadir} orang</span></div>
      <div><b>${st.belum}</b><span>belum menjawab</span></div>
      <div><b>${st.ragu + st.tidak}</b><span>ragu / tidak hadir</span></div>
      <div><b>${st.checkin}</b><span>sudah check-in · ${st.paxCheckin} orang</span></div>
    </section>
    <section class="card" aria-labelledby="h-radar"><h2 id="h-radar">Radar kesiapan acara</h2>
      <div class="radar">
        <div class="cincin" role="img" aria-label="Skor kesiapan ${rd.skor} dari 100">
          <svg width="130" height="130" viewBox="0 0 130 130"><circle cx="65" cy="65" r="52" fill="none" stroke="#efe8d8" stroke-width="12"/><circle cx="65" cy="65" r="52" fill="none" stroke="${warna}" stroke-width="12" stroke-linecap="round" stroke-dasharray="${(K * rd.skor / 100).toFixed(1)} ${K.toFixed(1)}"/></svg>
          <div><b>${rd.skor}</b><small>${rd.label}</small></div>
        </div>
        <ul class="temuan">${rd.temuan.length ? rd.temuan.map(t => `<li class="${t.tingkat}"><span>${ikon[t.tingkat]} ${esc(t.teks)}</span><button class="btn kecil ghost" data-aksi="pergi" data-tab="${t.aksi}">Buka</button></li>`).join('') : '<li class="info"><span>✅ Tidak ada temuan. Semua terpantau aman.</span></li>'}</ul>
      </div>
      <p class="mut">Radar membaca data tamu, anggaran, tugas, dan jarak ke hari H, lalu menandai hal yang berisiko. Semuanya dihitung di perangkat ini.</p>
    </section>
    <section class="card" aria-labelledby="h-tanya"><h2 id="h-tanya">Tanya asisten</h2>
      <form class="tanya" data-form="tanya"><input id="q" aria-label="Pertanyaan" placeholder="Misalnya: siapa yang belum konfirmasi?" autocomplete="off"><button class="btn">Tanya</button></form>
      <div class="contoh">${CONTOH.map(c => `<button type="button" data-aksi="contoh" data-q="${esc(c)}">${esc(c)}</button>`).join('')}</div>
      <div id="jawab" aria-live="polite"></div>
      <p class="mut">Asisten ini memahami pertanyaan bahasa Indonesia tentang data Anda sendiri; bukan AI online. Ketik “bantuan” untuk daftar kemampuannya.</p>
    </section>`;
  }
  function tampilJawab(q) {
    const r = Cerdas.tanya(q, S, new Date(), hariH());
    $('#jawab').innerHTML = `<div class="jawab"><p><b>${esc(q)}</b></p><p>${esc(r.teks)}</p>${r.daftar.length ? `<ul>${r.daftar.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</div>`;
  }

  /* ============================================================
     TAB TAMU
     ============================================================ */
  let saring = 'semua', cariTeks = '', batas = 100, usulan = [], rencana = null;
  const FILT = {
    semua: () => true, belum: g => !g.rsvp || g.rsvp === 'belum', hadir: g => g.rsvp === 'hadir', tidak: g => g.rsvp === 'tidak', ragu: g => g.rsvp === 'ragu',
    tanpameja: g => !String(g.meja || '').trim() && g.rsvp !== 'tidak', tanpawa: g => !Cerdas.waNorm(g.wa).valid,
    checkin: g => !!g.checkin, belumcheckin: g => !g.checkin && g.rsvp !== 'tidak'
  };
  const FILT_LABEL = [['semua', 'Semua tamu'], ['belum', 'Belum menjawab'], ['hadir', 'Hadir'], ['ragu', 'Masih ragu'], ['tidak', 'Tidak hadir'], ['tanpameja', 'Belum punya meja'], ['tanpawa', 'WA kosong / tidak valid'], ['checkin', 'Sudah check-in'], ['belumcheckin', 'Belum check-in']];

  function vTamu() {
    return `<section class="card" aria-labelledby="h-tamu"><h2 id="h-tamu">Daftar tamu</h2>
      <div class="bar">
        <input id="cari" type="search" placeholder="Cari nama atau nomor meja…" aria-label="Cari tamu" value="${esc(cariTeks)}">
        <select id="saring" aria-label="Saring tamu">${opsi(FILT_LABEL, saring)}</select>
        <button class="btn kecil" data-aksi="tambah-toggle">+ Tambah tamu</button>
        <button class="btn kecil ghost" data-aksi="ekspor-csv">Ekspor CSV</button>
      </div>
      <form class="grid-form" id="f-tambah" data-form="tambah" hidden>
        <label>Nama<input name="nama" required placeholder="pak budi santoso"></label>
        <label>WhatsApp<input name="wa" inputmode="tel" placeholder="0812…"></label>
        <label>Kelompok<select name="kelompok"><option value="">Otomatis</option>${opsi(KEL)}</select></label>
        <label>Jumlah orang<input name="pax" type="number" min="1" max="20" placeholder="Otomatis"></label>
        <label>Meja<input name="meja"></label>
        <label>Acara<select name="acara">${opsi(ACARA)}</select></label>
        <button class="btn">Simpan tamu</button>
      </form>

      <details class="alat"><summary>📥 Impor daftar tamu (tempel atau berkas CSV)</summary>
        <p class="mut">Satu tamu per baris: <code>Nama|WhatsApp|Kelompok|Jumlah|Meja</code>. Hanya nama yang wajib. Nama dirapikan, nomor 08… diubah ke 62…, dan tamu yang sudah ada dilewati.</p>
        <textarea id="impor" rows="5" placeholder="pak budi|081234567890|Teman|2&#10;keluarga bu rina|0856xxxxxxx&#10;Dewi Lestari"></textarea>
        <button class="btn kecil" data-aksi="impor-teks">Impor dari teks</button>
        <label class="catat">atau pilih berkas .csv / .txt <input type="file" accept=".csv,.txt,text/csv,text/plain" data-aksi-ubah="impor-berkas"></label>
        <div class="hasil-alat" id="impor-hasil"></div>
      </details>

      <details class="alat"><summary>💬 Baca balasan RSVP dari WhatsApp (cerdas)</summary>
        <p class="mut">Tempel balasan tamu atau hasil ekspor obrolan WhatsApp. Asisten membaca nama, status hadir / tidak hadir / ragu, jumlah orang, dan ucapannya, lalu mencocokkan dengan daftar tamu (nama ejaan beda pun dikenali). Anda tinggal memeriksa dan menerapkan.</p>
        <textarea id="bal" rows="5" placeholder="Halo, saya Pak Budi. Konfirmasi: Hadir.&#10;Selamat ya, kami berempat datang.&#10;&#10;[12/10/26 11.05] Dewi: Maaf belum bisa hadir, ada acara keluarga"></textarea>
        <button class="btn kecil" data-aksi="bal-baca">Baca balasan</button>
        <div class="hasil-alat" id="bal-hasil"></div>
      </details>

      <details class="alat"><summary>🧹 Pembersih data & deteksi duplikat</summary>
        <p class="mut">Memeriksa penulisan nama, format nomor WhatsApp, dan tamu ganda (nomor sama atau nama mirip).</p>
        <button class="btn kecil" data-aksi="bersih-periksa">Periksa data tamu</button>
        <div class="hasil-alat" id="bersih-hasil"></div>
      </details>

      <details class="alat"><summary>🪑 Susun meja otomatis</summary>
        <p class="mut">Tamu sekelompok didudukkan bersama, VIP mendapat meja pertama, rombongan tidak dipecah, dan meja yang terlalu kosong digabung. Tamu yang tidak hadir tidak diberi meja.</p>
        <div class="grid-form">
          <label>Kursi per meja<input id="kap" type="number" min="2" max="30" value="${S.atur.kapasitas}"></label>
          <label>Cakupan<select id="mode-meja"><option value="semua">Susun ulang semua tamu</option><option value="sisa">Hanya tamu yang belum punya meja</option></select></label>
          <button class="btn kecil" data-aksi="meja-pratinjau">Pratinjau</button>
        </div>
        <div class="hasil-alat" id="meja-hasil"></div>
      </details>

      <details class="alat"><summary>⏰ Pengingat RSVP cerdas</summary>
        <div class="hasil-alat" id="ingat-hasil">${htmlPengingat()}</div>
      </details>

      <p class="mut" id="jml"></p>
      <div class="tabel"><table>
        <thead><tr><th>Nama</th><th>WhatsApp</th><th>Kelompok</th><th>Orang</th><th>Meja</th><th>Acara</th><th>RSVP</th><th>Check-in</th><th>Aksi</th></tr></thead>
        <tbody id="tb"></tbody></table></div>
      <button class="btn ghost kecil" data-aksi="lagi" id="lagi" hidden>Tampilkan lebih banyak</button>
    </section>`;
  }
  function baris(g) {
    const w = Cerdas.waNorm(g.wa), r = g.rsvp || 'belum';
    return `<tr data-id="${g.id}" class="r-${r}">
      <td><input data-t="tamu" data-f="nama" value="${esc(g.nama)}" aria-label="Nama tamu" ${g.doa ? `title="${esc(g.doa)}"` : ''}></td>
      <td><input data-t="tamu" data-f="wa" value="${esc(g.wa || '')}" inputmode="tel" aria-label="WhatsApp" class="${!g.wa || w.valid ? '' : 'salah'}"></td>
      <td><select data-t="tamu" data-f="kelompok" aria-label="Kelompok">${opsi(KEL, g.kelompok)}</select></td>
      <td><input data-t="tamu" data-f="pax" type="number" min="1" max="20" value="${pax(g)}" aria-label="Jumlah orang"></td>
      <td><input data-t="tamu" data-f="meja" value="${esc(g.meja || '')}" aria-label="Meja"></td>
      <td><select data-t="tamu" data-f="acara" aria-label="Acara">${opsi(ACARA, g.acara || '')}</select></td>
      <td><select data-t="tamu" data-f="rsvp" aria-label="Status RSVP">${opsi(RSVP, r)}</select></td>
      <td>${g.checkin ? '✓ ' + jamStr(g.checkin) : '–'}</td>
      <td class="aksi"><button data-aksi="wa" data-id="${g.id}" title="Kirim undangan lewat WhatsApp" aria-label="Kirim WhatsApp ke ${esc(g.nama)}" ${w.valid ? '' : 'disabled'}>${g.terkirim ? '✓💬' : '💬'}</button>
        <button data-aksi="salin-tautan" data-id="${g.id}" title="Salin tautan undangan" aria-label="Salin tautan untuk ${esc(g.nama)}">🔗</button>
        <button data-aksi="hapus" data-id="${g.id}" title="Hapus tamu" aria-label="Hapus ${esc(g.nama)}">🗑</button></td></tr>`;
  }
  function tampilTamu() {
    if (!$('#tb')) return;
    const q = Cerdas.norm(cariTeks);
    const x = S.tamu.filter(g => (!q || Cerdas.norm(g.nama).includes(q) || Cerdas.norm(g.meja) === q) && FILT[saring](g));
    $('#tb').innerHTML = x.slice(0, batas).map(baris).join('') || `<tr><td colspan="9" class="kosong">${S.tamu.length ? 'Tidak ada tamu yang cocok dengan pencarian.' : 'Belum ada tamu. Tambahkan satu per satu atau impor daftar.'}</td></tr>`;
    $('#jml').textContent = `Menampilkan ${Math.min(batas, x.length)} dari ${x.length} undangan (total ${S.tamu.length}).`;
    $('#lagi').hidden = x.length <= batas;
  }
  function htmlPengingat() {
    const dengan = S.tamu.filter(g => Cerdas.waNorm(g.wa).valid && g.rsvp !== 'tidak');
    const belumKirim = dengan.filter(g => !g.terkirim), tunggu = dengan.filter(g => g.terkirim && (!g.rsvp || g.rsvp === 'belum'));
    const li = g => `<li><span>${esc(g.nama)}</span><button class="btn kecil" data-aksi="wa" data-id="${g.id}">${g.terkirim ? 'Kirim pengingat' : 'Kirim undangan'}</button></li>`;
    const tanpa = S.tamu.filter(g => !Cerdas.waNorm(g.wa).valid && g.rsvp !== 'tidak').length;
    return `<p><b>${belumKirim.length}</b> tamu belum dikirimi undangan · <b>${tunggu.length}</b> sudah dikirimi tetapi belum menjawab${tanpa ? ` · <b>${tanpa}</b> tanpa nomor WA yang valid` : ''}.</p>
      <p class="mut">Tombol membuka WhatsApp dengan pesan yang sudah disusun: sapaan sesuai nama dan tema (Assalamu’alaikum, Om Swastyastu, Horas, dst.), gaya santai untuk teman, dan nada pengingat untuk yang sudah pernah dikirimi.</p>
      ${tunggu.length ? `<h3>Perlu diingatkan</h3><ul class="daftar">${tunggu.slice(0, 40).map(li).join('')}</ul>` : ''}
      ${belumKirim.length ? `<h3>Belum dikirimi undangan</h3><ul class="daftar">${belumKirim.slice(0, 40).map(li).join('')}</ul>` : ''}`;
  }

  /* ----- Impor ----- */
  function pecahCSV(b) {
    const hasil = []; let cur = '', q = false;
    const sep = b.includes(';') && !b.includes(',') ? ';' : ',';
    for (let i = 0; i < b.length; i++) {
      const c = b[i];
      if (c === '"') { if (q && b[i + 1] === '"') { cur += '"'; i++; } else q = !q; }
      else if (c === sep && !q) { hasil.push(cur); cur = ''; }
      else cur += c;
    }
    hasil.push(cur); return hasil.map(x => x.trim());
  }
  function parseImpor(teks, csv) {
    const bar = String(teks).replace(/^\ufeff/, '').split(/\r?\n/).map(b => b.trim()).filter(Boolean);
    const rows = bar.map(b => {
      if (b.includes('|')) return b.split('|').map(x => x.trim());
      if (b.includes('\t')) return b.split('\t').map(x => x.trim());
      if (csv || (b.includes(',') && /^[^,]+,\s*[+\d][\d\s\-+()]{5,}(,|$)/.test(b))) return pecahCSV(b);
      return [b];
    });
    if (rows.length && /^(nama|name|tamu)$/i.test(rows[0][0])) rows.shift();
    return rows;
  }
  function imporBaris(rows) {
    let baru = 0, lewat = 0, wa = 0;
    rows.forEach(([nama = '', noWA = '', kel = '', jml = '', meja = '']) => {
      if (!nama.trim()) return;
      const tampil = Cerdas.parseNama(nama).tampil, w = Cerdas.waNorm(noWA);
      if (noWA && !w.valid) wa++;
      const dup = S.tamu.some(t => (w.valid && Cerdas.waNorm(t.wa).wa === w.wa && Cerdas.mirip(t.nama, tampil) > .6) || Cerdas.mirip(t.nama, tampil) >= .95);
      if (dup) { lewat++; return; }
      const k = KEL.find(x => Cerdas.norm(x) === Cerdas.norm(kel)) || Cerdas.tebakKelompok(tampil);
      S.tamu.push({id: uid(), nama: tampil, wa: noWA ? w.wa : '', kelompok: k, pax: parseInt(jml, 10) > 0 ? Math.min(20, parseInt(jml, 10)) : Cerdas.tebakPax(nama), meja: String(meja || '').trim(), acara: '', rsvp: 'belum', doa: '', checkin: null});
      baru++;
    });
    simpan(); tampilTamu(); segarHeader();
    $('#ingat-hasil') && ($('#ingat-hasil').innerHTML = htmlPengingat());
    $('#impor-hasil').innerHTML = `<p><b>${baru}</b> tamu ditambahkan${lewat ? `, <b>${lewat}</b> dilewati karena sudah ada` : ''}${wa ? `, <b>${wa}</b> nomor WA perlu dicek (ditandai merah di tabel)` : ''}. Jumlah orang pada “Keluarga …” diperkirakan 3; ubah bila perlu.</p>`;
    toast(`${baru} tamu diimpor`);
  }

  /* ----- Balasan RSVP ----- */
  function opsiTamu(u) {
    const kand = u.kandidat.map(id => cari(id)).filter(Boolean);
    return `${u.tamuId ? '' : '<option value="">Pilih tamu…</option>'}${kand.map(t => `<option value="${t.id}"${t.id === u.tamuId ? ' selected' : ''}>${esc(t.nama)}</option>`).join('')}<option value="__baru"${u.tamuId === '__baru' ? ' selected' : ''}>+ Buat tamu baru</option>`;
  }
  function tampilUsulan() {
    $('#bal-hasil').innerHTML = !usulan.length ? '<p>Tidak ada balasan RSVP yang terbaca. Pastikan teks memuat kata hadir, tidak hadir, atau ragu.</p>' :
      `<div class="tabel kecil"><table><thead><tr><th></th><th>Pesan</th><th>Cocok dengan tamu</th><th>Status</th><th>Orang</th></tr></thead><tbody>${usulan.map((u, i) => `<tr>
        <td><input type="checkbox" data-t="usul" data-i="${i}" data-f="pilih" aria-label="Terapkan"${u.pilih ? ' checked' : ''}></td>
        <td>${esc(u.nama)}<br><small class="mut">${esc((u.doa || '').slice(0, 90))}</small></td>
        <td><select data-t="usul" data-i="${i}" data-f="tamuId" aria-label="Cocokkan dengan tamu">${opsiTamu(u)}</select></td>
        <td><select data-t="usul" data-i="${i}" data-f="status" aria-label="Status">${opsi(RSVP.filter(r => r[0] !== 'belum'), u.status)}</select></td>
        <td><input data-t="usul" data-i="${i}" data-f="pax" type="number" min="0" max="20" value="${u.pax || ''}" placeholder="–" aria-label="Jumlah orang"></td></tr>`).join('')}</tbody></table></div>
        <p class="mut">Baris tanpa kecocokan yang jelas tidak dicentang; pilih tamunya dulu bila ingin diterapkan.</p>
        <button class="btn" data-aksi="bal-terapkan">Terapkan yang dicentang</button>`;
  }
  function terapkanBalasan() {
    let n = 0, baru = 0;
    usulan.forEach(u => {
      if (!u.pilih || !u.tamuId) return;
      let g = u.tamuId === '__baru' ? null : cari(u.tamuId);
      if (u.tamuId === '__baru') { g = {id: uid(), nama: Cerdas.parseNama(u.nama).tampil, wa: '', kelompok: 'Lainnya', pax: u.pax || 1, meja: '', acara: '', rsvp: 'belum', doa: '', checkin: null}; S.tamu.push(g); baru++; }
      if (!g) return;
      g.rsvp = u.status; if (u.pax) g.pax = u.pax; if (u.doa) g.doa = u.doa; n++;
    });
    simpan(); usulan = []; tampilTamu(); segarHeader();
    $('#bal-hasil').innerHTML = `<p><b>${n}</b> balasan diterapkan${baru ? `, termasuk ${baru} tamu baru` : ''}.</p>`;
    toast(`${n} status RSVP diperbarui`);
  }

  /* ----- Pembersih ----- */
  function periksaBersih() {
    const nama = S.tamu.filter(g => g.nama !== Cerdas.parseNama(g.nama).tampil);
    const waUbah = S.tamu.filter(g => g.wa && Cerdas.waNorm(g.wa).valid && Cerdas.waNorm(g.wa).wa !== g.wa);
    const waSalah = S.tamu.filter(g => g.wa && !Cerdas.waNorm(g.wa).valid);
    const dup = Cerdas.duplikat(S.tamu);
    const box = $('#bersih-hasil');
    if (!nama.length && !waUbah.length && !waSalah.length && !dup.length) { box.innerHTML = '<p>✅ Data tamu sudah rapi. Tidak ada duplikat.</p>'; return; }
    box.innerHTML = `<ul>
      ${nama.length ? `<li><b>${nama.length}</b> nama bisa dirapikan (huruf kapital, sapaan). Contoh: “${esc(nama[0].nama)}” → “${esc(Cerdas.parseNama(nama[0].nama).tampil)}”</li>` : ''}
      ${waUbah.length ? `<li><b>${waUbah.length}</b> nomor WA bisa diseragamkan ke format 62… Contoh: ${esc(waUbah[0].wa)} → ${esc(Cerdas.waNorm(waUbah[0].wa).wa)}</li>` : ''}
      ${waSalah.length ? `<li><b>${waSalah.length}</b> nomor WA tidak valid dan perlu dicek manual: ${waSalah.slice(0, 5).map(g => esc(g.nama)).join(', ')}${waSalah.length > 5 ? '…' : ''}</li>` : ''}
    </ul>
    ${nama.length || waUbah.length ? '<button class="btn kecil" data-aksi="bersih-rapikan">Rapikan nama & nomor otomatis</button>' : ''}
    ${dup.length ? `<h3>Dugaan tamu ganda</h3><ul class="daftar">${dup.map(p => { const a = cari(p.a), b = cari(p.b); return `<li><span><b>${esc(a.nama)}</b> ↔ <b>${esc(b.nama)}</b><br><small class="mut">${esc(p.alasan)}</small></span><button class="btn kecil" data-aksi="bersih-gabung" data-a="${a.id}" data-b="${b.id}">Gabungkan</button></li>`; }).join('')}</ul>` : ''}`;
  }
  const RANK = {hadir: 4, tidak: 3, ragu: 2, belum: 1};
  function gabungkan(a, b) {
    if ((RANK[b.rsvp || 'belum'] || 1) > (RANK[a.rsvp || 'belum'] || 1)) a.rsvp = b.rsvp;
    a.pax = Math.max(pax(a), pax(b)); a.meja = a.meja || b.meja; a.wa = a.wa || b.wa; a.checkin = a.checkin || b.checkin;
    a.doa = [a.doa, b.doa].filter(Boolean).join(' · '); a.terkirim = a.terkirim || b.terkirim;
    S.pemenang.forEach(p => { if (p.tamuId === b.id) p.tamuId = a.id; });
    S.tamu = S.tamu.filter(g => g.id !== b.id);
  }

  /* ----- Susun meja ----- */
  function pratinjauMeja() {
    const kap = Math.max(2, parseInt($('#kap').value, 10) || 10); S.atur.kapasitas = kap; simpan();
    rencana = Cerdas.susunMeja(S.tamu, {kapasitas: kap, mode: $('#mode-meja').value});
    const box = $('#meja-hasil');
    if (!rencana.meja.length) { box.innerHTML = '<p>Tidak ada tamu yang perlu diberi meja.</p>'; return; }
    box.innerHTML = `<p><b>${rencana.meja.length}</b> meja diperlukan, <b>${rencana.kursiKosong}</b> kursi kosong tersisa.</p>
      <ul class="daftar">${rencana.meja.map(m => `<li><span><b>Meja ${esc(m.no)}</b>${m.vip ? ' ⭐' : ''} · ${m.terisi}/${m.kapasitas} kursi · ${esc(m.kelompok.join(', '))}${m.lebih ? ' <span class="telat">melebihi kapasitas</span>' : ''}<br><small class="mut">${esc(m.nama.slice(0, 8).join(', '))}${m.nama.length > 8 ? ` +${m.nama.length - 8} lainnya` : ''}</small></span></li>`).join('')}</ul>
      <button class="btn" data-aksi="meja-terapkan">Terapkan susunan ini</button>`;
  }

  /* ============================================================
     TAB CHECK-IN
     ============================================================ */
  const opt = {suara: false, souv: true};
  const kam = {stream: null, tmr: 0, det: null, last: '', lastT: 0};

  function vCheckin() {
    const st = Cerdas.statistik(S.tamu);
    return `<section class="dua">
      <div class="card"><h2>Pindai tiket QR</h2>
        <div class="kam"><video id="kv" playsinline muted></video></div>
        <p id="kinfo" class="mut" aria-live="polite">Kamera belum menyala.</p>
        <button class="btn" data-aksi="kam-mulai">Mulai kamera</button><button class="btn ghost" data-aksi="kam-henti">Hentikan</button>
        <div class="cek">
          <label><input type="checkbox" id="opt-suara"${opt.suara ? ' checked' : ''}> Ucapkan nama tamu</label>
          <label><input type="checkbox" id="opt-souv"${opt.souv ? ' checked' : ''}> Hitung souvenir otomatis</label>
        </div>
        <p class="mut">Tamu menunjukkan tiket QR dari undangannya (bagian “Tiket”). Nama dan nomor meja muncul besar di layar ini. Bila kamera tidak mendukung, gunakan check-in manual.</p>
      </div>
      <div class="card"><h2>Check-in manual</h2>
        <input id="ci-q" type="search" placeholder="Ketik nama atau tempel isi QR" aria-label="Cari tamu untuk check-in" autocomplete="off">
        <ul class="daftar" id="ci-hasil" aria-live="polite"></ul>
        <h3>Check-in terakhir</h3>
        <p class="mut" id="ci-total">${st.checkin} undangan · ${st.paxCheckin} orang sudah masuk dari ${st.pax} yang diundang.</p>
        <ul class="daftar" id="ci-log"></ul>
      </div>
    </section>`;
  }
  function isiLog() {
    const log = $('#ci-log'); if (!log) return;
    const x = S.tamu.filter(g => g.checkin).sort((a, b) => b.checkin.localeCompare(a.checkin)).slice(0, 8);
    log.innerHTML = x.map(g => `<li><span><b>${esc(g.nama)}</b> · ${jamStr(g.checkin)}${g.meja ? ` · meja ${esc(g.meja)}` : ''}</span><button class="btn kecil ghost" data-aksi="ci-batal" data-id="${g.id}">Batalkan</button></li>`).join('') || '<li class="mut">Belum ada.</li>';
    const st = Cerdas.statistik(S.tamu);
    $('#ci-total').textContent = `${st.checkin} undangan · ${st.paxCheckin} orang sudah masuk dari ${st.pax} yang diundang.`;
  }
  function sapaTamu(g, kepala, ulang) {
    const el = $('#sapa'), nama = Cerdas.parseNama(g.nama).tampil;
    el.className = 'sapa' + (ulang ? ' ulang' : '');
    el.innerHTML = `<div class="sapa-isi"><small>${esc(kepala)}</small><h2>${esc(nama)}</h2>${g.meja ? `<p class="meja">Meja<b>${esc(g.meja)}</b></p>` : ''}${pax(g) > 1 ? `<p>Rombongan ${pax(g)} orang</p>` : ''}</div>`;
    el.hidden = false; clearTimeout(sapaTamu.h); sapaTamu.h = setTimeout(() => (el.hidden = true), 4200);
    if (opt.suara && !ulang && 'speechSynthesis' in window) { const u = new SpeechSynthesisUtterance('Selamat datang, ' + nama); u.lang = 'id-ID'; speechSynthesis.cancel(); speechSynthesis.speak(u); }
  }
  function masuk(g) {
    if (g.checkin) { sapaTamu(g, `Sudah check-in pukul ${jamStr(g.checkin)}`, true); return false; }
    g.checkin = new Date().toISOString(); g.rsvp = 'hadir';
    if (opt.souv) S.souvenir.keluar = (S.souvenir.keluar || 0) + pax(g);
    simpan(); sapaTamu(g, 'Selamat datang'); isiLog(); return true;
  }
  function cocokQR(teks) {
    let nama = String(teks).trim(), meja = '';
    if (nama.startsWith('UND|')) { const p = nama.split('|'); nama = p[1] || ''; meja = p[2] || ''; }
    const n = Cerdas.norm(nama); let c = S.tamu.filter(t => Cerdas.norm(t.nama) === n || Cerdas.norm(Cerdas.parseNama(t.nama).tampil) === n);
    if (c.length > 1 && meja) { const f = c.filter(t => String(t.meja || '') === meja); if (f.length) c = f; }
    if (c.length === 1) return {tamu: c[0], nama};
    if (c.length > 1) return {kandidat: c, nama};
    const f = Cerdas.cariTamu(nama, S.tamu, .85);
    return f.tamu ? {tamu: f.tamu, nama} : {kandidat: f.kandidat, nama};
  }
  function prosesQR(teks) {
    const r = cocokQR(teks);
    if (r.tamu) { masuk(r.tamu); return; }
    $('#kinfo').textContent = r.kandidat.length ? `“${r.nama}” cocok dengan beberapa tamu; pilih di check-in manual.` : `“${r.nama}” tidak ada di daftar tamu.`;
    $('#ci-q').value = r.nama; tampilCari();
  }
  function tampilCari() {
    const q = $('#ci-q').value.trim(), box = $('#ci-hasil');
    if (!q) { box.innerHTML = ''; return; }
    const r = cocokQR(q), n = Cerdas.norm(r.nama);
    let hit = r.tamu ? [r.tamu] : (r.kandidat.length ? r.kandidat : S.tamu.filter(g => Cerdas.norm(g.nama).includes(n)).slice(0, 6));
    box.innerHTML = hit.map(g => `<li><span><b>${esc(g.nama)}</b>${g.meja ? ` · meja ${esc(g.meja)}` : ''} · ${pax(g)} orang${g.checkin ? ` · <span class="telat">sudah masuk ${jamStr(g.checkin)}</span>` : ''}</span><button class="btn kecil" data-aksi="ci-masuk" data-id="${g.id}">Check-in</button></li>`).join('') +
      (!hit.length || !r.tamu ? `<li><span>Tamu tidak ada di daftar?</span><button class="btn kecil ghost" data-aksi="ci-baru" data-nama="${esc(r.nama)}">Tambah “${esc(r.nama)}” & check-in</button></li>` : '');
  }
  function muatJsQR() {
    return new Promise((ok, gagal) => {
      if (window.jsQR) return ok();
      const s = Object.assign(document.createElement('script'), {src: 'https://cdnjs.cloudflare.com/ajax/libs/jsQR/1.4.0/jsQR.min.js', onload: ok, onerror: gagal}); document.head.append(s);
    });
  }
  async function mulaiKamera() {
    if (kam.stream) return;
    const info = t => ($('#kinfo') && ($('#kinfo').textContent = t));
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return info('Browser ini tidak mendukung kamera. Gunakan check-in manual, atau buka halaman lewat https.');
    try { kam.stream = await navigator.mediaDevices.getUserMedia({video: {facingMode: 'environment'}}); }
    catch (e) { return info('Kamera tidak bisa diakses. Izinkan akses kamera di browser, atau gunakan check-in manual.'); }
    const v = $('#kv'); v.srcObject = kam.stream; await v.play().catch(() => {});
    if ('BarcodeDetector' in window) { try { kam.det = new BarcodeDetector({formats: ['qr_code']}); } catch (e) { kam.det = null; } }
    if (!kam.det) { try { await muatJsQR(); } catch (e) { info('Pemindai QR tidak bisa dimuat (periksa koneksi internet). Gunakan check-in manual.'); hentiKamera(); return; } }
    info('Arahkan kamera ke kode QR tamu…');
    const cv = document.createElement('canvas'), cx = cv.getContext('2d', {willReadFrequently: true});
    const putar = async () => {
      if (!kam.stream) return;
      try {
        let teks = '';
        if (v.readyState >= 2 && v.videoWidth) {
          if (kam.det) { const r = await kam.det.detect(v); teks = r[0] ? r[0].rawValue : ''; }
          else { cv.width = v.videoWidth; cv.height = v.videoHeight; cx.drawImage(v, 0, 0); const im = cx.getImageData(0, 0, cv.width, cv.height), h = window.jsQR(im.data, im.width, im.height); teks = h ? h.data : ''; }
        }
        if (teks && (teks !== kam.last || Date.now() - kam.lastT > 5000)) { kam.last = teks; kam.lastT = Date.now(); prosesQR(teks); }
      } catch (e) { /* abaikan satu bingkai gagal */ }
      kam.tmr = setTimeout(putar, 250);
    };
    putar();
  }
  function hentiKamera() {
    clearTimeout(kam.tmr);
    if (kam.stream) kam.stream.getTracks().forEach(t => t.stop());
    kam.stream = null; kam.last = '';
    const i = $('#kinfo'); if (i) i.textContent = 'Kamera dimatikan.';
  }

  /* ============================================================
     TAB PLANNER
     ============================================================ */
  const sum = (a, f) => a.reduce((s, x) => s + (+x[f] || 0), 0);
  function htmlRingkasAng() {
    const A = S.anggaran, est = sum(A.items, 'estimasi'), akt = sum(A.items, 'aktual'), total = A.total || est;
    const persen = total ? Math.min(100, Math.round(akt / total * 100)) : 0, lebih = akt > total && total > 0;
    return `<div class="rinci-grid"><div><b>${rp(total)}</b><span>anggaran</span></div><div><b>${rp(est)}</b><span>total estimasi pos</span></div><div><b>${rp(akt)}</b><span>terpakai</span></div><div><b class="${total - akt < 0 ? 'telat' : ''}">${rp(total - akt)}</b><span>sisa anggaran</span></div></div>
      <div class="progres${lebih ? ' bahaya' : ''}" role="progressbar" aria-valuenow="${persen}" aria-valuemin="0" aria-valuemax="100" aria-label="Anggaran terpakai"><span style="width:${persen}%"></span></div>
      ${est > total * 1.02 && total ? `<p class="telat">Total estimasi melebihi anggaran sebesar ${rp(est - total)}.</p>` : ''}`;
  }
  function vPlanner() {
    const A = S.anggaran, tg = [...S.tugas].sort((a, b) => String(a.due || '9').localeCompare(String(b.due || '9')));
    const today = new Date().toISOString().slice(0, 10), selesai = tg.filter(t => t.selesai).length;
    return `<section class="dua">
      <div class="card"><h2>Anggaran</h2>
        <div class="bar"><label>Total anggaran (Rp)<input type="number" min="0" step="500000" id="ang-total" data-t="angtotal" value="${A.total || ''}" placeholder="100000000"></label>
          <button class="btn kecil" data-aksi="ang-otomatis">Bagi otomatis ke pos</button></div>
        <div id="ang-ringkas">${htmlRingkasAng()}</div>
        ${(A.catatan || []).map(c => `<p class="mut">💡 ${esc(c)}</p>`).join('')}
        <div class="tabel kecil"><table><thead><tr><th>Pos</th><th>Estimasi</th><th>Aktual</th><th>Lunas</th><th></th></tr></thead><tbody>
          ${A.items.map(i => `<tr><td><input data-t="ang" data-id="${i.id}" data-f="nama" value="${esc(i.nama)}" aria-label="Nama pos"></td>
            <td><input data-t="ang" data-id="${i.id}" data-f="estimasi" type="number" min="0" step="50000" value="${i.estimasi || 0}" aria-label="Estimasi"></td>
            <td><input data-t="ang" data-id="${i.id}" data-f="aktual" type="number" min="0" step="50000" value="${i.aktual || 0}" aria-label="Aktual" ${i.estimasi && i.aktual > i.estimasi * 1.1 ? 'class="salah"' : ''}></td>
            <td><input data-t="ang" data-id="${i.id}" data-f="lunas" type="checkbox" ${i.lunas ? 'checked' : ''} aria-label="Lunas"></td>
            <td class="aksi"><button data-aksi="ang-hapus" data-id="${i.id}" aria-label="Hapus pos ${esc(i.nama)}">🗑</button></td></tr>`).join('') || '<tr><td colspan="5" class="kosong">Belum ada pos. Isi total anggaran lalu tekan “Bagi otomatis”.</td></tr>'}
        </tbody></table></div>
        <form class="grid-form" data-form="ang-tambah"><label>Pos baru<input name="nama" required placeholder="Mis. Sewa tenda"></label><label>Estimasi (Rp)<input name="estimasi" type="number" min="0" step="50000"></label><button class="btn kecil">Tambah pos</button></form>
      </div>
      <div class="card"><h2>Tugas persiapan</h2>
        <p class="mut">${selesai} dari ${tg.length} selesai.</p>
        <div class="progres" role="progressbar" aria-valuenow="${tg.length ? Math.round(selesai / tg.length * 100) : 0}" aria-valuemin="0" aria-valuemax="100" aria-label="Kemajuan tugas"><span style="width:${tg.length ? selesai / tg.length * 100 : 0}%"></span></div>
        <button class="btn kecil" data-aksi="tg-otomatis">Buat jadwal otomatis dari tanggal acara</button>
        <ul class="daftar">${tg.map(t => `<li><label style="display:flex;gap:.5rem;align-items:center;flex:1 1 220px;color:inherit;font-weight:400"><input style="width:auto" type="checkbox" data-t="tg" data-id="${t.id}" data-f="selesai" ${t.selesai ? 'checked' : ''}><span class="${t.selesai ? 'sdone' : ''}">${esc(t.teks)}</span></label>
          <input type="date" data-t="tg" data-id="${t.id}" data-f="due" value="${esc(t.due || '')}" style="width:auto" aria-label="Tenggat"><span class="${!t.selesai && t.due && t.due < today ? 'telat' : 'mut'}">${!t.selesai && t.due && t.due < today ? 'lewat' : ''}</span>
          <button class="btn kecil ghost" data-aksi="tg-hapus" data-id="${t.id}" aria-label="Hapus tugas">🗑</button></li>`).join('') || '<li class="mut">Belum ada tugas.</li>'}</ul>
        <form class="grid-form" data-form="tg-tambah"><label>Tugas baru<input name="teks" required></label><label>Tenggat<input name="due" type="date"></label><button class="btn kecil">Tambah</button></form>
      </div></section>`;
  }

  /* ============================================================
     TAB HARI H
     ============================================================ */
  function grafik() {
    const c = S.tamu.filter(g => g.checkin).map(g => ({t: +new Date(g.checkin), n: pax(g)}));
    if (!c.length) return '<p class="kosong">Grafik muncul setelah ada tamu yang check-in.</p>';
    const min = Math.min(...c.map(x => x.t)), max = Math.max(...c.map(x => x.t));
    let langkah = (max - min) <= 3 * 36e5 ? 15 * 6e4 : 36e5;
    while ((max - min) / langkah > 48) langkah *= 2;
    const mulai = Math.floor(min / langkah) * langkah, jml = Math.floor((max - mulai) / langkah) + 1, b = Array(jml).fill(0);
    c.forEach(x => (b[Math.floor((x.t - mulai) / langkah)] += x.n));
    const top = Math.max(...b), puncak = b.indexOf(top), W = 640, H = 220, ml = 30, mb = 28, mt = 18, bw = (W - ml - 8) / jml, tinggi = H - mb - mt;
    const label = i => new Date(mulai + i * langkah).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'}).replace(':', '.');
    const tiap = Math.ceil(jml / 10);
    return `<svg class="grafik" viewBox="0 0 ${W} ${H}" role="img" aria-label="Grafik kedatangan tamu. Puncak pukul ${label(puncak)} dengan ${top} orang.">
      <line x1="${ml}" y1="${H - mb}" x2="${W - 8}" y2="${H - mb}" stroke="#d9cdb4"/>
      <text x="${ml - 4}" y="${mt + 4}" text-anchor="end">${top}</text><text x="${ml - 4}" y="${H - mb}" text-anchor="end">0</text>
      ${b.map((n, i) => { const h = top ? n / top * tinggi : 0, x = ml + i * bw + bw * .1; return `<rect class="${i === puncak ? 'p' : 'b'}" x="${x.toFixed(1)}" y="${(H - mb - h).toFixed(1)}" width="${(bw * .8).toFixed(1)}" height="${h.toFixed(1)}" rx="2"><title>${label(i)}: ${n} orang</title></rect>${i % tiap === 0 ? `<text x="${(x + bw * .4).toFixed(1)}" y="${H - 10}" text-anchor="middle">${label(i)}</text>` : ''}`; }).join('')}
    </svg><p class="mut">Puncak kedatangan sekitar pukul <b>${label(puncak)}</b> (${top} orang). Satu batang = ${langkah / 6e4} menit.</p>`;
  }
  function vHariH() {
    const pr = Cerdas.prediksi(S.tamu), st = Cerdas.statistik(S.tamu), sv = S.souvenir, pesan = +S.atur.katering || 0;
    const status = !pesan ? '' : pesan < pr.saranKatering * .9 ? `<p class="telat">Katering ${pesan} porsi kemungkinan kurang dari kebutuhan (${pr.saranKatering}).</p>` : pesan > pr.saranKatering * 1.35 ? `<p class="mut">Katering ${pesan} porsi cukup longgar; ${pr.saranKatering} porsi sudah aman, ada potensi hemat.</p>` : '<p style="color:var(--k-ok)"><b>Jumlah porsi sudah sesuai prediksi.</b></p>';
    const sisaSv = (+sv.stok || 0) - (+sv.keluar || 0);
    const ucapan = S.tamu.filter(g => g.doa);
    return `<section class="dua">
      <div class="card"><h2>Prediksi kehadiran & katering</h2>
        ${S.tamu.length ? `<div class="rinci-grid"><div><b>${pr.harapan}</b><span>orang diperkirakan hadir</span></div><div><b>${pr.rendah}–${pr.tinggi}</b><span>rentang wajar (90%)</span></div><div><b>${pr.saranKatering}</b><span>porsi disarankan</span></div><div><b>${pr.saranKursi}</b><span>kursi untuk skenario ramai</span></div></div>
        <p class="mut">Dihitung dari RSVP yang masuk. Tamu yang belum menjawab dihitung memakai peluang per kelompok, yang ikut dikoreksi oleh pola jawaban tamu lain. Sudah pasti hadir: ${pr.terkonfirmasi} orang. Margin 3% untuk tamu tak terduga sudah termasuk.</p>
        <div class="tabel kecil"><table><thead><tr><th>Kelompok</th><th>Diundang</th><th>Peluang hadir</th><th>Perkiraan</th></tr></thead><tbody>${Object.entries(pr.rinci).map(([k, r]) => `<tr><td>${esc(k)}</td><td>${r.undangan}</td><td>${Math.round(r.peluang * 100)}%</td><td>${r.harapan}</td></tr>`).join('')}</tbody></table></div>` : '<p class="kosong">Tambahkan tamu untuk melihat prediksi.</p>'}
        <div class="grid-form"><label>Porsi katering dipesan<input type="number" min="0" data-t="atur" data-f="katering" value="${pesan || ''}"></label><label>Kursi per meja<input type="number" min="2" data-t="atur" data-f="kapasitas" value="${S.atur.kapasitas}"></label></div>
        <div id="kat-status">${status}</div>
      </div>
      <div class="card"><h2>Souvenir</h2>
        <div class="grid-form"><label>Stok awal<input type="number" min="0" data-t="sv" data-f="stok" value="${sv.stok || ''}"></label>
          <label>Sudah dibagikan<input type="number" min="0" data-t="sv" data-f="keluar" value="${sv.keluar || 0}"></label></div>
        <div class="rinci-grid"><div><b class="${sisaSv < 0 ? 'telat' : ''}" id="sv-sisa">${sisaSv}</b><span>sisa</span></div><div><b>${pr.saranKursi}</b><span>perkiraan kebutuhan puncak</span></div></div>
        ${sv.stok && sv.stok < pr.saranKursi ? `<p class="telat">Stok souvenir mungkin kurang ${pr.saranKursi - sv.stok}.</p>` : ''}
        <p class="mut">Dengan opsi “Hitung souvenir otomatis” di tab Check-in, jumlah dibagikan bertambah sendiri sesuai jumlah orang tiap tamu.</p>
      </div></section>
      <section class="card"><h2>Grafik jam kedatangan</h2>${grafik()}<p class="mut">${st.checkin} dari ${st.hadir + st.ragu + st.belum} undangan aktif sudah check-in.</p></section>
      <section class="dua">
        <div class="card"><h2>Doorprize</h2>
          <p class="mut">Hanya tamu yang sudah check-in dan belum pernah menang yang ikut diundi. Undian memakai pengacak kriptografis browser.</p>
          <div class="bar"><input id="dp-hadiah" placeholder="Nama hadiah (mis. Voucher hotel)" aria-label="Nama hadiah"><button class="btn" data-aksi="dp-undi">Undi sekarang</button></div>
          <div class="undi" id="dp-layar" aria-live="polite">Siap mengundi</div>
          <ul class="daftar" id="dp-daftar">${htmlPemenang()}</ul></div>
        <div class="card"><h2>Hadiah & amplop diterima</h2>
          <form class="grid-form" data-form="hadiah"><label>Dari<input name="dari" list="dl-tamu" required placeholder="Nama pemberi"></label>
            <label>Jenis<select name="jenis">${opsi(['Amplop tunai', 'Transfer', 'Kado', 'Lainnya'])}</select></label>
            <label>Nilai (Rp)<input name="nilai" type="number" min="0" step="1000"></label><label>Catatan<input name="catatan"></label><button class="btn kecil">Catat</button></form>
          <datalist id="dl-tamu">${S.tamu.map(g => `<option value="${esc(g.nama)}">`).join('')}</datalist>
          <div id="hd-daftar">${htmlHadiah()}</div></div></section>
      <section class="card"><h2>Ucapan & doa dari tamu</h2>
        ${ucapan.length ? `<ul class="daftar">${ucapan.map(g => `<li><span><b>${esc(g.nama)}</b><br>${esc(g.doa)}</span></li>`).join('')}</ul>` : '<p class="mut">Ucapan yang terbaca dari balasan WhatsApp (tab Tamu, “Baca balasan RSVP”) akan tampil di sini sebagai kenang-kenangan.</p>'}
        <button class="btn ghost" data-aksi="cetak">Cetak / simpan laporan sebagai PDF</button></section>`;
  }
  function htmlPemenang() { return S.pemenang.map(p => `<li><span>🎁 <b>${esc(p.hadiah || 'Hadiah')}</b> → ${esc(Cerdas.parseNama(p.nama).tampil)}</span><button class="btn kecil ghost" data-aksi="dp-hapus" data-id="${p.id}" aria-label="Batalkan pemenang">Batalkan</button></li>`).join('') || '<li class="mut">Belum ada pemenang.</li>'; }
  function htmlHadiah() {
    const h = S.hadiah, tot = sum(h, 'nilai'), per = {}; h.forEach(x => (per[x.jenis] = (per[x.jenis] || 0) + (+x.nilai || 0)));
    return `<p><b>${h.length}</b> hadiah · total <b>${rp(tot)}</b></p><p class="mut">${Object.entries(per).map(([k, v]) => `${esc(k)}: ${rp(v)}`).join(' · ')}</p>
      <ul class="daftar">${h.slice().reverse().slice(0, 30).map(x => `<li><span><b>${esc(x.dari)}</b> · ${esc(x.jenis)} · ${rp(x.nilai)}${x.catatan ? `<br><small class="mut">${esc(x.catatan)}</small>` : ''}</span><button class="btn kecil ghost" data-aksi="hd-hapus" data-id="${x.id}" aria-label="Hapus catatan">🗑</button></li>`).join('')}</ul>`;
  }
  function undi() {
    const hadiah = $('#dp-hadiah').value.trim(), layar = $('#dp-layar');
    const pool = S.tamu.filter(g => g.checkin && !S.pemenang.some(p => p.tamuId === g.id));
    if (!pool.length) return toast('Belum ada tamu yang memenuhi syarat (sudah check-in dan belum menang).');
    const acak = n => crypto.getRandomValues(new Uint32Array(1))[0] % n, pilih = pool[acak(pool.length)];
    const selesai = () => { layar.textContent = '🎉 ' + Cerdas.parseNama(pilih.nama).tampil; S.pemenang.push({id: uid(), tamuId: pilih.id, nama: pilih.nama, hadiah}); simpan(); $('#dp-daftar').innerHTML = htmlPemenang(); };
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return selesai();
    $('[data-aksi=dp-undi]').disabled = true; let n = 0;
    const h = setInterval(() => { layar.textContent = pool[acak(pool.length)].nama; if (++n > 22) { clearInterval(h); $('[data-aksi=dp-undi]').disabled = false; selesai(); } }, 75);
  }

  /* ============================================================
     TAB DATA
     ============================================================ */
  function vData() {
    return `<section class="dua">
      <div class="card"><h2>Cadangan data</h2>
        <p>Semua data dashboard tersimpan di browser perangkat ini. Unduh cadangan secara berkala, dan gunakan berkas yang sama untuk memindahkan data ke ponsel atau laptop lain.</p>
        <button class="btn" data-aksi="cadangan-unduh">Unduh cadangan (.json)</button>
        <label class="catat">Pulihkan dari cadangan <input type="file" accept=".json,application/json" data-aksi-ubah="cadangan-impor"></label>
        <p class="mut">Memulihkan akan menggantikan seluruh data saat ini.</p></div>
      <div class="card"><h2>Ekspor</h2>
        <button class="btn ghost" data-aksi="ekspor-csv">Daftar tamu (.csv)</button>
        <h3>Tentang privasi</h3><p class="mut">Tidak ada data yang dikirim ke server. Ucapan tamu di undangan hanya tersimpan di perangkat masing-masing tamu; karena itu RSVP dikumpulkan lewat WhatsApp.</p>
        <h3>Data contoh</h3><p class="mut">Mengisi seluruh dashboard dengan 40 tamu contoh, anggaran, tugas, dan (untuk hari H) check-in, doorprize, dan hadiah. Nomor WhatsApp di data contoh adalah rekaan. Data yang ada akan diganti.</p>
        <button class="btn kecil" data-aksi="contoh-muat" data-mode="persiapan">Muat contoh: persiapan</button><button class="btn kecil ghost" data-aksi="contoh-muat" data-mode="harih">Muat contoh: hari H</button>
        <h3>Zona berbahaya</h3><button class="btn bahaya ghost" data-aksi="reset">Hapus semua data dashboard</button></div></section>`;
  }

  /* ---------- Tampilan per tab & pasca-render ---------- */
  const VIEW = {ringkas: vRingkas, tamu: vTamu, checkin: vCheckin, planner: vPlanner, harih: vHariH, data: vData};
  const AFTER = {tamu: tampilTamu, checkin: isiLog};

  /* ---------- CSV ---------- */
  function eksporCSV() {
    const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    const rows = [['Nama', 'WhatsApp', 'Kelompok', 'Jumlah', 'Meja', 'Acara', 'RSVP', 'Check-in', 'Ucapan', 'Tautan']];
    S.tamu.forEach(g => rows.push([g.nama, g.wa, g.kelompok, pax(g), g.meja, g.acara, g.rsvp || 'belum', g.checkin ? new Date(g.checkin).toLocaleString('id-ID') : '', g.doa, tautan(g)]));
    unduh('tamu-undangan.csv', '\ufeff' + rows.map(r => r.map(q).join(',')).join('\r\n'), 'text/csv;charset=utf-8');
  }

  /* ============================================================
     PENANGAN PERISTIWA (delegasi)
     ============================================================ */
  const AKSI = {
    pergi: a => pindah(a.dataset.tab),
    contoh: a => { $('#q').value = a.dataset.q; tampilJawab(a.dataset.q); },
    'tambah-toggle': () => { const f = $('#f-tambah'); f.hidden = !f.hidden; if (!f.hidden) f.elements.nama.focus(); },
    'ekspor-csv': eksporCSV,
    lagi: () => { batas += 100; tampilTamu(); },
    hapus: a => { const g = cari(a.dataset.id); if (g && confirm(`Hapus “${g.nama}” dari daftar tamu?`)) { S.tamu = S.tamu.filter(x => x.id !== g.id); S.pemenang = S.pemenang.filter(p => p.tamuId !== g.id); simpan(); tampilTamu(); segarHeader(); } },
    'salin-tautan': async a => { const g = cari(a.dataset.id); toast(await salin(tautan(g)) ? `Tautan untuk ${g.nama} tersalin` : 'Gagal menyalin tautan'); },
    wa: a => {
      const g = cari(a.dataset.id), w = Cerdas.waNorm(g.wa);
      if (!w.valid) return toast('Nomor WhatsApp belum valid');
      const ingat = !!g.terkirim && (!g.rsvp || g.rsvp === 'belum');
      const pesan = Cerdas.pesanWA({...g, link: tautan(g)}, ctxPesan(), {pengingat: ingat});
      window.open(`https://wa.me/${w.wa}?text=${encodeURIComponent(pesan)}`, '_blank', 'noopener');
      if (!g.terkirim) g.terkirim = new Date().toISOString(); else g.diingatkan = (g.diingatkan || 0) + 1;
      simpan(); tampilTamu(); $('#ingat-hasil') && ($('#ingat-hasil').innerHTML = htmlPengingat());
      toast(ingat ? 'Pesan pengingat disiapkan di WhatsApp' : 'Pesan undangan disiapkan di WhatsApp');
    },
    'impor-teks': () => imporBaris(parseImpor($('#impor').value, false)),
    'bal-baca': () => { usulan = Cerdas.bacaBalasan($('#bal').value, S.tamu).map(u => ({...u, pilih: !!u.tamuId})); tampilUsulan(); },
    'bal-terapkan': terapkanBalasan,
    'bersih-periksa': periksaBersih,
    'bersih-rapikan': () => {
      S.tamu.forEach(g => { g.nama = Cerdas.parseNama(g.nama).tampil; const w = Cerdas.waNorm(g.wa); if (g.wa && w.valid) g.wa = w.wa; });
      simpan(); tampilTamu(); periksaBersih(); toast('Nama dan nomor dirapikan');
    },
    'bersih-gabung': a => { const x = cari(a.dataset.a), y = cari(a.dataset.b); if (x && y) { gabungkan(x, y); simpan(); tampilTamu(); periksaBersih(); segarHeader(); toast('Dua entri digabung'); } },
    'meja-pratinjau': pratinjauMeja,
    'meja-terapkan': () => {
      if (!rencana) return;
      S.tamu.forEach(g => { if (rencana.peta[g.id] != null) g.meja = rencana.peta[g.id]; else if (g.rsvp === 'tidak' && $('#mode-meja').value === 'semua') g.meja = ''; });
      simpan(); tampilTamu(); $('#meja-hasil').innerHTML = `<p>✅ Susunan diterapkan untuk ${Object.keys(rencana.peta).length} tamu. Anda masih bisa mengubah nomor meja manual di tabel.</p>`; rencana = null; toast('Nomor meja diperbarui');
    },
    'kam-mulai': mulaiKamera, 'kam-henti': hentiKamera,
    'ci-masuk': a => { const g = cari(a.dataset.id); if (g) { masuk(g); tampilCari(); } },
    'ci-baru': a => {
      const nama = Cerdas.parseNama(a.dataset.nama).tampil; if (!nama) return;
      const g = {id: uid(), nama, wa: '', kelompok: Cerdas.tebakKelompok(nama), pax: Cerdas.tebakPax(nama), meja: '', acara: '', rsvp: 'hadir', doa: '', checkin: null};
      S.tamu.push(g); masuk(g); $('#ci-q').value = ''; tampilCari();
    },
    'ci-batal': a => { const g = cari(a.dataset.id); if (!g) return; if (opt.souv) S.souvenir.keluar = Math.max(0, (S.souvenir.keluar || 0) - pax(g)); g.checkin = null; simpan(); isiLog(); tampilCari(); },
    'ang-otomatis': () => {
      const total = +$('#ang-total').value || S.anggaran.total; if (!total) return toast('Isi total anggaran terlebih dulu');
      if (S.anggaran.items.length && !confirm('Ganti semua pos anggaran dengan pembagian otomatis? Angka aktual akan hilang.')) return;
      const r = Cerdas.rancangAnggaran(total, S.tamu.length ? Cerdas.prediksi(S.tamu).harapan : 0);
      S.anggaran.total = total; S.anggaran.items = r.items.map(i => ({id: uid(), ...i})); S.anggaran.catatan = r.catatan; simpan(); render(); toast('Anggaran dibagi ke ' + r.items.length + ' pos');
    },
    'ang-hapus': a => { S.anggaran.items = S.anggaran.items.filter(i => i.id !== a.dataset.id); simpan(); render(); },
    'tg-otomatis': () => {
      const ada = new Set(S.tugas.map(t => t.teks)), j = Cerdas.jadwalTugas(hariH(), new Date()).filter(t => !ada.has(t.teks));
      if (!j.length) return toast('Semua tugas standar sudah ada');
      j.forEach(t => S.tugas.push({id: uid(), teks: t.teks, due: t.due, selesai: false}));
      const pad = j.filter(t => t.dipadatkan).length; simpan(); render();
      toast(`${j.length} tugas dijadwalkan${pad ? `; ${pad} dipadatkan karena acara sudah dekat` : ''}`);
    },
    'tg-hapus': a => { S.tugas = S.tugas.filter(t => t.id !== a.dataset.id); simpan(); render(); },
    'dp-undi': undi,
    'dp-hapus': a => { S.pemenang = S.pemenang.filter(p => p.id !== a.dataset.id); simpan(); $('#dp-daftar').innerHTML = htmlPemenang(); },
    'hd-hapus': a => { S.hadiah = S.hadiah.filter(h => h.id !== a.dataset.id); simpan(); $('#hd-daftar').innerHTML = htmlHadiah(); },
    'contoh-muat': a => {
      if ((S.tamu.length || S.anggaran.items.length) && !confirm('Mengisi data contoh akan MENGGANTI semua data dashboard yang ada. Lanjutkan? (Unduh cadangan dulu bila perlu.)')) return;
      Simpan.replace(Contoh.buat(a.dataset.mode)); S = Simpan.state; usulan = []; rencana = null; saring = 'semua'; cariTeks = '';
      pindah('ringkas'); toast(a.dataset.mode === 'harih' ? 'Data contoh hari H dimuat' : 'Data contoh persiapan dimuat');
    },
    cetak: () => window.print(),
    'cadangan-unduh': () => unduh(`cadangan-undangan-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(S, null, 2), 'application/json'),
    reset: () => { if (prompt('Ini menghapus SEMUA data tamu, anggaran, tugas, dan isian undangan di browser ini.\nKetik HAPUS untuk melanjutkan.') === 'HAPUS') { Simpan.reset(); S = Simpan.state; render(); toast('Semua data dihapus'); } }
  };
  const UBAH = {
    'impor-berkas': async el => { const f = el.files[0]; if (!f) return; const t = await f.text(); imporBaris(parseImpor(t, /\.csv$/i.test(f.name))); el.value = ''; },
    'cadangan-impor': async el => {
      const f = el.files[0]; if (!f) return;
      try {
        const o = JSON.parse(await f.text());
        if (!o || !Array.isArray(o.tamu)) throw new Error('format');
        if (!confirm('Pulihkan cadangan ini? Seluruh data saat ini akan diganti.')) return;
        Simpan.replace(o); S = Simpan.state; render(); toast('Cadangan dipulihkan');
      } catch (e) { toast('Berkas bukan cadangan yang valid'); }
      el.value = '';
    }
  };

  document.addEventListener('click', e => {
    const a = e.target.closest('[data-aksi]');
    if (a && AKSI[a.dataset.aksi]) { e.preventDefault(); AKSI[a.dataset.aksi](a, e); }
  });
  $('#sapa').addEventListener('click', () => ($('#sapa').hidden = true));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') $('#sapa').hidden = true; });

  document.addEventListener('input', e => {
    const el = e.target;
    if (el.id === 'cari') { cariTeks = el.value; batas = 100; tampilTamu(); }
    else if (el.id === 'ci-q') tampilCari();
  });

  document.addEventListener('change', e => {
    const el = e.target;
    if (el.dataset.aksiUbah && UBAH[el.dataset.aksiUbah]) return UBAH[el.dataset.aksiUbah](el);
    if (el.id === 'saring') { saring = el.value; batas = 100; return tampilTamu(); }
    if (el.id === 'opt-suara') return (opt.suara = el.checked);
    if (el.id === 'opt-souv') return (opt.souv = el.checked);
    const t = el.dataset.t, f = el.dataset.f; if (!t || !f) return;
    const nilai = el.type === 'checkbox' ? el.checked : el.value;
    if (t === 'tamu') {
      const tr = el.closest('tr'), g = cari(tr.dataset.id); if (!g) return;
      if (f === 'pax') g.pax = Math.max(1, Math.min(20, parseInt(nilai, 10) || 1));
      else if (f === 'wa') { const w = Cerdas.waNorm(nilai); g.wa = nilai.trim() ? w.wa : ''; el.value = g.wa; el.classList.toggle('salah', !!g.wa && !w.valid); tr.querySelector('[data-aksi=wa]').disabled = !w.valid; }
      else if (f === 'nama') { g.nama = nilai.trim() ? Cerdas.parseNama(nilai).tampil : g.nama; el.value = g.nama; }
      else g[f] = nilai;
      if (f === 'rsvp') tr.className = 'r-' + (nilai || 'belum');
      simpan(); if (f === 'pax' || f === 'rsvp') segarHeader();
    } else if (t === 'usul') {
      const u = usulan[+el.dataset.i]; if (!u) return;
      if (f === 'pilih') u.pilih = nilai;
      else if (f === 'pax') u.pax = parseInt(nilai, 10) || 0;
      else if (f === 'tamuId') { u.tamuId = nilai || null; if (nilai) { u.pilih = true; tampilUsulan(); } }
      else u[f] = nilai;
    } else if (t === 'angtotal') { S.anggaran.total = +nilai || 0; simpan(); $('#ang-ringkas').innerHTML = htmlRingkasAng(); }
    else if (t === 'ang') {
      const i = S.anggaran.items.find(x => x.id === el.dataset.id); if (!i) return;
      i[f] = (f === 'nama') ? nilai : (f === 'lunas' ? nilai : Math.max(0, +nilai || 0));
      simpan(); $('#ang-ringkas').innerHTML = htmlRingkasAng();
      if (f === 'aktual' || f === 'estimasi') { const tr = el.closest('tr').querySelector('[data-f=aktual]'); tr.classList.toggle('salah', !!(i.estimasi && i.aktual > i.estimasi * 1.1)); }
    } else if (t === 'tg') { const x = S.tugas.find(y => y.id === el.dataset.id); if (!x) return; x[f] = nilai; simpan(); if (f === 'selesai') render(); }
    else if (t === 'atur') { S.atur[f] = Math.max(0, +nilai || 0); simpan(); if (f === 'katering') render(); }
    else if (t === 'sv') { S.souvenir[f] = Math.max(0, +nilai || 0); simpan(); render(); }
  });

  document.addEventListener('submit', e => {
    const f = e.target.dataset.form; if (!f) return;
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    if (f === 'tanya') { const q = $('#q').value.trim(); if (q) tampilJawab(q); }
    else if (f === 'tambah') {
      const nama = Cerdas.parseNama(d.nama).tampil, w = Cerdas.waNorm(d.wa);
      if (S.tamu.some(t => Cerdas.mirip(t.nama, nama) >= .95) && !confirm(`“${nama}” mirip dengan tamu yang sudah ada. Tetap tambahkan?`)) return;
      S.tamu.push({id: uid(), nama, wa: d.wa ? w.wa : '', kelompok: d.kelompok || Cerdas.tebakKelompok(nama), pax: parseInt(d.pax, 10) || Cerdas.tebakPax(d.nama), meja: (d.meja || '').trim(), acara: d.acara || '', rsvp: 'belum', doa: '', checkin: null});
      simpan(); e.target.reset(); e.target.hidden = true; tampilTamu(); segarHeader(); toast(`“${nama}” ditambahkan${d.wa && !w.valid ? '. Nomor WA tampaknya tidak valid.' : ''}`);
    }
    else if (f === 'ang-tambah') { S.anggaran.items.push({id: uid(), nama: d.nama.trim(), estimasi: Math.max(0, +d.estimasi || 0), aktual: 0, lunas: false}); simpan(); render(); }
    else if (f === 'tg-tambah') { S.tugas.push({id: uid(), teks: d.teks.trim(), due: d.due || '', selesai: false}); simpan(); render(); }
    else if (f === 'hadiah') { S.hadiah.push({id: uid(), dari: d.dari.trim(), jenis: d.jenis, nilai: Math.max(0, +d.nilai || 0), catatan: (d.catatan || '').trim()}); simpan(); e.target.reset(); $('#hd-daftar').innerHTML = htmlHadiah(); toast('Hadiah dicatat'); }
  });

  // Sinkron antar tab browser: muat ulang bila data berubah di jendela lain (mis. dari katalog)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    S = Simpan.reload();
    if (!$('#panel').contains(document.activeElement) || document.activeElement === document.body) render(); else segarHeader();
  });
  addEventListener('pagehide', hentiKamera);
  addEventListener('hashchange', () => { const h = location.hash.slice(1); if (h !== tab && TABS.some(t => t[0] === h)) pindah(h); });

  // Tautan ?contoh=persiapan atau ?contoh=harih memuat data contoh (meminta konfirmasi bila sudah ada data)
  const qc = new URLSearchParams(location.search).get('contoh');
  if (qc === 'persiapan' || qc === 'harih') {
    const ada = S.tamu.length || S.anggaran.items.length;
    if (!ada || confirm('Memuat data contoh akan mengganti data dashboard yang ada. Lanjutkan?')) { Simpan.replace(Contoh.buat(qc)); S = Simpan.state; }
    history.replaceState(null, '', location.pathname + location.hash);
  }
  render();
})();
