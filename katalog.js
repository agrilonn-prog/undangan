const $ = s => document.querySelector(s);
const form = $('#form'), sel = $('#t'), live = $('#live');

TEMPLATES.forEach(t => {
  $('#grid').insertAdjacentHTML('beforeend',
    `<article class="card">
      <div class="thumb"><iframe src="undangan.html?t=${t.id}" loading="lazy" tabindex="-1" title="Pratinjau ${t.nama}"></iframe></div>
      <h3>${t.nama}</h3><p>${t.desc}</p>
      <button class="btn" data-t="${t.id}">Pakai template ini</button>
    </article>`);
  sel.add(new Option(t.nama, t.id));
});

function buildUrl() {
  const p = new URLSearchParams();
  new FormData(form).forEach((v, k) => { if (String(v).trim()) p.set(k, String(v).trim()); });
  return new URL('undangan.html?' + p, location.href).href;
}

function update() {
  const url = buildUrl();
  $('#link').value = url;
  $('#open').href = url;
  live.src = url;
}

$('#grid').addEventListener('click', e => {
  const b = e.target.closest('button[data-t]');
  if (!b) return;
  sel.value = b.dataset.t;
  update();
  $('#editor').scrollIntoView({ behavior: 'smooth' });
});

let timer;
form.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(update, 400); });
$('#copy').addEventListener('click', async e => {
  await navigator.clipboard.writeText($('#link').value);
  e.target.textContent = 'Tersalin';
  setTimeout(() => (e.target.textContent = 'Salin tautan'), 1500);
});
update();
