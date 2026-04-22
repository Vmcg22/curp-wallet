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

function frontField(label, value, fullWidth = false) {
  if (!value) return '';
  const wrap = fullWidth ? ' style="grid-column: 1 / -1;"' : '';
  return `<div${wrap}><div style="${FRONT_LABEL_STYLE}">${esc(label)}</div><div style="${FRONT_VALUE_STYLE}">${esc(value)}</div></div>`;
}

function backField(label, value, opts = {}) {
  if (!value) return '';
  const { fullWidth = false, valueStyle = BACK_VALUE_STYLE, ellipsis = false } = opts;
  const wrap = fullWidth ? ' style="grid-column: 1 / -1;"' : '';
  const vStyle = ellipsis ? `${valueStyle} white-space: nowrap; overflow: hidden; text-overflow: ellipsis;` : valueStyle;
  return `<div${wrap}><div style="${BACK_LABEL_STYLE}">${esc(label)}</div><div style="${vStyle}">${esc(value)}</div></div>`;
}

/**
 * FRONT — la columna de la foto se omite si no hay foto.
 */
function renderCardFront({ nombre, curp, rfc, fechaNacimiento, photoUrl }) {
  const showPhoto = Boolean(photoUrl);
  const photoBlock = showPhoto
    ? `<div style="background: #EFEDE5; border-radius: 8px; display: flex; align-items: flex-end; justify-content: center; aspect-ratio: 3/4; overflow: hidden;">
         <img src="${esc(photoUrl)}" alt="" style="width: 100%; height: 100%; object-fit: cover; display: block;">
       </div>`
    : '';

  const metaBlocks = [
    frontField('CURP', curp),
    frontField('RFC', rfc),
    frontField('Fecha de nacimiento', fmtDate(fechaNacimiento), true),
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

  const tipoSangreBlock = tipoSangre
    ? `<div><div style="${BACK_LABEL_STYLE}">TIPO SANGRE</div><div style="color: #0E7C66; font-size: 13px; font-weight: 600;">${esc(tipoSangre)}</div></div>`
    : '';

  const medico = [alergias, padecimientos].filter(Boolean).join(' · ');

  const dataBlocks = [
    tipoSangreBlock,
    backField('TELÉFONO', telefono),
    backField('CORREO', correo, { fullWidth: true, ellipsis: true }),
    backField('LICENCIA', licencia),
    backField('NSS', nss),
    medico
      ? `<div style="grid-column: 1 / -1;"><div style="${BACK_LABEL_STYLE}">ALERGIAS / PADECIMIENTOS</div><div style="color: #1a1a1a; font-size: 11px; letter-spacing: 0.2px; line-height: 1.3;">${esc(medico)}</div></div>`
      : '',
  ].join('');

  const dataGrid = dataBlocks
    ? `<div>
         <div style="color: #0E7C66; font-size: 11px; letter-spacing: 2.5px; font-weight: 500; margin-bottom: 8px;">Contacto y datos</div>
         <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 7px 14px;">${dataBlocks}</div>
       </div>`
    : '';

  const emergenciaTexto = [emergenciaNombre, emergenciaTel].filter(Boolean).join(' · ');
  const emergenciaBlock = emergenciaTexto
    ? `<div style="background: rgba(14, 124, 102, 0.08); border-left: 3px solid #0E7C66; padding: 7px 10px; border-radius: 4px;">
         <div style="color: #0E7C66; font-size: 9px; letter-spacing: 2px; font-weight: 600; margin-bottom: 2px;">EMERGENCIA</div>
         <div style="color: #1a1a1a; font-size: 11px; font-weight: 500; line-height: 1.3;">${esc(emergenciaTexto)}</div>
       </div>`
    : '';

  const direccionBlock = direccion
    ? `<div>
         <div style="color: #8a8880; font-size: 9px; letter-spacing: 1px; font-weight: 500; text-align: center; margin-top: 2px;">DIRECCIÓN</div>
         <div style="color: #1a1a1a; font-size: 9px; line-height: 1.25; text-align: center; max-width: 92px; word-break: break-word;">${esc(direccion)}</div>
       </div>`
    : '';

  return `
<div id="card-back" style="width: 100%; max-width: 460px; aspect-ratio: 1.586; background: #FAFAF6; border-radius: 16px; padding: 22px 22px 22px 30px; display: grid; grid-template-columns: 1fr 96px; gap: 18px; position: relative; overflow: hidden; border: 1px solid #E8E5DE; box-sizing: border-box;">
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
    <div id="qr-frame" style="width: 96px; height: 96px; background: white; border: 1px solid #E8E5DE; border-radius: 6px; padding: 4px; display: flex; align-items: center; justify-content: center; box-sizing: border-box;">
      <canvas id="qr-canvas" style="width: 100%; height: 100%; display: block;"></canvas>
    </div>
    <div style="color: #8a8880; font-size: 8px; letter-spacing: 1.5px;">ESCANEAR</div>
    ${direccionBlock}
  </div>
</div>
  `.trim();
}

function buildQRPayload(data) {
  const lines = [
    ['NOMBRE', data.nombre],
    ['CURP', data.curp],
    ['RFC', data.rfc],
    ['NAC', data.fechaNacimiento],
    ['SANGRE', data.tipoSangre],
    ['TEL', data.telefono],
    ['CORREO', data.correo],
    ['DIR', data.direccion],
    ['LIC', data.licencia],
    ['NSS', data.nss],
    ['ALERGIAS', data.alergias],
    ['PADEC', data.padecimientos],
    ['EMERG', [data.emergenciaNombre, data.emergenciaTel].filter(Boolean).join(' ')],
  ];
  return lines
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');
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
    try {
      await window.QRCode.toCanvas(canvas, buildQRPayload(data), {
        margin: 0,
        errorCorrectionLevel: 'M',
        color: { dark: '#1a1a1a', light: '#ffffff' },
        width: 88,
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
