const q = Object.fromEntries(new URLSearchParams(location.search));
const d = { ...DEFAULT_DATA, ...q };
const T = TEMPLATES.find(t => t.id === d.t) || TEMPLATES[0];
document.body.className = 't-' + T.id;
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const http = s => /^https?:\/\//.test(s);
const when = new Date(d.tanggal), res = d.resepsi ? new Date(d.resepsi) : new Date(+when + 72e5);
const fmtD = x => x.toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
const fmtT = x => x.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'}).replace(':','.');

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
const foto = d.galeri ? d.galeri.split(',').map(s => s.trim()).filter(http) : [];
const adaRek = d.bank && d.norek;
const loop = `${esc(d.pria)} &amp; ${esc(d.wanita)} ✦ ${when.getDate()}.${when.getMonth()+1}.${when.getFullYear()} ✦ `.repeat(6);
const menu = [['home','🏠','Beranda'],['acara','📅','Acara'],...(foto.length?[['galeri','🖼','Galeri']]:[]),...(adaRek?[['hadiah','🎁','Hadiah']]:[]),['ucapan','💬','Ucapan']];

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
<button id="musik" aria-label="Putar atau jeda musik">♫</button>
<nav class="nav glass" aria-label="Navigasi undangan">${menu.map(([i,e,l]) => `<a href="#${i}"><i>${e}</i>${l}</a>`).join('')}</nav>
<main>
  <section class="blok" id="home">
    <p class="salam r">${T.salam}</p>
    <div class="tgl r"><b>${String(when.getDate()).padStart(2,'0')}</b><span><small>${when.toLocaleDateString('id-ID',{weekday:'long'})}</small>${tgl(when)}</span></div>
    <p class="kal r">${kal(when)}</p>
    <div class="count r" id="count"></div>
    <p id="status" class="kal"></p>
    <button class="btn kecil" id="ics">Tambah ke kalender</button><button class="btn kecil" id="bagi">Bagikan</button>
  </section>
  <div class="marquee" aria-hidden="true"><span>${loop}</span></div>
  <section class="blok"><blockquote class="r">${T.kutipan}${T.sumber ? `<cite>${T.sumber}</cite>` : ''}</blockquote></section>
  <div class="pola"></div>
  <section class="blok" id="acara"><h3 class="r">Acara</h3>
    <div class="bento r">
      <article class="glass"><h4>Akad / pemberkatan</h4><div class="jam">${fmtT(when)}</div><small>${fmtD(when)}</small></article>
      <article class="glass"><h4>Resepsi</h4><div class="jam">${fmtT(res)}</div><small>${fmtD(res)}</small></article>
      <article class="glass lebar"><h4>Lokasi</h4><strong>${esc(d.tempat)}</strong><small>${esc(d.alamat)}</small>
        ${http(d.maps) ? `<a class="btn kecil" href="${esc(d.maps)}" target="_blank" rel="noopener">Buka peta</a>` : ''}</article>
    </div>
  </section>
  ${foto.length ? `<section class="blok" id="galeri"><h3 class="r">Galeri</h3><div class="gal r">${foto.map(f => `<img src="${esc(f)}" alt="Foto prewedding" loading="lazy">`).join('')}</div></section>` : ''}
  ${adaRek ? `<section class="blok" id="hadiah"><h3 class="r">Amplop digital</h3><div class="rek glass r"><p>${esc(d.bank)} a.n. ${esc(d.an)}</p><b>${esc(d.norek)}</b><button class="btn kecil" id="salin">Salin nomor rekening</button></div></section>` : ''}
  <section class="blok" id="ucapan"><h3 class="r">Ucapan &amp; kehadiran</h3>
    <form class="rsvp glass r" id="rsvp">
      <input name="nama" placeholder="Nama Anda" value="${d.to === DEFAULT_DATA.to ? '' : esc(d.to)}" required>
      <select name="hadir"><option>Hadir</option><option>Tidak hadir</option><option>Masih ragu</option></select>
      <textarea name="doa" rows="3" placeholder="Ucapan dan doa"></textarea>
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

if (http(d.foto)) $('#cover').style.setProperty('--foto', `url("${encodeURI(d.foto)}")`);

// Musik latar
let audio;
if (http(d.musik)) { audio = new Audio(d.musik); audio.loop = true; $('#musik').classList.add('ada'); }
$('#musik').onclick = () => audio.paused ? audio.play() : audio.pause();
$('#buka').onclick = () => { $('#cover').classList.add('tutup'); document.body.classList.add('terbuka'); audio && audio.play().catch(() => {}); };

// Hitung mundur + status acara
function tick() {
  let s = Math.max(0, Math.floor((when - Date.now()) / 1000));
  $('#count').innerHTML = [['hari',86400],['jam',3600],['menit',60],['detik',1]].map(([n,v]) => { const x = Math.floor(s / v); s %= v; return `<div class="glass"><b>${x}</b>${n}</div>`; }).join('');
  const now = Date.now();
  $('#status').textContent = now > +res + 72e5 ? 'Acara telah selesai. Terima kasih atas doa Anda.' : now >= +when ? 'Acara sedang berlangsung.' : '';
}
tick(); setInterval(tick, 1000);

// Kalender (.ics)
$('#ics').onclick = () => {
  const z = x => x.toISOString().replace(/[-:]|\.\d{3}/g, ''), e = s => s.replace(/[,;]/g, '\\$&');
  const t = ['BEGIN:VCALENDAR','VERSION:2.0','BEGIN:VEVENT','DTSTART:'+z(when),'DTEND:'+z(new Date(+res+72e5)),'SUMMARY:'+e(`Pernikahan ${d.pria} & ${d.wanita}`),'LOCATION:'+e(`${d.tempat}, ${d.alamat}`),'END:VEVENT','END:VCALENDAR'].join('\r\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([t], {type:'text/calendar'})); a.download = 'pernikahan.ics'; a.click();
};
$('#bagi').onclick = () => navigator.share ? navigator.share({title:`Undangan ${d.pria} & ${d.wanita}`, url:location.href}) : navigator.clipboard.writeText(location.href).then(() => ($('#bagi').textContent = 'Tautan tersalin'));
if ($('#salin')) $('#salin').onclick = e => navigator.clipboard.writeText(d.norek).then(() => (e.target.textContent = 'Tersalin'));

// Ucapan (tersimpan di perangkat ini) + RSVP WhatsApp
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } };
const show = () => ($('#ucapan-list').innerHTML = load().map(u => `<li class="glass"><b>${esc(u.n.charAt(0).toUpperCase())}</b><div><small>${esc(u.n)} · ${esc(u.h)}</small>${esc(u.t)}</div></li>`).join(''));
$('#rsvp').onsubmit = e => {
  e.preventDefault();
  const f = new FormData(e.target), n = f.get('nama'), h = f.get('hadir'), t = f.get('doa') || '';
  try { localStorage.setItem(KEY, JSON.stringify([{n,h,t}, ...load()].slice(0, 30))); } catch (x) {}
  show(); e.target.reset();
  if (/^\d{8,15}$/.test(d.wa)) window.open(`https://wa.me/${d.wa}?text=${encodeURIComponent(`Halo, saya ${n}. Konfirmasi: ${h}.\n${t}`)}`, '_blank');
};
show();
