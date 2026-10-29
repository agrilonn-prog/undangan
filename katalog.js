/* Katalog template: filter, asisten rekomendasi, editor langsung, tautan massal.
   Bergantung pada: data.js, penyimpanan.js, smart.js */
(() => {
  const $ = s => document.querySelector(s), esc = Cerdas.esc;
  const BASE = new URL('undangan.html', location.href);
  const form = $('#form'), live = $('#live'), grid = $('#grid');
  const S = Simpan.state;
  let filter = 'semua', cocokIds = [];

  const toast = (t) => { const el = $('#toast'); el.textContent = t; el.classList.add('tampil'); clearTimeout(toast.h); toast.h = setTimeout(() => el.classList.remove('tampil'), 3200); };
  const salin = async teks => {
    try { await navigator.clipboard.writeText(teks); return true; }
    catch (e) { const a = Object.assign(document.createElement('textarea'), {value: teks}); document.body.append(a); a.select(); const ok = document.execCommand && document.execCommand('copy'); a.remove(); return !!ok; }
  };

  /* ----- Data formulir ----- */
  const baca = () => Object.fromEntries(new FormData(form));
  // Kolom yang dikosongkan sengaja dikirim sebagai nilai kosong bila bawaannya terisi (mis. rekening contoh),
  // supaya data contoh tidak bocor ke tamu. Pengecualian: nama tamu (to) dibiarkan memakai sapaan umum.
  function tautan(d, tambahan = {}) {
    const ak = window.BISNIS && BISNIS.aktif && Simpan.state.pesanan; // mode bisnis: tautan tamu memakai kode pesanan
    if (ak && 'to' in tambahan) {
      const w = new URL(BASE); w.searchParams.set('id', ak.id);
      ['to', 'meja', 'acara'].forEach(k => { const v = String(tambahan[k] || '').trim(); if (v) w.searchParams.set(k, v); });
      return w.href;
    }
    const u = new URL(BASE), semua = {...d, ...tambahan};
    Object.entries(semua).forEach(([k, v]) => {
      v = String(v == null ? '' : v).trim();
      if (k === 'to' && !v) return;
      if (v !== String(DEFAULT_DATA[k] == null ? '' : DEFAULT_DATA[k])) u.searchParams.set(k, v);
    });
    return u.href;
  }
  // Isi formulir dari data tersimpan (atau ?t=jawa di alamat halaman)
  $('#t').innerHTML = TEMPLATES.map(t => `<option value="${t.id}">${esc(t.nama)}</option>`).join('');
  const awalQ = new URLSearchParams(location.search);
  // Kunjungan pertama: formulir terisi data contoh lengkap (kecuali nama tamu)
  const {to: _to, ...contohAwal} = DEFAULT_DATA;
  Object.entries({...(Object.keys(S.data).length ? S.data : contohAwal), ...(awalQ.get('t') ? {t: awalQ.get('t')} : {})}).forEach(([k, v]) => { if (form.elements[k]) form.elements[k].value = v; });
  if (!form.elements.t.value) form.elements.t.value = TEMPLATES[0].id;

  /* ----- Rapikan isian secara cerdas saat selesai mengetik ----- */
  form.addEventListener('change', e => {
    const el = e.target, v = el.value.trim();
    if (!v) return;
    if (el.name === 'pria' || el.name === 'wanita') el.value = Cerdas.titleCase(v);
    else if (el.name === 'to') el.value = Cerdas.parseNama(v).tampil;
    else if (el.name === 'ortupria' || el.name === 'ortuwanita') el.value = v.split(/\s*&\s*/).map(x => Cerdas.parseNama(x).tampil).join(' & ');
    else if (el.name === 'wa') { const w = Cerdas.waNorm(v); el.value = w.wa; }
    else if (el.name === 'norek') el.value = v.replace(/[\s-]/g, '');
    else if (el.name === 'galeri') el.value = v.split(/[\s,]+/).filter(Boolean).join(', ');
    segarkan();
  });

  /* ----- Pratinjau langsung + simpan + pemeriksa ----- */
  let tunda;
  function segarkan(cepat) {
    const d = baca(), link = tautan(d);
    $('#link').value = link; $('#open').href = link;
    Simpan.reload(); // muat ulang dulu agar perubahan dari tab dashboard tidak tertimpa
    Simpan.state.data = {...d}; // simpan juga kolom kosong agar tidak kembali ke data contoh
    Simpan.save();
    $('#periksa').innerHTML = Cerdas.periksaForm(d, DEFAULT_DATA).map(m => `<p class="${m.t}">${esc(m.s)}</p>`).join('');
    clearTimeout(tunda);
    tunda = setTimeout(() => { if (live.getAttribute('src') !== link) live.src = link; }, cepat ? 0 : 450);
  }
  form.addEventListener('input', () => segarkan());
  form.addEventListener('submit', e => e.preventDefault());
  $('#copy').onclick = async () => { toast(await salin($('#link').value) ? 'Tautan undangan tersalin' : 'Gagal menyalin; salin manual dari kolom tautan'); };

  /* ----- Filter + kisi template ----- */
  $('#chips').innerHTML = Object.entries(FILTER).map(([k, v]) => `<button type="button" data-f="${k}" aria-pressed="${k === filter}">${esc(v)}</button>`).join('');
  $('#chips').onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    filter = b.dataset.f;
    [...$('#chips').children].forEach(x => x.setAttribute('aria-pressed', x === b));
    gambar();
  };
  function gambar() {
    const d = baca();
    let daftar = TEMPLATES.filter(t => filter === 'semua' || t.tag.includes(filter));
    if (cocokIds.length) daftar = [...daftar].sort((a, b) => (cocokIds.includes(b.id) ? 1 : 0) - (cocokIds.includes(a.id) ? 1 : 0));
    grid.innerHTML = daftar.map(t => {
      const prev = tautan({t: t.id, pria: d.pria, wanita: d.wanita, tanggal: d.tanggal, zona: d.zona, foto: d.foto});
      return `<article class="kartu ${cocokIds.includes(t.id) ? 'cocok' : ''}">
        ${cocokIds.includes(t.id) ? '<span class="lencana">Cocok untuk Anda</span>' : ''}
        <div class="prev"><iframe loading="lazy" tabindex="-1" aria-hidden="true" title="Pratinjau ${esc(t.nama)}" src="${esc(prev)}"></iframe></div>
        <div class="isi"><h3>${esc(t.nama)}</h3><p>${esc(t.desc)}</p>
          <div>${t.tag.map(x => `<span class="badge">${esc(FILTER[x] || x)}</span>`).join('')}</div>
          <button type="button" class="btn kecil" data-pilih="${t.id}">Pakai template ini</button></div></article>`;
    }).join('') || '<p class="kosong">Tidak ada template di kategori ini.</p>';
    skala();
  }
  function skala() { const p = grid.querySelector('.prev'); if (p) grid.style.setProperty('--s', (p.clientWidth / 390).toFixed(4)); }
  addEventListener('resize', skala);
  function pilih(id) {
    form.elements.t.value = id; segarkan(true);
    $('#editor').scrollIntoView({behavior: 'smooth'});
    toast('Template “' + TEMPLATES.find(t => t.id === id).nama + '” dipilih');
  }
  grid.onclick = e => { const b = e.target.closest('[data-pilih]'); if (b) pilih(b.dataset.pilih); };
  form.elements.t.addEventListener('change', () => segarkan(true));

  /* ----- Asisten rekomendasi ----- */
  function rekomendasi() {
    const teks = $('#cerita-rek').value, hasil = Cerdas.rekomendasiTemplate(teks, TEMPLATES), box = $('#rek-hasil');
    cocokIds = hasil.map(h => h.id);
    if (!teks.trim()) { box.innerHTML = '<p>Tulis dulu sedikit cerita tentang pernikahan Anda.</p>'; cocokIds = []; gambar(); return; }
    if (!hasil.length) { box.innerHTML = '<p>Belum ada petunjuk yang cukup. Coba sebut agama, daerah atau adat, dan suasana yang diinginkan (misalnya sederhana, outdoor, vintage, atau gamer).</p>'; gambar(); return; }
    box.innerHTML = hasil.map((h, i) => {
      const t = TEMPLATES.find(x => x.id === h.id);
      return `<article class="${i === 0 ? 'utama' : ''}"><small>${i === 0 ? 'Paling cocok' : 'Alternatif ' + i}</small><h3>${esc(t.nama)}</h3>
        <div>${h.alasan.map(a => `<span class="badge">${esc(a)}</span>`).join('')}</div>
        <button type="button" class="btn kecil" data-pilih="${t.id}">Pakai</button></article>`;
    }).join('');
    gambar();
  }
  $('#rek-btn').onclick = rekomendasi;
  $('#cerita-rek').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); rekomendasi(); } });
  $('#rek-hasil').onclick = e => { const b = e.target.closest('[data-pilih]'); if (b) pilih(b.dataset.pilih); };

  /* ----- Tautan massal untuk tamu ----- */
  let daftarTamu = [];
  function ctx() { const d = {...DEFAULT_DATA, ...Object.fromEntries(Object.entries(baca()).filter(([, v]) => v))}; return {tema: d.t, pria: d.pria, wanita: d.wanita, tanggal: d.tanggal, zona: d.zona, tempat: d.tempat, alamat: d.alamat}; }
  $('#bulk').onclick = () => {
    const d = baca(), c = ctx();
    daftarTamu = $('#tamu').value.split('\n').map(x => x.trim()).filter(Boolean).map(baris => {
      let [nama, wa = '', meja = '', acara = ''] = baris.split('|').map(x => x.trim());
      if (/^(akad|resepsi)$/i.test(meja) && !acara) { acara = meja; meja = ''; }
      acara = /^(akad|resepsi)$/i.test(acara) ? acara.toLowerCase() : '';
      const p = Cerdas.parseNama(nama), w = Cerdas.waNorm(wa);
      const tampil = p.tampil, link = tautan(d, {to: tampil, meja, acara});
      return {nama: tampil, wa: w.valid ? w.wa : '', waSalah: wa && !w.valid ? w.alasan : '', meja, acara, link, kelompok: Cerdas.tebakKelompok(tampil), pax: Cerdas.tebakPax(tampil)};
    });
    $('#hasil').innerHTML = daftarTamu.map((g, i) => {
      const pesan = Cerdas.pesanWA(g, c);
      return `<li><b>${esc(g.nama)}</b>
        ${g.wa ? `<a class="btn kecil" target="_blank" rel="noopener" href="https://wa.me/${g.wa}?text=${encodeURIComponent(pesan)}">Kirim WhatsApp</a>` : (g.waSalah ? `<span class="badge">Nomor tidak valid: ${esc(g.waSalah)}</span>` : '')}
        <button type="button" class="btn kecil ghost" data-salin="${i}">Salin tautan</button>
        <button type="button" class="btn kecil ghost" data-pesan="${i}">Salin pesan</button>
        <small>${esc(g.link)}</small></li>`;
    }).join('');
    $('#salinsemua').hidden = $('#kedash').hidden = !daftarTamu.length;
    toast(daftarTamu.length ? `${daftarTamu.length} tautan dibuat` : 'Isi nama tamu dulu, satu per baris');
  };
  $('#hasil').onclick = async e => {
    const a = e.target.closest('[data-salin],[data-pesan]'); if (!a) return;
    const g = daftarTamu[+(a.dataset.salin ?? a.dataset.pesan)];
    const ok = await salin(a.dataset.salin != null ? g.link : Cerdas.pesanWA(g, ctx()));
    toast(ok ? (a.dataset.salin != null ? 'Tautan tersalin' : 'Pesan tersalin') : 'Gagal menyalin');
  };
  $('#salinsemua').onclick = async () => toast(await salin(daftarTamu.map(g => `${g.nama} — ${g.link}`).join('\n')) ? 'Semua tautan tersalin' : 'Gagal menyalin');
  $('#kedash').onclick = () => {
    Simpan.reload(); const tamu = Simpan.state.tamu; let baru = 0, lewat = 0;
    daftarTamu.forEach(g => {
      const dup = tamu.some(t => (g.wa && Cerdas.waNorm(t.wa).wa === g.wa) || Cerdas.mirip(t.nama, g.nama) >= .95);
      if (dup) { lewat++; return; }
      tamu.push({id: Simpan.uid(), nama: g.nama, wa: g.wa, kelompok: g.kelompok, pax: g.pax, meja: g.meja, acara: g.acara, rsvp: 'belum', doa: '', checkin: null}); baru++;
    });
    Simpan.save();
    toast(`${baru} tamu masuk ke dashboard${lewat ? `, ${lewat} dilewati karena sudah ada` : ''}`);
  };

  /* ----- Mode bisnis: pesan & bayar (aktif jika BISNIS.aktif di bisnis.js) ----- */
  const B = window.BISNIS || {};
  if (B.aktif && B.api) {
    $('#pesan').hidden = false; $('#copy').textContent = 'Salin tautan pratinjau';
    const rp = n => 'Rp ' + Number(n || 0).toLocaleString('id-ID');
    const pk = $('#paket');
    pk.innerHTML = (B.paket || []).map(p => `<option value="${esc(p.id)}">${esc(p.nama)} — ${rp(p.harga)}${p.fitur ? ' · ' + esc(p.fitur) : ''}</option>`).join('');
    const acak = n => { const h = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; return [...crypto.getRandomValues(new Uint8Array(n))].map(x => h[x % h.length]).join(''); };
    const dataPesan = () => { const {to, meja, acara, ...sisa} = baca(); return sisa; };
    const ak = () => Simpan.state.pesanan;
    let status = '', cek;
    const kirim = async (body, verifikasi) => {
      try { return await (await fetch(B.api, {method: 'POST', headers: {'Content-Type': 'text/plain'}, body: JSON.stringify(body)})).json(); }
      catch (e) {
        if (!verifikasi) return {ok: false};
        await new Promise(r => setTimeout(r, 1200)); // respons mungkin terblokir; cek apakah pesanan tetap masuk
        try { const j = await (await fetch(B.api + '?pesanan=' + encodeURIComponent(body.id))).json(); return {ok: !!j.ok}; } catch (x) { return {ok: false}; }
      }
    };
    function tampilPesanan() {
      const a = ak(), box = $('#pesanhasil');
      $('#pesanbtn').textContent = a ? 'Simpan perubahan ke pesanan' : 'Pesan & bayar';
      if (!a) { box.innerHTML = ''; return; }
      const p = (B.paket || []).find(x => x.id === a.paket) || {}, lunas = status === 'lunas', by = B.bayar || {};
      const akhir = new URL(BASE); akhir.searchParams.set('id', a.id);
      const wa = `Halo ${B.nama || ''}, saya sudah membayar pesanan ${a.id} (${p.nama || a.paket}, ${rp(p.harga)}). Mohon diaktifkan.`;
      box.innerHTML = `<p><b>Pesanan ${esc(a.id)}</b> · ${esc(p.nama || a.paket)} · ${rp(p.harga)}</p>
        <p class="status ${lunas ? 'lunas' : ''}">${lunas ? '✅ Lunas. Undangan aktif dan siap dibagikan.' : '⏳ Menunggu pembayaran. Undangan aktif setelah pembayaran dikonfirmasi.'}</p>
        ${lunas ? '' : `<div class="bayar"><p>${esc(by.rekening || '')}</p>${by.qris ? `<img src="${esc(by.qris)}" alt="QRIS pembayaran">` : ''}<p>${esc(by.catatan || 'Cantumkan kode pesanan saat membayar.')}</p><a class="btn" target="_blank" rel="noopener" href="https://wa.me/${esc(B.wa || '')}?text=${encodeURIComponent(wa)}">Konfirmasi lewat WhatsApp</a></div>`}
        <div class="out"><input readonly value="${esc(akhir.href)}" aria-label="Tautan undangan final"><button type="button" class="btn" id="salinfinal">Salin tautan undangan</button><a class="btn ghost" target="_blank" rel="noopener" href="${esc(akhir.href)}">Buka</a></div>`;
    }
    async function periksa() {
      const a = ak(); if (!a) return;
      try { const j = await (await fetch(B.api + '?pesanan=' + encodeURIComponent(a.id))).json(); if (j.ok && j.status !== status) { status = j.status; tampilPesanan(); } } catch (e) {}
      if (status === 'lunas') clearInterval(cek);
    }
    const mulaiCek = () => { clearInterval(cek); periksa(); cek = setInterval(periksa, 20000); };
    $('#pesanbtn').onclick = async () => {
      const btn = $('#pesanbtn'), a = ak(), d = dataPesan();
      if (!d.pria || !d.wanita) return toast('Isi nama kedua mempelai dulu');
      btn.disabled = true;
      if (a) { const r = await kirim({aksi: 'ubah', id: a.id, tk: a.tk, data: d}, false); btn.disabled = false; return toast(r.ok ? 'Perubahan tersimpan di pesanan' : 'Gagal menyimpan. Coba lagi'); }
      const kontak = Cerdas.waNorm($('#kontak').value);
      if (!kontak.valid) { btn.disabled = false; return toast('Isi nomor WhatsApp Anda yang valid'); }
      const id = acak(6), tk = acak(16), paket = pk.value;
      const r = await kirim({aksi: 'pesan', id, tk, paket, kontak: kontak.wa, data: d}, true);
      btn.disabled = false;
      if (!r.ok) return toast('Pesanan gagal dibuat. Periksa koneksi lalu coba lagi');
      Simpan.reload(); Simpan.state.pesanan = {id, tk, paket}; Simpan.save();
      status = 'menunggu'; tampilPesanan(); mulaiCek();
      toast('Pesanan dibuat. Silakan lakukan pembayaran');
    };
    $('#pesanhasil').onclick = async e => { if (e.target.id === 'salinfinal') toast(await salin(e.target.previousElementSibling.value) ? 'Tautan undangan tersalin' : 'Gagal menyalin'); };
    if (ak()) { tampilPesanan(); mulaiCek(); }
  }

  gambar(); segarkan(true);
})();
