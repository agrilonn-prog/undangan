const q = Object.fromEntries(new URLSearchParams(location.search));
const d = { ...DEFAULT_DATA, ...q };
if (!TEMPLATES.some(t => t.id === d.t)) d.t = 'klasik';
document.body.className = 't-' + d.t;

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const when = new Date(d.tanggal), resepsi = new Date(+when + 2 * 36e5);
const fmtD = x => x.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const fmtT = x => x.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.');
const islami = d.t === 'islami';
const mapsOk = /^https?:\/\//.test(d.maps);

document.getElementById('app').innerHTML = `
<section class="cover" id="cover">
  <p>Undangan pernikahan</p>
  <h1>${esc(d.pria)} <span>&amp;</span> ${esc(d.wanita)}</h1>
  <p class="to">Kepada Yth.<br><strong>${esc(d.to)}</strong></p>
  <button class="btn" id="buka">Buka undangan</button>
</section>

<main>
  <section class="blok hero">
    <p>${islami ? 'Assalamu\u2019alaikum warahmatullahi wabarakatuh' : 'Dengan penuh syukur, kami mengundang Anda'}</p>
    <h2>${esc(d.pria)} <span>&amp;</span> ${esc(d.wanita)}</h2>
    <p>${fmtD(when)}</p>
    <div class="count" id="count" aria-live="off"></div>
  </section>

  <section class="blok">
    <blockquote>${islami
      ? 'Di antara tanda-tanda kebesaran-Nya, Dia menciptakan pasangan untukmu agar kamu merasa tenteram kepadanya. <cite>QS. Ar-Rum: 21</cite>'
      : 'Cinta tidak hanya saling memandang, tetapi bersama-sama memandang ke arah yang sama. <cite>Antoine de Saint-Exupéry</cite>'}</blockquote>
  </section>

  <section class="blok">
    <h3>Acara</h3>
    <div class="acara">
      <article><h4>Akad nikah</h4><p>${fmtD(when)}<br>Pukul ${fmtT(when)} WIB</p></article>
      <article><h4>Resepsi</h4><p>${fmtD(resepsi)}<br>Pukul ${fmtT(resepsi)} WIB sampai selesai</p></article>
    </div>
    <p class="lokasi"><strong>${esc(d.tempat)}</strong><br>${esc(d.alamat)}</p>
    ${mapsOk ? `<a class="btn" href="${esc(d.maps)}" target="_blank" rel="noopener">Buka peta lokasi</a>` : ''}
  </section>

  <section class="blok">
    <h3>Konfirmasi kehadiran</h3>
    <form id="rsvp">
      <input name="nama" placeholder="Nama Anda" value="${d.to === DEFAULT_DATA.to ? '' : esc(d.to)}" required>
      <select name="hadir"><option>Hadir</option><option>Tidak hadir</option><option>Masih ragu</option></select>
      <textarea name="doa" rows="3" placeholder="Ucapan dan doa untuk mempelai"></textarea>
      <button class="btn">Kirim lewat WhatsApp</button>
    </form>
  </section>

  <footer class="blok">
    <p>Merupakan kehormatan bagi kami apabila Anda berkenan hadir dan memberikan doa restu.</p>
    <h2>${esc(d.pria)} <span>&amp;</span> ${esc(d.wanita)}</h2>
  </footer>
</main>`;

// Buka undangan
document.getElementById('buka').onclick = () => {
  document.getElementById('cover').classList.add('tutup');
  document.body.classList.add('terbuka');
};

// Hitung mundur
const count = document.getElementById('count');
function tick() {
  let s = Math.max(0, Math.floor((when - Date.now()) / 1000));
  const u = [['hari', 86400], ['jam', 3600], ['menit', 60], ['detik', 1]];
  count.innerHTML = u.map(([n, v]) => { const x = Math.floor(s / v); s %= v; return `<div><b>${x}</b>${n}</div>`; }).join('');
}
tick(); setInterval(tick, 1000);

// RSVP ke WhatsApp
document.getElementById('rsvp').onsubmit = e => {
  e.preventDefault();
  const f = new FormData(e.target);
  const teks = `Halo, saya ${f.get('nama')}. Konfirmasi: ${f.get('hadir')}.\n${f.get('doa') || ''}`;
  if (!/^\d{8,15}$/.test(d.wa)) return alert('Nomor WhatsApp penerima belum diisi pada tautan undangan.');
  window.open(`https://wa.me/${d.wa}?text=${encodeURIComponent(teks)}`, '_blank');
};
