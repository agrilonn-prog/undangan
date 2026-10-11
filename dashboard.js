const $ = s => document.querySelector(s), K = 'undangan:dash';
let S; try { S = JSON.parse(localStorage.getItem(K)); } catch (e) {}
S = S || {tamu:[], budget:[], total:0, todo:['Booking venue','Pilih katering','Sebar undangan','Fitting baju'].map(t => ({t, done:false}))};
const save = () => { try { localStorage.setItem(K, JSON.stringify(S)); } catch (e) {} };
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rp = n => 'Rp ' + (+n || 0).toLocaleString('id-ID');
const base = $('#base'); base.value = localStorage.getItem('undangan:base') || '';
base.oninput = () => localStorage.setItem('undangan:base', base.value);

const link = g => { try { const u = new URL(base.value); u.searchParams.set('to', g.n); ['meja','acara'].forEach(k => u.searchParams.delete(k)); if (g.meja) u.searchParams.set('meja', g.meja); if (g.acara && g.acara !== 'semua') u.searchParams.set('acara', g.acara); return u.href; } catch (e) { return ''; } };
const wa = g => `https://wa.me/${(g.wa || '').replace(/\D/g,'').replace(/^0/,'62')}?text=${encodeURIComponent(`Halo ${g.n}, kami mengundang Anda ke pernikahan kami. Buka undangannya di sini: ${link(g)}`)}`;

function draw() {
  const h = S.tamu.filter(g => g.hadir).length;
  $('#stat').innerHTML = `<div><b>${S.tamu.length}</b>tamu</div><div><b>${h}</b>sudah hadir</div><div><b>${S.tamu.length - h}</b>belum hadir</div>`;
  $('#tbody').innerHTML = S.tamu.map((g, i) => `<tr><td>${esc(g.n)}</td><td>${esc(g.meja || '-')}</td><td>${g.acara || 'semua'}</td><td>${g.hadir ? 'Hadir' : 'Belum'}</td>
    <td><a href="${esc(wa(g))}" target="_blank" rel="noopener">WA</a> <button data-a="salin" data-i="${i}">Salin</button> <button data-a="hapus" data-i="${i}">Hapus</button></td></tr>`).join('') || '<tr><td colspan="5">Belum ada tamu. Tambahkan di atas.</td></tr>';
  const m = {}; S.tamu.forEach(g => { if (g.meja) m[g.meja] = (m[g.meja] || 0) + 1; });
  $('#meja').innerHTML = Object.entries(m).map(([k, v]) => `<div><b>${v}</b>Meja ${esc(k)}</div>`).join('') || 'Isi nomor meja untuk melihat ringkasan.';
  const used = S.budget.reduce((a, b) => a + b.j, 0);
  $('#total').value = S.total || '';
  $('#bstat').innerHTML = `<div><b>${rp(used)}</b>terpakai</div><div><b>${rp(S.total - used)}</b>sisa</div>`;
  $('#blist').innerHTML = S.budget.map((b, i) => `<li>${esc(b.n)} <b>${rp(b.j)}</b> <button data-a="bdel" data-i="${i}">Hapus</button></li>`).join('');
  $('#tlist').innerHTML = S.todo.map((t, i) => `<li><label><input type="checkbox" data-a="tdone" data-i="${i}" ${t.done ? 'checked' : ''}> ${esc(t.t)}</label> <button data-a="tdel" data-i="${i}">Hapus</button></li>`).join('');
}
$('#fg').onsubmit = e => { e.preventDefault(); const f = Object.fromEntries(new FormData(e.target)); S.tamu.push({...f, hadir:false}); save(); e.target.reset(); draw(); };
$('#impbtn').onclick = () => { $('#imp').value.split('\n').map(s => s.trim()).filter(Boolean).forEach(l => { const [n, w = '', meja = ''] = l.split('|').map(s => s.trim()); S.tamu.push({n, wa:w, meja, acara:'semua', hadir:false}); }); $('#imp').value = ''; save(); draw(); };
$('#fb').onsubmit = e => { e.preventDefault(); const f = new FormData(e.target); S.budget.push({n:f.get('n'), j:+String(f.get('j')).replace(/\D/g,'')}); save(); e.target.reset(); draw(); };
$('#ft').onsubmit = e => { e.preventDefault(); S.todo.push({t:new FormData(e.target).get('t'), done:false}); save(); e.target.reset(); draw(); };
$('#total').oninput = e => { S.total = +e.target.value.replace(/\D/g,''); save(); draw(); $('#total').focus(); };
document.body.addEventListener('click', e => {
  const b = e.target.closest('[data-a]'); if (!b) return; const i = +b.dataset.i, a = b.dataset.a;
  if (a === 'hapus') S.tamu.splice(i, 1); else if (a === 'bdel') S.budget.splice(i, 1); else if (a === 'tdel') S.todo.splice(i, 1);
  else if (a === 'tdone') S.todo[i].done = b.checked; else if (a === 'salin') return navigator.clipboard.writeText(link(S.tamu[i])).then(() => (b.textContent = 'Tersalin'));
  save(); draw();
});
$('#csv').onclick = () => { const t = 'Nama,WhatsApp,Meja,Acara,Status,Tautan\n' + S.tamu.map(g => [g.n, g.wa, g.meja, g.acara, g.hadir ? 'Hadir' : 'Belum', link(g)].map(x => `"${String(x || '').replace(/"/g, '""')}"`).join(',')).join('\n'); Object.assign(document.createElement('a'), {href:URL.createObjectURL(new Blob([t], {type:'text/csv'})), download:'tamu.csv'}).click(); };
$('#tabs').onclick = e => { const b = e.target.closest('.chip'); if (!b) return; document.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', c === b)); document.querySelectorAll('.pane').forEach(p => (p.hidden = p.id !== 'p-' + b.dataset.p)); if (b.dataset.p !== 'cek') henti(); };

// Check-in QR + layar sapa
let strm, timer, last = '';
function sapa(n, m) { $('#sapa').innerHTML = `<div><small>Selamat datang</small><h2>${esc(n)}</h2>${m ? `<p>Meja ${esc(m)}</p>` : ''}</div>`; $('#sapa').hidden = false; setTimeout(() => ($('#sapa').hidden = true), 4000); }
function masuk(n, m) { const g = S.tamu.find(x => x.n.toLowerCase() === n.toLowerCase()); if (g) { g.hadir = true; save(); draw(); } sapa(n, m || (g && g.meja)); }
async function mulai() {
  if (!('BarcodeDetector' in window)) return ($('#cekinfo').textContent = 'Browser ini belum mendukung pemindai QR. Gunakan Chrome di Android, atau check-in manual.');
  try { strm = await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}}); $('#cam').srcObject = strm; await $('#cam').play();
    const det = new BarcodeDetector({formats:['qr_code']});
    timer = setInterval(async () => { try { const r = await det.detect($('#cam')); if (r[0] && r[0].rawValue !== last) { last = r[0].rawValue; setTimeout(() => (last = ''), 4000); const [p, n, m] = last.split('|'); if (p === 'UND' && n) masuk(n, m); } } catch (e) {} }, 500);
  } catch (e) { $('#cekinfo').textContent = 'Kamera tidak bisa diakses. Izinkan akses kamera.'; }
}
function henti() { clearInterval(timer); strm && strm.getTracks().forEach(t => t.stop()); }
$('#mulai').onclick = mulai; $('#henti').onclick = henti;
$('#fm').onsubmit = e => { e.preventDefault(); const n = $('#manual').value.trim(); if (n) { masuk(n); $('#manual').value = ''; } };
draw();
