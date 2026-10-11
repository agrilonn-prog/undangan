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

$('#app').innerHTML = `
<section class="cover" id="cover" data-l="${T.lambang}">
  <div class="pola"></div><div class="pola b"></div>
  <p>${sapa}. Undangan pernikahan</p>
  <h1>${nama}</h1>
  <p class="to">Kepada Yth.<br><strong>${esc(d.to)}</strong></p>
  <button class="btn" id="buka">Buka undangan</button>
</section>
<button id="musik" aria-label="Putar atau jeda musik">♫</button>
<main>
  <section class="blok">
    <p>${T.salam}</p><h2>${nama}</h2>
    <p>${fmtD(when)}</p><p class="kal">${kal(when)}</p>
    <div class="count" id="count"></div><p id="status" class="kal"></p>
    <button class="btn kecil" id="ics">Tambah ke kalender</button>
    <button class="btn kecil" id="bagi">Bagikan</button>
  </section>
  <div class="pola"></div>
  <section class="blok"><blockquote>${T.kutipan}${T.sumber ? `<cite>${T.sumber}</cite>` : ''}</blockquote></section>
  <div class="pola"></div>
  <section class="blok"><h3>Acara</h3>
    <div class="acara">
      <article><h4>Akad / pemberkatan</h4><p>${fmtD(when)}<br>Pukul ${fmtT(when)} WIB</p></article>
      <article><h4>Resepsi</h4><p>${fmtD(res)}<br>Pukul ${fmtT(res)} WIB sampai selesai</p></article>
    </div>
    <p><strong>${esc(d.tempat)}</strong><br>${esc(d.alamat)}</p>
    ${http(d.maps) ? `<a class="btn" href="${esc(d.maps)}" target="_blank" rel="noopener">Buka peta lokasi</a>` : ''}
  </section>
  ${d.bank && d.norek ? `<div class="pola"></div><section class="blok"><h3>Amplop digital</h3>
    <div class="rek"><p>${esc(d.bank)} a.n. ${esc(d.an)}</p><b>${esc(d.norek)}</b>
    <button class="btn kecil" id="salin">Salin nomor rekening</button></div></section>` : ''}
  <div class="pola"></div>
  <section class="blok"><h3>Ucapan &amp; kehadiran</h3>
    <form class="rsvp" id="rsvp">
      <input name="nama" placeholder="Nama Anda" value="${d.to === DEFAULT_DATA.to ? '' : esc(d.to)}" required>
      <select name="hadir"><option>Hadir</option><option>Tidak hadir</option><option>Masih ragu</option></select>
      <textarea name="doa" rows="3" placeholder="Ucapan dan doa"></textarea>
      <button class="btn">${/^\d{8,15}$/.test(d.wa) ? 'Kirim lewat WhatsApp' : 'Kirim ucapan'}</button>
    </form>
    <ul class="ucapan" id="ucapan"></ul>
  </section>
  <footer class="blok"><p>Merupakan kehormatan bagi kami apabila Anda berkenan hadir dan memberikan doa restu.</p><h2>${nama}</h2></footer>
</main>`;

if (http(d.foto)) $('#cover').style.setProperty('--foto', `url("${encodeURI(d.foto)}")`);

// Musik latar
let audio;
if (http(d.musik)) { audio = new Audio(d.musik); audio.loop = true; $('#musik').classList.add('ada'); }
$('#musik').onclick = () => audio.paused ? audio.play() : audio.pause();
$('#buka').onclick = () => { $('#cover').classList.add('tutup'); document.body.classList.add('terbuka'); audio && audio.play().catch(() => {}); };

// Hitung mundur + status acara
function tick() {
  let s = Math.max(0, Math.floor((when - Date.now()) / 1000));
  $('#count').innerHTML = [['hari',86400],['jam',3600],['menit',60],['detik',1]].map(([n,v]) => { const x = Math.floor(s / v); s %= v; return `<div><b>${x}</b>${n}</div>`; }).join('');
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
const show = () => ($('#ucapan').innerHTML = load().map(u => `<li><small>${esc(u.n)} · ${esc(u.h)}</small>${esc(u.t)}</li>`).join(''));
$('#rsvp').onsubmit = e => {
  e.preventDefault();
  const f = new FormData(e.target), n = f.get('nama'), h = f.get('hadir'), t = f.get('doa') || '';
  try { localStorage.setItem(KEY, JSON.stringify([{n,h,t}, ...load()].slice(0, 30))); } catch (x) {}
  show(); e.target.reset();
  if (/^\d{8,15}$/.test(d.wa)) window.open(`https://wa.me/${d.wa}?text=${encodeURIComponent(`Halo, saya ${n}. Konfirmasi: ${h}.\n${t}`)}`, '_blank');
};
show();
