// Force fresh state on every load — no data is stored by the app
window.addEventListener('pageshow', () => {
  document.getElementById('card-form')?.reset();
  document.getElementById('upload-form')?.reset();
  scheduleLiveRender(0);
});

// --------------- TABS ---------------
const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.panel');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;
    tabs.forEach(t => t.classList.toggle('active', t === tab));
    panels.forEach(p => p.classList.toggle('active', p.id === target));
  });
});

// --------------- TOAST ---------------
const toastEl = document.getElementById('toast');
let toastTimer;
function toast(msg, isError = false) {
  toastEl.textContent = msg;
  toastEl.classList.toggle('error', isError);
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2800);
}

function setLoading(btn, loading) {
  if (!btn) return;
  if (loading) {
    btn.dataset.originalHtml = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span> Procesando...';
    btn.disabled = true;
  } else {
    btn.innerHTML = btn.dataset.originalHtml || btn.innerHTML;
    btn.disabled = false;
  }
}

// --------------- DROPZONE ---------------
const dropzone = document.getElementById('dropzone');
const dropzoneFile = document.getElementById('dropzone-file');
const fileInput = dropzone.querySelector('input[type="file"]');

['dragover', 'dragenter'].forEach(ev =>
  dropzone.addEventListener(ev, e => { e.preventDefault(); dropzone.classList.add('drag'); }));
['dragleave', 'drop'].forEach(ev =>
  dropzone.addEventListener(ev, e => { e.preventDefault(); dropzone.classList.remove('drag'); }));
dropzone.addEventListener('drop', e => {
  if (e.dataTransfer.files.length) {
    fileInput.files = e.dataTransfer.files;
    updateDropzoneLabel();
  }
});
fileInput.addEventListener('change', updateDropzoneLabel);

function updateDropzoneLabel() {
  const f = fileInput.files[0];
  dropzoneFile.textContent = f ? `📄 ${f.name}` : '';
}

// --------------- PHOTO → DATA URL ---------------
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// --------------- FORM → CARD DATA ---------------
async function formToCardData(form) {
  const fd = new FormData(form);
  const hidden = new Set(
    [...form.querySelectorAll('.eye[aria-pressed="false"]')].map(b => b.dataset.field)
  );
  const val = (name) => hidden.has(name) ? '' : (fd.get(name) || '');

  const showPhoto = !hidden.has('foto');
  const data = {
    nombre: fd.get('nombre_completo') || '',
    curp: val('curp').toUpperCase(),
    rfc: val('rfc').toUpperCase(),
    fechaNacimiento: val('fecha_nacimiento'),
    sexo: fd.get('sexo') || '',
    tipoSangre: val('tipo_sangre'),
    telefono: val('telefono'),
    correo: val('correo'),
    direccion: val('direccion'),
    licencia: val('licencia'),
    nss: val('nss'),
    alergias: val('alergias'),
    padecimientos: val('padecimientos'),
    emergenciaNombre: val('contacto_emergencia_nombre'),
    emergenciaTel: val('contacto_emergencia_telefono'),
    notas: fd.get('notas') || '',
    photoUrl: null,
    showPhoto,
  };

  if (showPhoto) {
    const photoFile = fd.get('foto');
    if (photoFile instanceof File && photoFile.size > 0) {
      try {
        data.photoUrl = await readFileAsDataURL(photoFile);
      } catch (err) {
        console.warn('Photo read failed', err);
      }
    }
  }
  return data;
}

// --------------- EYE TOGGLES (event delegation) ---------------
document.getElementById('card-form')?.addEventListener('click', (e) => {
  const btn = e.target.closest('.eye[data-field]');
  if (!btn) return;
  e.preventDefault();
  e.stopPropagation();
  const on = btn.getAttribute('aria-pressed') !== 'false';
  const next = !on;
  btn.setAttribute('aria-pressed', String(next));
  btn.setAttribute('title', next ? 'Incluir en tarjeta' : 'Oculto en la tarjeta');
  btn.closest('label')?.classList.toggle('hidden-from-card', !next);
  scheduleLiveRender(0);
});

// --------------- LIVE PREVIEW ---------------
let cardLive = false;
let liveTimer = null;

async function liveRender() {
  if (!cardLive) return;
  const form = document.getElementById('card-form');
  const data = await formToCardData(form);
  await window.IDCard.render(data, document.getElementById('card-preview'));
}

function scheduleLiveRender(delay = 180) {
  if (!cardLive) return;
  clearTimeout(liveTimer);
  liveTimer = setTimeout(liveRender, delay);
}

document.getElementById('card-form')?.addEventListener('input', () => scheduleLiveRender());

// --------------- PARSE CURP PDF ---------------
document.getElementById('upload-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.submitter;
  const fd = new FormData(e.target);
  setLoading(btn, true);
  try {
    const res = await fetch('/api/parse-curp', { method: 'POST', body: fd });
    const out = document.getElementById('parsed-data');
    out.classList.remove('hidden');
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Error desconocido' }));
      out.textContent = 'Error: ' + (err.detail || res.status);
      toast(err.detail || 'No se pudieron extraer los datos', true);
      return;
    }
    const data = await res.json();
    out.textContent = JSON.stringify(data, null, 2);

    const form = document.getElementById('card-form');
    const nombreParts = [data.nombre, data.primer_apellido, data.segundo_apellido].filter(Boolean);
    if (nombreParts.length) form.nombre_completo.value = nombreParts.join(' ');
    if (data.curp) form.curp.value = data.curp;
    if (data.fecha_nacimiento) form.fecha_nacimiento.value = data.fecha_nacimiento;
    if (data.sexo) form.sexo.value = data.sexo;

    scheduleLiveRender(0);
    toast('Datos extraídos — completa el formulario');
    document.querySelector('.tab[data-tab="manual"]').click();
  } finally {
    setLoading(btn, false);
  }
});

// --------------- DIRECT CARD FROM PDF ---------------
document.getElementById('direct-card-btn').addEventListener('click', async (e) => {
  const btn = e.currentTarget;
  if (!fileInput.files[0]) { toast('Selecciona un PDF primero', true); return; }
  const fd = new FormData();
  fd.append('pdf', fileInput.files[0]);
  setLoading(btn, true);
  try {
    const res = await fetch('/api/parse-curp', { method: 'POST', body: fd });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Error' }));
      toast(err.detail || 'Error al parsear PDF', true);
      return;
    }
    const parsed = await res.json();
    if (!parsed.curp) {
      toast('No se detectó CURP en el PDF', true);
      return;
    }
    const form = document.getElementById('card-form');
    const nombreParts = [parsed.nombre, parsed.primer_apellido, parsed.segundo_apellido].filter(Boolean);
    if (nombreParts.length) form.nombre_completo.value = nombreParts.join(' ');
    if (parsed.curp) form.curp.value = parsed.curp;
    if (parsed.fecha_nacimiento) form.fecha_nacimiento.value = parsed.fecha_nacimiento;
    if (parsed.sexo) form.sexo.value = parsed.sexo;
    scheduleLiveRender(0);
    document.querySelector('.tab[data-tab="manual"]').click();
    toast('Datos cargados en el formulario');
  } finally {
    setLoading(btn, false);
  }
});

// Prevent Enter-key form submission since the live preview handles updates
document.getElementById('card-form').addEventListener('submit', (e) => e.preventDefault());

// --------------- DOWNLOAD PNG ---------------
document.getElementById('download-btn').addEventListener('click', async (e) => {
  const btn = e.currentTarget;
  const preview = document.getElementById('card-preview');
  const cards = preview.querySelectorAll(':scope > div > div');
  if (!cards.length) { toast('Primero genera la tarjeta', true); return; }
  if (!window.htmlToImage) { toast('Librería PNG no disponible', true); return; }

  setLoading(btn, true);
  try {
    const zip = [];
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const dataUrl = await window.htmlToImage.toPng(card, {
        pixelRatio: 3,
        backgroundColor: '#FAFAF6',
        cacheBust: true,
      });
      zip.push({ name: i === 0 ? 'tarjeta-frente.png' : 'tarjeta-reverso.png', url: dataUrl });
    }
    // Trigger downloads sequentially
    for (const f of zip) {
      const a = document.createElement('a');
      a.href = f.url;
      a.download = f.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      await new Promise(r => setTimeout(r, 120));
    }
    toast('Descargado');
  } catch (err) {
    console.error(err);
    toast('Error al generar PNG', true);
  } finally {
    setLoading(btn, false);
  }
});

// --------------- RESET ---------------
document.getElementById('reset-btn').addEventListener('click', () => {
  if (!confirm('¿Limpiar todos los datos del formulario?')) return;
  document.getElementById('card-form').reset();
  document.getElementById('upload-form').reset();
  document.querySelectorAll('#card-form .eye[data-field]').forEach(btn => {
    btn.setAttribute('aria-pressed', 'true');
    btn.setAttribute('title', 'Incluir en tarjeta');
    btn.closest('label')?.classList.remove('hidden-from-card');
  });
  document.getElementById('parsed-data').classList.add('hidden');
  document.getElementById('parsed-data').textContent = '';
  dropzoneFile.textContent = '';
  scheduleLiveRender(0);
  toast('Formulario limpio');
});

// --------------- INIT: render preview immediately ---------------
(async () => {
  cardLive = true;
  document.querySelector('main')?.classList.add('has-preview');
  document.getElementById('result-area')?.classList.remove('hidden');
  await liveRender();
})();
