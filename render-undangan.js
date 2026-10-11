const q = Object.fromEntries(new URLSearchParams(location.search));
const demo = !q.pria; // tanpa data mempelai: tampilkan contoh lengkap template
const d = { ...DEFAULT_DATA, ...(demo && typeof CONTOH !== 'undefined' && CONTOH[q.t] || {}), ...q };
const T = TEMPLATES.find(t => t.id === d.t) || TEMPLATES[0];
document.body.className = 't-' + T.id;
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const http = s => /^https?:\/\//.test(s);
const med = s => /^(https?:\/\/|assets\/|data:)/.test(s); // foto & musik boleh berkas lokal
const when = new Date(d.tanggal), res = d.resepsi ? new Date(d.resepsi) : new Date(+when + 72e5);
// Jam acara diketik sebagai waktu setempat (WIB/WITA/WIT); hitung mundur memakai waktu mutlak
const ZON = {WIB:'+07:00', WITA:'+08:00', WIT:'+09:00'}, zona = ZON[d.zona] ? d.zona : 'WIB';
const abs = new Date(d.tanggal.slice(0,16) + ':00' + ZON[zona]), absRes = new Date(+abs + (+res - +when));
const fmtD = x => x.toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
const fmtT = x => x.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'}).replace(':','.') + ' ' + zona;

// Penanggalan sesuai budaya: Hijriah, pasaran Jawa, Imlek
function kal(x) {
  try {
    if (['islami','minang'].includes(T.id)) return new Intl.DateTimeFormat('id-u-ca-islamic-umalqura',{day:'numeric',month:'long',year:'numeric'}).format(x) + ' H';
    if (T.id === 'jawa') return 'Hari pasaran ' + ['Legi','Pahing','Pon','Wage','Kliwon'][((3 + Math.floor(Date.UTC(x.getFullYear(),x.getMonth(),x.getDate())/864e5)) % 5 + 5) % 5];
    if (T.id === 'tionghoa') { const [a,b] = new Intl.DateTimeFormat('id-u-ca-chinese',{day:'numeric',month:'numeric'}).format(x).split(/\D+/); return `Penanggalan Imlek: tanggal ${a} bulan ${b}`; }
  } catch (e) {}
  return '';
}
const jam = new Date().getHours();
const sapa = jam < 11 ? 'Selamat pagi' : jam < 15 ? 'Selamat siang' : jam < 18 ? 'Selamat sore' : 'Selamat malam';
const nama = `${esc(d.pria)} <span>&amp;</span> ${esc(d.wanita)}`;
const KEY = 'ucapan:' + d.pria + d.wanita + d.tanggal;

const tgl = x => x.toLocaleDateString('id-ID',{month:'long',year:'numeric'});
const foto = d.galeri ? d.galeri.split(',').map(s => s.trim()).filter(med) : [];
const adaRek = d.bank && d.norek;
const loop = `${esc(d.pria)} &amp; ${esc(d.wanita)} ✦ ${when.getDate()}.${when.getMonth()+1}.${when.getFullYear()} ✦ `.repeat(6);
const cerita = (d.cerita || '').split(';').map(x => x.split('|').map(y => y.trim())).filter(a => a[0] && a[1]);
const tamuKhusus = d.to !== DEFAULT_DATA.to;
const menu = [['home','🏠','Beranda'],...(cerita.length?[['cerita','💞','Kisah']]:[]),['acara','📅','Acara'],...(foto.length?[['galeri','🖼','Galeri']]:[]),...(adaRek?[['hadiah','🎁','Hadiah']]:[]),...(tamuKhusus?[['tiket','🎫','Tiket']]:[]),['foto','📸','Foto'],['ucapan','💬','Ucapan']];
const profil = (d.ortupria || d.ortuwanita) ? `<section class="blok" id="mempelai"><h3 class="r">Mempelai</h3><div class="bento r">
  <article class="glass"><h4>Mempelai pria</h4><div class="jam" style="font-size:1.9rem">${esc(d.pria)}</div><small>Putra dari ${esc(d.ortupria)}</small></article>
  <article class="glass"><h4>Mempelai wanita</h4><div class="jam" style="font-size:1.9rem">${esc(d.wanita)}</div><small>Putri dari ${esc(d.ortuwanita)}</small></article></div></section>` : '';
const kisah = cerita.length ? `<section class="blok" id="cerita"><h3 class="r">Kisah kami</h3><ol class="alur">${cerita.map(([y,j,t='']) => `<li class="r"><b>${esc(y)}</b><h4>${esc(j)}</h4><p>${esc(t)}</p></li>`).join('')}</ol></section>` : '';
const akad = d.acara !== 'resepsi' ? `<article class="glass"><h4>Akad / pemberkatan</h4><div class="jam">${fmtT(when)}</div><small>${fmtD(when)}</small></article>` : '';
const resepsi = d.acara !== 'akad' ? `<article class="glass"><h4>Resepsi</h4><div class="jam">${fmtT(res)}</div><small>${fmtD(res)}</small></article>` : '';
const tiket = tamuKhusus ? `<section class="blok" id="tiket"><h3 class="r">Tiket masuk</h3><div class="rek glass r"><div id="qr" class="qr"></div><p><strong>${esc(d.to)}</strong>${d.meja ? ` · Meja ${esc(d.meja)}` : ''}</p><small>Tunjukkan kode ini kepada penerima tamu saat tiba.</small></div></section>` : '';
const live = http(d.live) ? `<section class="blok" id="live"><h3 class="r">Siaran langsung</h3><p class="r">Tidak bisa hadir? Saksikan acara dari mana saja.</p><a class="btn r" href="${esc(d.live)}" target="_blank" rel="noopener">Tonton siaran langsung</a></section>` : '';
const game = (T.id === 'pixel' || d.game) ? `<section class="blok" id="main"><h3 class="r">Mini game</h3><p class="r">Tangkap sebanyak mungkin hati dalam 20 detik. Geser keranjang dengan jari.</p><canvas id="gm" width="320" height="400"></canvas><p id="skor">Siap main?</p><button class="btn" id="gmulai">Main game</button></section>` : '';
const catatan = d.catatan ? `<div class="pb" id="cat" hidden><div class="glass tamu"><p>${esc(d.catatan)}</p><button class="btn" id="cat-ok">Mengerti</button></div></div>` : '';
const booth = `<section class="blok" id="foto"><h3 class="r">Photobooth</h3><p class="r">Berfoto langsung dari undangan, lalu simpan hasilnya.</p><button class="btn r" id="pb-buka">Buka kamera</button></section>
<div class="pb" id="pb" hidden><video id="pb-v" autoplay playsinline muted></video><p id="pb-err"></p><div><button class="btn" id="pb-ambil">Ambil &amp; simpan foto</button><button class="btn kecil" id="pb-tutup">Tutup</button></div></div>`;

$('#app').innerHTML = `
<section class="cover" id="cover" data-l="${T.lambang}">
  <div class="blob"></div><div class="blob b2"></div>
  <div>
    <p>${sapa}. Kami menikah</p>
    <h1>${esc(d.pria)}<span>&amp;</span>${esc(d.wanita)}</h1>
    <div class="glass tamu"><small>Kepada Yth.</small><br><strong>${esc(d.to)}</strong></div>
    <button class="btn" id="buka">Buka undangan</button>
  </div>
</section>
<button id="musik" aria-label="Putar atau jeda musik">♫</button><button id="bhs" aria-label="Ganti bahasa">EN</button>
<nav class="nav glass" aria-label="Navigasi undangan">${menu.map(([i,e,l]) => `<a href="#${i}"><i>${e}</i>${l}</a>`).join('')}</nav>
<main>
  <section class="blok" id="home">
    <p class="salam r">${T.salam}</p>
    <div class="tgl r"><b>${String(when.getDate()).padStart(2,'0')}</b><span><small>${when.toLocaleDateString('id-ID',{weekday:'long'})}</small>${tgl(when)}</span></div>
    <p class="kal r">${kal(when)}</p>
    <div class="count r" id="count"></div>
    <p id="status" class="kal"></p>
    <button class="btn kecil" id="ics">Tambah ke kalender</button><button class="btn kecil" id="bagi">Bagikan</button><button class="btn kecil" id="gbr">Simpan gambar story</button>
  </section>
  <div class="marquee" aria-hidden="true"><span>${loop}</span></div>
  <section class="blok"><blockquote class="r">${T.kutipan}${T.sumber ? `<cite>${T.sumber}</cite>` : ''}</blockquote></section>
  <div class="pola"></div>
  ${profil}${kisah}<section class="blok" id="acara"><h3 class="r">Acara</h3>
    <div class="bento r">
      ${akad}${resepsi}
      <article class="glass lebar"><h4>Lokasi</h4><strong>${esc(d.tempat)}</strong><small>${esc(d.alamat)}</small>
        ${http(d.maps) ? `<a class="btn kecil" href="${esc(d.maps)}" target="_blank" rel="noopener">Buka peta</a>` : ''}</article>
    </div>
  </section>
  ${foto.length ? `<section class="blok" id="galeri"><h3 class="r">Galeri</h3><div class="gal r">${foto.map(f => `<img src="${esc(f)}" alt="Foto prewedding" loading="lazy">`).join('')}</div></section>` : ''}
  ${adaRek ? `<section class="blok" id="hadiah"><h3 class="r">Amplop digital</h3><div class="rek glass r"><p>${esc(d.bank)} a.n. ${esc(d.an)}</p><b>${esc(d.norek)}</b><button class="btn kecil" id="salin">Salin nomor rekening</button></div></section>` : ''}
  ${live}${game}${tiket}${booth}${catatan}
  <section class="blok" id="ucapan"><h3 class="r">Ucapan &amp; kehadiran</h3>
    <form class="rsvp glass r" id="rsvp">
      <input name="nama" placeholder="Nama Anda" value="${d.to === DEFAULT_DATA.to ? '' : esc(d.to)}" required>
      <select name="hadir"><option>Hadir</option><option>Tidak hadir</option><option>Masih ragu</option></select>
      <input type="hidden" name="stiker" id="stiker">
      <div class="stiker" id="stikers">${['💐','🤍','🎉','🤲','😍'].map(e => `<button type="button" data-e="${e}">${e}</button>`).join('')}</div>
      <div class="stiker" id="tmpl">${['Selamat menempuh hidup baru! Semoga bahagia selalu dan dilimpahi berkah.','Turut berbahagia untuk kalian berdua. Doa terbaik menyertai.','Maaf belum bisa hadir. Semoga acaranya lancar dan penuh kebahagiaan.'].map((t,i) => `<button type="button" class="chip-t" data-t="${esc(t)}">Contoh ${i+1}</button>`).join('')}</div>
      <textarea name="doa" id="doa" rows="3" placeholder="Ucapan dan doa"></textarea>
      <button class="btn">${/^\d{8,15}$/.test(d.wa) ? 'Kirim lewat WhatsApp' : 'Kirim ucapan'}</button>
    </form>
    <ul class="ucapan" id="ucapan-list"></ul>
  </section>
  <footer class="blok"><p class="r">Merupakan kehormatan bagi kami apabila Anda berkenan hadir dan memberikan doa restu.</p><h2 class="r">${nama}</h2></footer>
</main>`;

// Animasi muncul + menu aktif
const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && (e.target.classList.add('v'), io.unobserve(e.target))), {threshold:.15});
document.querySelectorAll('.r').forEach(el => io.observe(el));
const nav = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && document.querySelectorAll('.nav a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id))), {rootMargin:'-45% 0px -50% 0px'});
document.querySelectorAll('main section[id]').forEach(el => nav.observe(el));

if (med(d.foto)) $('#cover').style.setProperty('--foto', `url("${encodeURI(d.foto)}")`);

// Musik latar
let audio;
if (med(d.musik)) { audio = new Audio(d.musik); audio.loop = true; $('#musik').classList.add('ada'); }
$('#musik').onclick = () => audio.paused ? audio.play() : audio.pause();
$('#buka').onclick = () => { $('#cover').classList.add('tutup'); document.body.classList.add('terbuka'); audio && audio.play().catch(() => {}); if ($('#cat')) setTimeout(() => ($('#cat').hidden = false), 900); };

// Hitung mundur + status acara
function tick() {
  let s = Math.max(0, Math.floor((abs - Date.now()) / 1000));
  $('#count').innerHTML = [['hari',86400],['jam',3600],['menit',60],['detik',1]].map(([n,v]) => { const x = Math.floor(s / v); s %= v; return `<div class="glass"><b>${x}</b>${n}</div>`; }).join('');
  const now = Date.now();
  $('#status').textContent = now > +absRes + 72e5 ? 'Acara telah selesai. Terima kasih atas doa Anda.' : now >= +abs ? 'Acara sedang berlangsung.' : '';
}
tick(); setInterval(tick, 1000);

// Kalender (.ics)
$('#ics').onclick = () => {
  const z = x => x.toISOString().replace(/[-:]|\.\d{3}/g, ''), e = s => s.replace(/[,;]/g, '\\$&');
  const t = ['BEGIN:VCALENDAR','VERSION:2.0','BEGIN:VEVENT','DTSTART:'+z(abs),'DTEND:'+z(new Date(+absRes+72e5)),'SUMMARY:'+e(`Pernikahan ${d.pria} & ${d.wanita}`),'LOCATION:'+e(`${d.tempat}, ${d.alamat}`),'END:VEVENT','END:VCALENDAR'].join('\r\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([t], {type:'text/calendar'})); a.download = 'pernikahan.ics'; a.click();
};
$('#bagi').onclick = () => navigator.share ? navigator.share({title:`Undangan ${d.pria} & ${d.wanita}`, url:location.href}) : navigator.clipboard.writeText(location.href).then(() => ($('#bagi').textContent = 'Tautan tersalin'));
if ($('#salin')) $('#salin').onclick = e => navigator.clipboard.writeText(d.norek).then(() => (e.target.textContent = 'Tersalin'));

// Ucapan (tersimpan di perangkat ini) + RSVP WhatsApp
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } };
const show = () => ($('#ucapan-list').innerHTML = load().map(u => `<li class="glass"><b>${esc(u.n.charAt(0).toUpperCase())}</b><div><small>${esc(u.n)} · ${esc(u.h)}</small>${esc(u.t)}</div></li>`).join(''));
$('#rsvp').onsubmit = e => {
  e.preventDefault();
  const f = new FormData(e.target), n = f.get('nama'), h = f.get('hadir'), t = ((f.get('stiker') || '') + ' ' + (f.get('doa') || '')).trim();
  try { localStorage.setItem(KEY, JSON.stringify([{n,h,t}, ...load()].slice(0, 30))); } catch (x) {}
  show(); e.target.reset();
  if (/^\d{8,15}$/.test(d.wa)) window.open(`https://wa.me/${d.wa}?text=${encodeURIComponent(`Halo, saya ${n}. Konfirmasi: ${h}.\n${t}`)}`, '_blank');
};
show();

// Warna & huruf kustom (warna dibuat terbaca otomatis)
const HUR = {elegan:"'Cormorant Garamond',serif",klasik:"'Playfair Display',serif",modern:"'Poppins',sans-serif",tegas:"'Cinzel',serif",arab:"'Amiri',serif"};
const hx = (d.warna || '').replace('#', '');
if (/^[0-9a-f]{6}$/i.test(hx)) { const [r,g,b] = [0,2,4].map(i => parseInt(hx.substr(i,2),16)); document.body.style.setProperty('--ac','#'+hx); document.body.style.setProperty('--bt',(r*299+g*587+b*114)/1000 > 150 ? '#161616' : '#fff'); }
if (HUR[d.huruf]) document.body.style.setProperty('--hf', HUR[d.huruf]);

// Tiket QR untuk check-in
if ($('#qr') && window.QRCode) new QRCode($('#qr'), {text:`UND|${d.to}|${d.meja || ''}`, width:180, height:180});

// Stiker & contoh ucapan
$('#stikers').onclick = e => { const b = e.target.closest('button'); if (!b) return; $('#stiker').value = b.dataset.e; [...$('#stikers').children].forEach(x => x.classList.toggle('on', x === b)); };
$('#tmpl').onclick = e => { const b = e.target.closest('button'); if (b) $('#doa').value = b.dataset.t; };

// Virtual photobooth
let strm;
$('#pb-buka').onclick = async () => { $('#pb').hidden = false; try { strm = await navigator.mediaDevices.getUserMedia({video:{facingMode:'user'}}); $('#pb-v').srcObject = strm; } catch (e) { $('#pb-err').textContent = 'Kamera tidak bisa diakses. Izinkan akses kamera di browser.'; } };
const tutupPb = () => { $('#pb').hidden = true; strm && strm.getTracks().forEach(t => t.stop()); };
$('#pb-tutup').onclick = tutupPb;
$('#pb-ambil').onclick = () => {
  const v = $('#pb-v'); if (!v.videoWidth) return;
  const w = 720, h = 960, c = Object.assign(document.createElement('canvas'), {width:w, height:h}), x = c.getContext('2d'), cs = getComputedStyle(document.body);
  const tr = w / h, vr = v.videoWidth / v.videoHeight; let sw = v.videoWidth, sh = v.videoHeight, sx = 0, sy = 0;
  if (vr > tr) { sw = sh * tr; sx = (v.videoWidth - sw) / 2; } else { sh = sw / tr; sy = (v.videoHeight - sh) / 2; }
  x.save(); x.translate(w, 0); x.scale(-1, 1); x.drawImage(v, sx, sy, sw, sh, 0, 0, w, h); x.restore();
  x.strokeStyle = cs.getPropertyValue('--ac').trim() || '#c8a24a'; x.lineWidth = 28; x.strokeRect(14, 14, w - 28, h - 28);
  x.fillStyle = 'rgba(0,0,0,.5)'; x.fillRect(14, h - 190, w - 28, 176);
  x.fillStyle = '#fff'; x.textAlign = 'center'; x.font = '700 56px ' + (cs.getPropertyValue('--hf') || 'serif'); x.fillText(`${d.pria} & ${d.wanita}`, w / 2, h - 105);
  x.font = '600 28px sans-serif'; x.fillText(fmtD(when), w / 2, h - 55);
  Object.assign(document.createElement('a'), {href:c.toDataURL('image/png'), download:'photobooth.png'}).click();
};

// Catatan khusus
if ($('#cat')) $('#cat-ok').onclick = () => ($('#cat').hidden = true);

// Dua bahasa (label antarmuka)
const EN = {'Buka undangan':'Open invitation','Kepada Yth.':'Dear','Mempelai':'The Couple','Mempelai pria':'Groom','Mempelai wanita':'Bride','Kisah kami':'Our Story','Acara':'Events','Akad / pemberkatan':'Ceremony','Resepsi':'Reception','Lokasi':'Location','Buka peta':'Open map','Galeri':'Gallery','Amplop digital':'Digital Gift','Salin nomor rekening':'Copy account number','Tiket masuk':'Entry Ticket','Buka kamera':'Open camera','Ucapan & kehadiran':'Wishes & RSVP','Hadir':'Attending','Tidak hadir':'Not attending','Masih ragu':'Not sure','Kirim ucapan':'Send wishes','Kirim lewat WhatsApp':'Send via WhatsApp','hari':'days','jam':'hours','menit':'minutes','detik':'seconds','Tambah ke kalender':'Add to calendar','Bagikan':'Share','Simpan gambar story':'Save story image','Beranda':'Home','Kisah':'Story','Hadiah':'Gift','Tiket':'Ticket','Foto':'Photo','Ucapan':'Wishes','Siaran langsung':'Live stream','Tonton siaran langsung':'Watch live','Mini game':'Mini game','Main game':'Play','Mengerti':'Got it','Tutup':'Close','Ambil & simpan foto':'Capture & save','Berfoto langsung dari undangan, lalu simpan hasilnya.':'Take a photo right here and save it.','Merupakan kehormatan bagi kami apabila Anda berkenan hadir dan memberikan doa restu.':'It would be an honor to have you celebrate with us.','Tunjukkan kode ini kepada penerima tamu saat tiba.':'Show this code to the host when you arrive.'};
var en = d.bahasa === 'en'; const orig = new WeakMap();
function tr(root) {
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n;
  while ((n = w.nextNode())) { const t = n.nodeValue.trim(); if (!t) continue; if (!orig.has(n)) orig.set(n, n.nodeValue); const o = orig.get(n).trim(); n.nodeValue = en && EN[o] ? orig.get(n).replace(o, EN[o]) : orig.get(n); }
}
$('#bhs').textContent = en ? 'ID' : 'EN'; if (en) tr($('#app'));
$('#bhs').onclick = () => { en = !en; $('#bhs').textContent = en ? 'ID' : 'EN'; tr($('#app')); };
setInterval(() => en && tr($('#count')), 1000);

// Gambar story 1080x1920
$('#gbr').onclick = () => {
  const w = 1080, h = 1920, c = Object.assign(document.createElement('canvas'), {width:w, height:h}), x = c.getContext('2d'), cs = getComputedStyle(document.body);
  const ac = cs.getPropertyValue('--ac').trim() || '#c8a24a', bg = cs.getPropertyValue('--bg').trim() || '#fff', fg = cs.getPropertyValue('--fg').trim() || '#222', hf = cs.getPropertyValue('--hf') || 'serif';
  x.fillStyle = bg; x.fillRect(0, 0, w, h); const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, bg); g.addColorStop(1, ac); x.globalAlpha = .3; x.fillStyle = g; x.fillRect(0, 0, w, h); x.globalAlpha = 1;
  x.strokeStyle = ac; x.lineWidth = 6; x.strokeRect(50, 50, w - 100, h - 100); x.textAlign = 'center';
  const t = (s, y, px, col, wt = 700, fam = hf) => { px = +px; do { x.font = `${wt} ${px}px ${fam}`; px -= 6; } while (x.measureText(s).width > w - 200 && px > 30); x.fillStyle = col; x.fillText(s, w / 2, y); };
  t('KAMI MENIKAH', 420, 40, fg, 500, 'sans-serif'); t(d.pria, 720, 150, fg); t('&', 850, 90, ac, 500); t(d.wanita, 1010, 150, fg);
  t(fmtD(when), 1230, 52, ac, 600, 'sans-serif'); t(fmtT(when), 1300, 44, fg, 500, 'sans-serif'); t(d.tempat, 1400, 44, fg, 500, 'sans-serif');
  if (tamuKhusus) { t('Kepada Yth.', 1600, 40, fg, 500, 'sans-serif'); t(d.to, 1690, 64, fg, 700, 'sans-serif'); }
  Object.assign(document.createElement('a'), {href:c.toDataURL('image/png'), download:'undangan-story.png'}).click();
};

const hemat = matchMedia('(prefers-reduced-motion: reduce)').matches;
// Salju (tema Snowfall)
if (T.id === 'salju' && !hemat) {
  const c = Object.assign(document.createElement('canvas'), {id:'salju'}); document.body.append(c); const x = c.getContext('2d'); let W, H;
  const rs = () => { W = c.width = innerWidth; H = c.height = innerHeight; }; rs(); addEventListener('resize', rs);
  const p = Array.from({length:70}, () => ({x:Math.random() * W, y:Math.random() * H, r:Math.random() * 3 + 1, v:Math.random() + .5}));
  (function f() { x.clearRect(0, 0, W, H); x.fillStyle = '#9bb9e3'; p.forEach(o => { o.y += o.v; o.x += Math.sin(o.y / 40) * .4; if (o.y > H) { o.y = -5; o.x = Math.random() * W; } x.beginPath(); x.arc(o.x, o.y, o.r, 0, 7); x.fill(); }); requestAnimationFrame(f); })();
}
// Gulir otomatis (tema Sinematik)
if (T.id === 'sinematik') {
  const b = Object.assign(document.createElement('button'), {id:'auto', className:'btn kecil', textContent:'▶ Gulir otomatis'}); document.body.append(b); let a = 0;
  const stop = () => { a = 0; b.textContent = '▶ Gulir otomatis'; };
  b.onclick = () => { a = !a; b.textContent = a ? '⏸ Jeda' : '▶ Gulir otomatis'; };
  addEventListener('wheel', stop); addEventListener('touchstart', stop);
  (function s() { if (a) scrollBy(0, 1); requestAnimationFrame(s); })();
}
// Mini game tangkap hati
if ($('#gm')) {
  const c = $('#gm'), x = c.getContext('2d'); let run = 0, sk = 0, px = 160, hs = [], t0 = 0;
  const gerak = e => { const r = c.getBoundingClientRect(), cx = (e.touches ? e.touches[0].clientX : e.clientX) - r.left; px = Math.max(30, Math.min(290, cx * 320 / r.width)); };
  c.addEventListener('pointermove', gerak); c.addEventListener('touchmove', e => { e.preventDefault(); gerak(e); }, {passive:false});
  const loop = t => {
    if (!run) return; if (!t0) t0 = t; const sisa = 20 - (t - t0) / 1000;
    if (sisa <= 0) { run = 0; $('#skor').textContent = `Waktu habis! Skor ${sk} ❤`; $('#gmulai').disabled = false; return; }
    if (Math.random() < .045) hs.push({x:Math.random() * 300 + 10, y:-10, v:2 + Math.random() * 2});
    x.clearRect(0, 0, 320, 400); x.font = '24px serif'; hs.forEach(o => { o.y += o.v; x.fillText('❤', o.x, o.y); });
    hs = hs.filter(o => { if (o.y > 355 && o.y < 390 && Math.abs(o.x - px) < 38) { sk++; return false; } return o.y < 410; });
    x.fillStyle = getComputedStyle(document.body).getPropertyValue('--ac'); x.fillRect(px - 30, 372, 60, 12);
    $('#skor').textContent = `Skor ${sk} · ${Math.ceil(sisa)} dtk`; requestAnimationFrame(loop);
  };
  $('#gmulai').onclick = () => { sk = 0; hs = []; t0 = 0; run = 1; $('#gmulai').disabled = true; requestAnimationFrame(loop); };
}
