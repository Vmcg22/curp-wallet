/**
 * Componente de tarjeta de identificación.
 * Renderizado en navegador con inline styles idénticos al diseño de referencia.
 */

function esc(str) {
  if (str == null || str === '') return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fmtDate(dateStr) {
  if (!dateStr) return '';
  const m = String(dateStr).match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (!m) return dateStr;
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const d = parseInt(m[1], 10);
  const mo = parseInt(m[2], 10);
  const y = parseInt(m[3], 10);
  return `${String(d).padStart(2, '0')} · ${months[mo - 1] || m[2]} · ${y}`;
}

const FRONT_LABEL_STYLE = 'color: #8a8880; font-size: 11px; letter-spacing: 1px; font-weight: 500; margin-bottom: 3px;';
const FRONT_VALUE_STYLE = 'color: #1a1a1a; font-size: 11px; font-family: monospace; letter-spacing: 0.3px;';
const BACK_LABEL_STYLE = 'color: #8a8880; font-size: 10px; letter-spacing: 1px; font-weight: 500; margin-bottom: 2px;';
const BACK_VALUE_STYLE = 'color: #1a1a1a; font-size: 11px; font-family: monospace; letter-spacing: 0.3px;';

// value === null  → field hidden by user (eye off) → omit block entirely
// value === ''     → eye on, no input yet → show label + "—"
// value === string → show label + value
function frontField(label, value, fullWidth = false) {
  if (value === null) return '';
  const display = value || '—';
  const wrap = fullWidth ? ' style="grid-column: 1 / -1;"' : '';
  return `<div${wrap}><div style="${FRONT_LABEL_STYLE}">${esc(label)}</div><div style="${FRONT_VALUE_STYLE}">${esc(display)}</div></div>`;
}

function backField(label, value, opts = {}) {
  if (value === null) return '';
  const { fullWidth = false, valueStyle = BACK_VALUE_STYLE, ellipsis = false } = opts;
  const display = value || '—';
  const wrap = fullWidth ? ' style="grid-column: 1 / -1;"' : '';
  const vStyle = ellipsis ? `${valueStyle} white-space: nowrap; overflow: hidden; text-overflow: ellipsis;` : valueStyle;
  return `<div${wrap}><div style="${BACK_LABEL_STYLE}">${esc(label)}</div><div style="${vStyle}">${esc(display)}</div></div>`;
}

// Combine multiple values into one display string.
// Returns null if ALL values are null (all hidden by eye toggle).
// Returns '—' if at least one is visible (eye on) but all are empty.
// Otherwise joins non-empty values with ' · '.
function combineValues(...vals) {
  const visible = vals.filter(v => v !== null);
  if (!visible.length) return null;
  return visible.filter(v => v).join(' · ') || '—';
}

/**
 * FRONT — la columna de la foto solo se omite si el usuario apaga el ojo de "foto".
 * Si no hay foto pero el ojo está prendido, se muestra un avatar placeholder.
 */
function renderCardFront({ nombre, curp, rfc, fechaNacimiento, photoUrl, showPhoto = true }) {
  const photoInner = photoUrl
    ? `<img src="${esc(photoUrl)}" alt="" style="width: 100%; height: 100%; object-fit: cover; display: block;">`
    : `<svg viewBox="0 0 80 100" style="width: 100%; height: 100%; display: block;">
         <circle cx="40" cy="36" r="14" fill="#0E7C66" opacity="0.5"></circle>
         <path d="M12 100 Q12 66 40 66 Q68 66 68 100 Z" fill="#0E7C66" opacity="0.5"></path>
       </svg>`;
  const photoBlock = showPhoto
    ? `<div style="background: #EFEDE5; border-radius: 8px; display: flex; align-items: flex-end; justify-content: center; aspect-ratio: 3/4; overflow: hidden;">${photoInner}</div>`
    : '';

  const fechaDisplay = fechaNacimiento === null ? null : fmtDate(fechaNacimiento);
  const metaBlocks = [
    frontField('CURP', curp),
    frontField('RFC', rfc),
    frontField('Fecha de nacimiento', fechaDisplay, true),
  ].join('');

  const grid = metaBlocks
    ? `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px 14px;">${metaBlocks}</div>`
    : '';

  const gridCols = showPhoto ? '108px 1fr' : '1fr';

  return `
<div style="width: 100%; max-width: 460px; aspect-ratio: 1.586; background: #FAFAF6; border-radius: 16px; padding: 22px 22px 22px 30px; display: grid; grid-template-columns: ${gridCols}; gap: 20px; position: relative; overflow: hidden; border: 1px solid #E8E5DE; box-sizing: border-box;">
  <div style="position: absolute; top: 0; left: 0; bottom: 0; width: 6px; background: #0E7C66;"></div>
  <div style="position: absolute; top: 22px; right: 24px; display: flex; flex-direction: column; align-items: flex-end; gap: 5px;">
    <div style="width: 44px; height: 2px; background: #0E7C66;"></div>
    <div style="width: 28px; height: 2px; background: #0E7C66; opacity: 0.5;"></div>
    <div style="width: 14px; height: 2px; background: #0E7C66; opacity: 0.25;"></div>
  </div>
  ${photoBlock}
  <div style="display: flex; flex-direction: column; justify-content: space-between;">
    <div>
      <div style="color: #0E7C66; font-size: 11px; letter-spacing: 2.5px; font-weight: 500; margin-bottom: 6px;">Identificación</div>
      <div style="color: #1a1a1a; font-size: 19px; font-weight: 500; line-height: 1.15; letter-spacing: -0.2px;">${esc(nombre) || 'Sin nombre'}</div>
    </div>
    ${grid}
  </div>
</div>
  `.trim();
}

/**
 * BACK — cada bloque (label + valor) solo aparece si tiene valor.
 * EMERGENCIA y DIRECCIÓN se ocultan completamente si están vacíos.
 */
function renderCardBack(data) {
  const {
    tipoSangre, telefono, correo, direccion,
    licencia, nss, alergias, padecimientos,
    emergenciaNombre, emergenciaTel,
  } = data;

  const tipoSangreBlock = tipoSangre === null
    ? ''
    : `<div><div style="${BACK_LABEL_STYLE}">TIPO SANGRE</div><div style="color: #0E7C66; font-size: 13px; font-weight: 600;">${esc(tipoSangre || '—')}</div></div>`;

  const medico = combineValues(alergias, padecimientos);
  const medicoBlock = medico === null
    ? ''
    : `<div style="grid-column: 1 / -1;"><div style="${BACK_LABEL_STYLE}">ALERGIAS / PADECIMIENTOS</div><div style="color: #1a1a1a; font-size: 11px; letter-spacing: 0.2px; line-height: 1.3;">${esc(medico)}</div></div>`;

  const dataBlocks = [
    tipoSangreBlock,
    backField('TELÉFONO', telefono),
    backField('CORREO', correo, { fullWidth: true, ellipsis: true }),
    backField('LICENCIA', licencia),
    backField('NSS', nss),
    medicoBlock,
  ].join('');

  const dataGrid = dataBlocks
    ? `<div>
         <div style="color: #0E7C66; font-size: 11px; letter-spacing: 2.5px; font-weight: 500; margin-bottom: 8px;">Contacto y datos</div>
         <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 7px 14px;">${dataBlocks}</div>
       </div>`
    : '';

  const emergenciaTexto = combineValues(emergenciaNombre, emergenciaTel);
  const emergenciaBlock = emergenciaTexto === null
    ? ''
    : `<div style="background: rgba(14, 124, 102, 0.08); border-left: 3px solid #0E7C66; padding: 7px 10px; border-radius: 4px;">
         <div style="color: #0E7C66; font-size: 9px; letter-spacing: 2px; font-weight: 600; margin-bottom: 2px;">EMERGENCIA</div>
         <div style="color: #1a1a1a; font-size: 11px; font-weight: 500; line-height: 1.3;">${esc(emergenciaTexto)}</div>
       </div>`;

  const direccionBlock = direccion === null
    ? ''
    : `<div>
         <div style="color: #8a8880; font-size: 9px; letter-spacing: 1px; font-weight: 500; text-align: center; margin-top: 2px;">DIRECCIÓN</div>
         <div style="color: #1a1a1a; font-size: 9px; line-height: 1.25; text-align: center; max-width: 92px; word-break: break-word;">${esc(direccion || '—')}</div>
       </div>`;

  return `
<div id="card-back" style="width: 100%; max-width: 460px; aspect-ratio: 1.586; background: #FAFAF6; border-radius: 16px; padding: 22px 22px 22px 30px; display: grid; grid-template-columns: 1fr 120px; gap: 18px; position: relative; overflow: hidden; border: 1px solid #E8E5DE; box-sizing: border-box;">
  <div style="position: absolute; top: 0; left: 0; bottom: 0; width: 6px; background: #0E7C66;"></div>
  <div style="position: absolute; top: 22px; right: 24px; display: flex; flex-direction: column; align-items: flex-end; gap: 5px;">
    <div style="width: 14px; height: 2px; background: #0E7C66; opacity: 0.25;"></div>
    <div style="width: 28px; height: 2px; background: #0E7C66; opacity: 0.5;"></div>
    <div style="width: 44px; height: 2px; background: #0E7C66;"></div>
  </div>

  <div style="display: flex; flex-direction: column; justify-content: space-between; min-width: 0; gap: 12px;">
    ${dataGrid}
    ${emergenciaBlock}
  </div>

  <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;">
    <div id="qr-frame" style="width: 120px; height: 120px; background: white; border: 1px solid #E8E5DE; border-radius: 6px; padding: 4px; display: flex; align-items: center; justify-content: center; box-sizing: border-box;">
      <canvas id="qr-canvas" style="width: 100%; height: 100%; display: block;"></canvas>
    </div>
    <div style="color: #8a8880; font-size: 8px; letter-spacing: 1.5px;">ESCANEAR</div>
    ${direccionBlock}
  </div>
</div>
  `.trim();
}

function escapeVCard(str) {
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, '\\n');
}

function buildQRPayload(data) {
  if (!data.nombre) return 'CURP Wallet';

  const lines = ['BEGIN:VCARD', 'VERSION:3.0'];

  const nombre = data.nombre.trim();
  lines.push(`FN:${escapeVCard(nombre)}`);
  const parts = nombre.split(/\s+/);
  if (parts.length >= 3) {
    const apellidos = parts.slice(-2).join(' ');
    const nombres = parts.slice(0, -2).join(' ');
    lines.push(`N:${escapeVCard(apellidos)};${escapeVCard(nombres)};;;`);
  } else {
    lines.push(`N:${escapeVCard(nombre)};;;;`);
  }

  if (data.telefono) lines.push(`TEL;TYPE=CELL:${data.telefono}`);
  if (data.correo) lines.push(`EMAIL:${data.correo}`);
  if (data.direccion) lines.push(`ADR;TYPE=HOME:;;${escapeVCard(data.direccion)};;;;`);

  if (data.fechaNacimiento) {
    const m = String(data.fechaNacimiento).match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (m) {
      const [, d, mo, y] = m;
      lines.push(`BDAY:${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`);
    }
  }

  const notes = [];
  if (data.curp) notes.push(`CURP: ${data.curp}`);
  if (data.rfc) notes.push(`RFC: ${data.rfc}`);
  if (data.tipoSangre) notes.push(`Sangre: ${data.tipoSangre}`);
  if (data.licencia) notes.push(`Licencia: ${data.licencia}`);
  if (data.nss) notes.push(`NSS: ${data.nss}`);
  if (data.alergias) notes.push(`Alergias: ${data.alergias}`);
  if (data.padecimientos) notes.push(`Padecimientos: ${data.padecimientos}`);
  const emergencia = [data.emergenciaNombre, data.emergenciaTel].filter(Boolean).join(' · ');
  if (emergencia) notes.push(`Emergencia: ${emergencia}`);
  if (notes.length) {
    lines.push(`NOTE:${escapeVCard(notes.join('\n'))}`);
  }

  lines.push('END:VCARD');
  return lines.join('\n');
}

async function renderCards(data, container) {
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 24px; align-items: center; width: 100%;">
      <div style="width: 100%; max-width: 460px;">${renderCardFront(data)}</div>
      <div style="width: 100%; max-width: 460px;">${renderCardBack(data)}</div>
    </div>
  `;

  const canvas = container.querySelector('#qr-canvas');
  if (canvas && window.QRCode) {
    const payload = buildQRPayload(data) || 'CURP Wallet';
    try {
      await window.QRCode.toCanvas(canvas, payload, {
        margin: 4,
        errorCorrectionLevel: 'M',
        color: { dark: '#000000', light: '#ffffff' },
        width: 256,
      });
    } catch (err) {
      console.error('QR error:', err);
    }
  }
}

window.IDCard = {
  render: renderCards,
  renderFront: renderCardFront,
  renderBack: renderCardBack,
};
