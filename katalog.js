const $ = s => document.querySelector(s);
const form = $('#form'), sel = $('#t'), live = $('#live'), grid = $('#grid');

TEMPLATES.forEach(t => sel.add(new Option(t.nama, t.id)));
Object.entries(FILTER).forEach(([k, v]) => $('#chips').insertAdjacentHTML('beforeend', `<button type="button" class="chip" data-f="${k}" aria-pressed="${k === 'semua'}">${v}</button>`));

function render(f = 'semua') {
  grid.innerHTML = TEMPLATES.filter(t => f === 'semua' || t.tag.includes(f)).map(t => `
    <article class="card"><div class="thumb"><iframe src="undangan.html?t=${t.id}" loading="lazy" tabindex="-1" title="Pratinjau ${t.nama}"></iframe></div>
    <h3>${t.nama}</h3><p>${t.desc}</p><button class="btn" data-t="${t.id}">Pakai template ini</button></article>`).join('');
}
render();
$('#chips').onclick = e => { const b = e.target.closest('.chip'); if (!b) return; document.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', c === b)); render(b.dataset.f); };

function buildUrl() {
  const p = new URLSearchParams();
  new FormData(form).forEach((v, k) => { if (String(v).trim()) p.set(k, String(v).trim()); });
  return new URL('undangan.html?' + p, location.href).href;
}
function update() { const u = buildUrl(); try { const b = new URL(u); ['to','meja','acara'].forEach(x => b.searchParams.delete(x)); localStorage.setItem('undangan:base', b.href); } catch (e) {} $('#link').value = u; $('#open').href = u; live.src = u; }
grid.onclick = e => { const b = e.target.closest('button[data-t]'); if (!b) return; sel.value = b.dataset.t; update(); $('#editor').scrollIntoView({behavior:'smooth'}); };
let timer; form.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(update, 400); });
$('#copy').onclick = async e => { await navigator.clipboard.writeText($('#link').value); e.target.textContent = 'Tersalin'; setTimeout(() => (e.target.textContent = 'Salin tautan'), 1500); };

// Generator tautan massal: satu tamu per baris, format "Nama" atau "Nama|08123456789"
const esc = s => s.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let hasil = [];
$('#bulk').onclick = () => {
  const base = new URL(buildUrl()); base.searchParams.delete('to');
  const pria = form.pria.value || DEFAULT_DATA.pria, wanita = form.wanita.value || DEFAULT_DATA.wanita;
  hasil = $('#tamu').value.split('\n').map(s => s.trim()).filter(Boolean).map(l => {
    const [n, h = ''] = l.split('|').map(s => s.trim()), u = new URL(base); u.searchParams.set('to', n);
    const no = h.replace(/\D/g, '').replace(/^0/, '62');
    const teks = `Halo ${n}, kami mengundang Anda ke pernikahan ${pria} & ${wanita}. Buka undangannya di sini: ${u}`;
    return {n, u: u.href, wa: `https://wa.me/${no}?text=${encodeURIComponent(teks)}`};
  });
  $('#hasil').innerHTML = hasil.map(r => `<li><b>${esc(r.n)}</b> <a href="${r.u}" target="_blank" rel="noopener">buka</a> <a href="${r.wa}" target="_blank" rel="noopener">kirim WA</a></li>`).join('');
  $('#salinsemua').hidden = !hasil.length;
};
$('#salinsemua').onclick = e => navigator.clipboard.writeText(hasil.map(r => `${r.n}\t${r.u}`).join('\n')).then(() => (e.target.textContent = 'Tersalin'));
update();
