import { firebaseConfig, firebaseEnabled, siteConfig } from './firebase-config.js';

let db = null;
let addDoc = null;
let collection = null;
let doc = null;
let setDoc = null;
let serverTimestamp = null;

async function initFirebase(){
  if (!firebaseEnabled) return false;
  const appMod = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js');
  const fsMod = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
  const app = appMod.initializeApp(firebaseConfig);
  db = fsMod.getFirestore(app);
  addDoc = fsMod.addDoc;
  collection = fsMod.collection;
  doc = fsMod.doc;
  setDoc = fsMod.setDoc;
  serverTimestamp = fsMod.serverTimestamp;
  return true;
}

function cleanString(value, max = 1000){
  return String(value || '').trim().slice(0, max);
}

function esc(value){
  return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;'}[c]));
}

const bankTransferConfig = {
  beneficiary: 'Équilibre Vital asbl',
  iban: 'BE17 5230 8164 9221',
  bic: 'TRIOBEBB',
  defaultAmount: '165',
  currency: 'EUR',
  label: 'Cotisation PSSR — année académique',
  method: 'virement_sepa_epc',
  qrFormat: 'EPC069-12 / SCT'
};

function normalizeIban(value){
  return String(value || '').replace(/\s+/g, '').toUpperCase();
}

function formatIban(value){
  return normalizeIban(value).replace(/(.{4})/g, '$1 ').trim();
}

function normalizeBic(value){
  return String(value || '').replace(/\s+/g, '').toUpperCase();
}

function parseAmountToCents(value){
  const raw = String(value ?? '').trim();
  const normalized = raw.replace(/[^0-9,.-]/g, '').replace(',', '.');
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return Math.round(amount * 100);
}

function amountFromCents(cents){
  return (Math.max(0, Number(cents || 0)) / 100).toFixed(2);
}

function amountForDisplay(cents, currency = 'EUR'){
  try{
    return new Intl.NumberFormat('fr-BE', { style:'currency', currency }).format(Math.max(0, Number(cents || 0)) / 100);
  }catch(_){
    return `${amountFromCents(cents)} ${currency}`;
  }
}

function amountForEpc(cents, currency = 'EUR'){
  return `${currency}${amountFromCents(cents)}`;
}

function sanitizeEpcLine(value, max){
  return String(value || '')
    .replace(/[\r\n]+/g, ' ')
    .trim()
    .slice(0, max);
}

function getFirstPaymentValue(form, data, keys, fallback = ''){
  for (const key of keys){
    if (data && data[key]) return data[key];
    if (form?.dataset && form.dataset[key]) return form.dataset[key];
    const field = form?.elements?.[key] || form?.querySelector?.(`[name="${key}"], [data-payment-${key}]`);
    if (field?.value) return field.value;
    const node = form?.querySelector?.(`[data-${key}]`);
    if (node?.dataset?.[key]) return node.dataset[key];
  }
  return fallback;
}

function resolvePaymentFromForm(form, payload){
  const amountRaw = getFirstPaymentValue(form, payload, [
    'priceAmount', 'paymentAmount', 'amount', 'totalAmount', 'orderAmount', 'invoiceAmount', 'commandeMontant', 'factureMontant'
  ], bankTransferConfig.defaultAmount);
  const amountCents = parseAmountToCents(amountRaw) || parseAmountToCents(bankTransferConfig.defaultAmount);
  const currency = cleanString(getFirstPaymentValue(form, payload, [
    'priceCurrency', 'paymentCurrency', 'currency', 'devise'
  ], bankTransferConfig.currency), 3).toUpperCase() || 'EUR';
  const label = cleanString(getFirstPaymentValue(form, payload, [
    'priceLabel', 'paymentLabel', 'orderLabel', 'invoiceLabel', 'paymentDescription'
  ], bankTransferConfig.label), 180) || bankTransferConfig.label;
  const communication = cleanString(payload.paymentReference || payload.reservationCode || payload.trackingCode || makeTrackingCode('RES'), 140);

  const payment = {
    method: bankTransferConfig.method,
    qrFormat: bankTransferConfig.qrFormat,
    beneficiary: sanitizeEpcLine(bankTransferConfig.beneficiary, 70),
    iban: normalizeIban(bankTransferConfig.iban),
    ibanDisplay: formatIban(bankTransferConfig.iban),
    bic: normalizeBic(bankTransferConfig.bic),
    amountCents,
    amount: amountFromCents(amountCents),
    amountDisplay: amountForDisplay(amountCents, currency),
    currency,
    label,
    communication,
    paymentStatus: 'en attente de virement'
  };
  payment.epcPayload = buildEpcPayload(payment);
  return payment;
}

function buildEpcPayload(payment){
  // EPC069-12 / SCT : lignes obligatoires + virement SEPA avec communication libre.
  const lines = [
    'BCD',
    '002',
    '1',
    'SCT',
    sanitizeEpcLine(payment.bic, 11),
    sanitizeEpcLine(payment.beneficiary, 70),
    sanitizeEpcLine(payment.iban, 34),
    amountForEpc(payment.amountCents, payment.currency),
    '',
    '',
    sanitizeEpcLine(payment.communication, 140)
  ];
  while (lines.length && lines[lines.length - 1] === '') lines.pop();
  return lines.join('\n');
}

function enrichPayloadWithPayment(form, payload){
  const payment = resolvePaymentFromForm(form, payload);
  payload.payment = payment;
  payload.paymentStatus = payment.paymentStatus;
  payload.paymentMethod = payment.method;
  payload.paymentReference = payment.communication;
  payload.paymentAmount = payment.amount;
  payload.paymentAmountCents = payment.amountCents;
  payload.paymentCurrency = payment.currency;
  payload.paymentLabel = payment.label;
  payload.bankBeneficiary = payment.beneficiary;
  payload.bankIban = payment.iban;
  payload.bankBic = payment.bic;
  payload.qrFormat = payment.qrFormat;
  payload.epcPayload = payment.epcPayload;
  payload.priceAmount = payment.amount;
  payload.priceCurrency = payment.currency;
  payload.priceLabel = payment.label;
  return payment;
}

function paymentRecordFromReservation(payload, reservationId = ''){
  const payment = payload.payment || resolvePaymentFromForm(null, payload);
  return {
    reservationId,
    reservationCode: payload.reservationCode || payload.trackingCode || '',
    paymentReference: payment.communication,
    nom: payload.nom || '',
    email: payload.email || '',
    method: payment.method,
    qrFormat: payment.qrFormat,
    paymentStatus: payment.paymentStatus,
    status: payment.paymentStatus,
    amount: payment.amount,
    amountCents: payment.amountCents,
    currency: payment.currency,
    label: payment.label,
    beneficiary: payment.beneficiary,
    iban: payment.iban,
    bic: payment.bic,
    communication: payment.communication,
    epcPayload: payment.epcPayload,
    source: payload.source || location.pathname,
    createdAt: serverTimestamp ? serverTimestamp() : new Date().toISOString()
  };
}

function paymentInstructionHtml(payload){
  const payment = payload.payment || resolvePaymentFromForm(null, payload);
  const paymentSummary = [
    `Bénéficiaire : ${payment.beneficiary}`,
    `IBAN : ${payment.iban}`,
    `BIC : ${payment.bic}`,
    `Montant : ${payment.amountDisplay}`,
    `Communication : ${payment.communication}`
  ].join('\n');
  const paymentSummaryB64 = btoa(unescape(encodeURIComponent(paymentSummary)));
  return `
    <section class="receipt-payment-v1" aria-label="Informations de paiement">
      <p class="receipt-eyebrow-v58">Paiement par virement bancaire</p>
      <h3>Vos informations de paiement</h3>
      <p class="payment-simple-help-v1">Copiez les informations ci-dessous, ouvrez votre application bancaire et créez un nouveau virement. Vérifiez toujours le montant et la communication avant de valider.</p>
      <dl class="receipt-details-v58 payment-details-clear-v1">
        <div><dt>Montant</dt><dd><strong>${esc(payment.amountDisplay)}</strong></dd></div>
        <div><dt>Bénéficiaire</dt><dd>${esc(payment.beneficiary)}</dd></div>
        <div><dt>IBAN</dt><dd><code>${esc(payment.ibanDisplay)}</code> <button type="button" class="copy-payment-v1" data-copy-value="${esc(payment.iban)}">Copier</button></dd></div>
        <div><dt>BIC</dt><dd><code>${esc(payment.bic)}</code></dd></div>
        <div><dt>Communication</dt><dd><code>${esc(payment.communication)}</code> <button type="button" class="copy-payment-v1" data-copy-value="${esc(payment.communication)}">Copier</button></dd></div>
      </dl>
      <div class="payment-actions-v1">
        <button type="button" class="btn payment-copy-all-v1" data-copy-payment-summary data-copy-b64="${esc(paymentSummaryB64)}">Copier toutes les informations</button>
        <button type="button" class="btn secondary payment-invoice-v1" data-print-invoice>Télécharger votre facture</button>
        <button type="button" class="btn secondary payment-declared-v1" data-payment-declared>J’ai effectué mon virement</button>
      </div>
      <p class="payment-action-status-v1" data-payment-declared-status aria-live="polite"></p>
      <p class="receipt-note-v58"><strong>Important :</strong> le document imprimable est une facture pro forma en attente de paiement. Le paiement sera considéré comme reçu uniquement après vérification du compte bancaire.</p>
    </section>`;
}

function decodeBase64Utf8(value){
  try { return decodeURIComponent(escape(atob(value || ''))); }
  catch(_) { return ''; }
}

function initCopyButtons(container){
  container.querySelectorAll('[data-copy-value]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const value = btn.dataset.copyValue || '';
      try{
        await navigator.clipboard.writeText(value);
        const old = btn.textContent;
        btn.textContent = 'Copié';
        setTimeout(() => { btn.textContent = old || 'Copier'; }, 1400);
      }catch(_){
        window.prompt('Copiez cette valeur :', value);
      }
    });
  });

  container.querySelectorAll('[data-copy-payment-summary]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const value = decodeBase64Utf8(btn.dataset.copyB64 || '');
      try{
        await navigator.clipboard.writeText(value);
        const old = btn.textContent;
        btn.textContent = 'Informations copiées';
        setTimeout(() => { btn.textContent = old || 'Copier toutes les informations'; }, 1800);
      }catch(_){
        window.prompt('Copiez les informations de paiement :', value);
      }
    });
  });
}



function safeInvoiceFilename(value){
  return String(value || 'facture')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70) || 'facture';
}

function loadInvoiceLogo(){
  return new Promise(resolve => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = new URL('./wp-content/uploads/2025/09/equilibre-vital-logo-transparent.png', document.baseURI).href;
  });
}

function roundedRectPath(ctx, x, y, width, height, radius = 18){
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function canvasTextLines(ctx, value, maxWidth, maxLines = 3){
  const words = String(value || '—').replace(/\s+/g, ' ').trim().split(' ');
  const lines = [];
  let line = '';
  for (const word of words){
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth){
      line = candidate;
    }else{
      if (line) lines.push(line);
      line = word;
      if (lines.length === maxLines - 1) break;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  if (words.length && lines.length === maxLines){
    const joined = lines.join(' ');
    const original = words.join(' ');
    if (joined.length < original.length){
      while (lines[maxLines - 1].length > 1 && ctx.measureText(`${lines[maxLines - 1]}…`).width > maxWidth){
        lines[maxLines - 1] = lines[maxLines - 1].slice(0, -1);
      }
      lines[maxLines - 1] += '…';
    }
  }
  return lines.length ? lines : ['—'];
}

function drawCanvasLines(ctx, value, x, y, maxWidth, lineHeight, maxLines = 3){
  const lines = canvasTextLines(ctx, value, maxWidth, maxLines);
  lines.forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight));
  return y + lines.length * lineHeight;
}

function drawFittedCanvasText(ctx, value, x, y, maxWidth, weight = 600, startSize = 18, minSize = 13){
  let text = String(value || '—');
  let size = startSize;
  ctx.font = `${weight} ${size}px Arial`;
  while (size > minSize && ctx.measureText(text).width > maxWidth){
    size -= 1;
    ctx.font = `${weight} ${size}px Arial`;
  }
  if (ctx.measureText(text).width > maxWidth){
    while (text.length > 1 && ctx.measureText(`${text}…`).width > maxWidth) text = text.slice(0, -1);
    text += '…';
  }
  ctx.fillText(text, x, y);
}

function drawInvoiceInfoBox(ctx, x, y, width, height, title, entries){
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#d9c7ef';
  ctx.lineWidth = 2;
  roundedRectPath(ctx, x, y, width, height, 22);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#f5ecff';
  roundedRectPath(ctx, x + 2, y + 2, width - 4, 58, 20);
  ctx.fill();
  ctx.fillStyle = '#5b21b6';
  ctx.font = '700 23px Arial';
  ctx.fillText(title.toUpperCase(), x + 24, y + 39);

  let lineY = y + 92;
  for (const [label, value] of entries){
    ctx.fillStyle = '#6a5575';
    ctx.font = '700 16px Arial';
    ctx.fillText(label, x + 24, lineY);
    ctx.fillStyle = '#24112f';
    drawFittedCanvasText(ctx, value, x + 158, lineY, width - 182, 600, 18, 13);
    lineY += 36;
  }
}

async function buildProfessionalInvoiceCanvas(payload){
  const payment = payload.payment || resolvePaymentFromForm(null, payload);
  const reference = payload.reservationCode || payload.trackingCode || 'À confirmer';
  const participant = payload.nom || 'Participant';
  const participantEmail = payload.email || '—';
  const participantPhone = payload.tel || payload.telephone || payload.phone || '—';
  const service = payload.creneau || payload.modules || payment.label || 'Cotisation PSSR';
  const issueDate = new Intl.DateTimeFormat('fr-BE', {dateStyle:'long'}).format(new Date());
  const canvas = document.createElement('canvas');
  canvas.width = 1240;
  canvas.height = 1754;
  const ctx = canvas.getContext('2d');
  const logo = await loadInvoiceLogo();

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const headerGradient = ctx.createLinearGradient(68, 60, 1172, 290);
  headerGradient.addColorStop(0, '#fff1f8');
  headerGradient.addColorStop(1, '#eee7ff');
  ctx.fillStyle = headerGradient;
  roundedRectPath(ctx, 68, 60, 1104, 230, 28);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  roundedRectPath(ctx, 94, 86, 330, 178, 22);
  ctx.fill();
  if (logo){
    const maxWidth = 282;
    const maxHeight = 130;
    const scale = Math.min(maxWidth / logo.naturalWidth, maxHeight / logo.naturalHeight);
    const logoWidth = logo.naturalWidth * scale;
    const logoHeight = logo.naturalHeight * scale;
    ctx.drawImage(logo, 94 + (330 - logoWidth) / 2, 86 + (178 - logoHeight) / 2, logoWidth, logoHeight);
  }else{
    ctx.fillStyle = '#b71968';
    ctx.font = '800 30px Arial';
    ctx.fillText('ÉQUILIBRE VITAL', 125, 180);
  }

  ctx.fillStyle = '#b71968';
  ctx.font = '800 42px Arial';
  ctx.fillText('FACTURE PRO FORMA', 466, 126);
  ctx.fillStyle = '#24112f';
  ctx.font = '700 25px Arial';
  ctx.fillText('En attente de paiement', 466, 166);
  ctx.fillStyle = '#604b6c';
  ctx.font = '600 19px Arial';
  ctx.fillText(`Référence : ${reference}`, 466, 210);
  ctx.fillText(`Date : ${issueDate}`, 466, 244);

  drawInvoiceInfoBox(ctx, 68, 326, 540, 260, 'Émetteur', [
    ['Association', 'Équilibre Vital ASBL'],
    ['Adresse', '1080 Bruxelles'],
    ['BCE', '1019.487.618'],
    ['Contact', 'equilibrevital.bruxelles@gmail.com'],
    ['Téléphone', '0492/691.070']
  ]);
  drawInvoiceInfoBox(ctx, 632, 326, 540, 260, 'Participant', [
    ['Nom', participant],
    ['Email', participantEmail],
    ['Téléphone', participantPhone],
    ['Statut', 'Inscription reçue'],
    ['Référence', reference]
  ]);

  ctx.fillStyle = '#24112f';
  roundedRectPath(ctx, 68, 626, 1104, 58, 18);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 20px Arial';
  ctx.fillText('DESCRIPTION', 92, 664);
  ctx.fillText('QTÉ', 890, 664);
  ctx.textAlign = 'right';
  ctx.fillText('MONTANT', 1148, 664);
  ctx.textAlign = 'left';

  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#d9c7ef';
  ctx.lineWidth = 2;
  roundedRectPath(ctx, 68, 684, 1104, 170, 18);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#24112f';
  ctx.font = '600 23px Arial';
  drawCanvasLines(ctx, service, 92, 730, 720, 31, 3);
  ctx.fillText('1', 900, 730);
  ctx.textAlign = 'right';
  ctx.font = '700 25px Arial';
  ctx.fillText(payment.amountDisplay, 1148, 730);
  ctx.textAlign = 'left';

  ctx.fillStyle = '#24112f';
  roundedRectPath(ctx, 710, 890, 462, 108, 22);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = '600 22px Arial';
  ctx.fillText('TOTAL À PAYER', 742, 954);
  ctx.textAlign = 'right';
  ctx.font = '800 31px Arial';
  ctx.fillText(payment.amountDisplay, 1140, 954);
  ctx.textAlign = 'left';

  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#7c3aed';
  ctx.lineWidth = 3;
  roundedRectPath(ctx, 68, 1036, 1104, 300, 24);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#5b21b6';
  ctx.font = '800 26px Arial';
  ctx.fillText('INFORMATIONS DE VIREMENT', 96, 1082);

  ctx.fillStyle = '#6a5575';
  ctx.font = '700 18px Arial';
  ctx.fillText('BÉNÉFICIAIRE', 96, 1132);
  ctx.fillText('MONTANT', 674, 1132);
  ctx.fillText('IBAN', 96, 1212);
  ctx.fillText('BIC', 674, 1212);
  ctx.fillText('COMMUNICATION OBLIGATOIRE', 96, 1290);

  ctx.fillStyle = '#24112f';
  ctx.font = '700 24px Arial';
  ctx.fillText(payment.beneficiary, 96, 1166);
  ctx.fillText(payment.amountDisplay, 674, 1166);
  ctx.font = '700 23px monospace';
  ctx.fillText(payment.ibanDisplay, 96, 1247);
  ctx.fillText(payment.bic, 674, 1247);
  ctx.fillStyle = '#b71968';
  ctx.fillText(payment.communication, 96, 1323);

  ctx.fillStyle = '#fff7fb';
  ctx.strokeStyle = '#d92e83';
  ctx.lineWidth = 2;
  roundedRectPath(ctx, 68, 1372, 1104, 150, 20);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#b71968';
  ctx.font = '800 21px Arial';
  ctx.fillText('DOCUMENT NON ACQUITTÉ', 94, 1414);
  ctx.fillStyle = '#4d315e';
  ctx.font = '600 18px Arial';
  drawCanvasLines(ctx, 'Cette facture pro forma constitue une demande de paiement et non une preuve de paiement. Le virement sera validé après vérification du compte bancaire par Équilibre Vital ASBL.', 94, 1450, 1048, 24, 3);

  ctx.strokeStyle = '#d9c7ef';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(68, 1562);
  ctx.lineTo(1172, 1562);
  ctx.stroke();
  ctx.fillStyle = '#604b6c';
  ctx.font = '600 17px Arial';
  ctx.fillText('Équilibre Vital ASBL · BCE 1019.487.618 · 1080 Bruxelles', 68, 1602);
  ctx.textAlign = 'right';
  ctx.fillText('equilibrevital.be', 1172, 1602);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#8a7495';
  ctx.font = '500 15px Arial';
  ctx.fillText('Document généré automatiquement à la suite de la réservation.', 68, 1642);

  return {canvas, reference};
}

function base64ToBytes(value){
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function singlePagePdfFromJpeg(jpegBytes, imageWidth, imageHeight){
  const encoder = new TextEncoder();
  const chunks = [];
  const offsets = [0];
  let length = 0;
  const push = value => {
    const bytes = typeof value === 'string' ? encoder.encode(value) : value;
    chunks.push(bytes);
    length += bytes.length;
  };
  const addObject = (number, value) => {
    offsets[number] = length;
    push(`${number} 0 obj\n`);
    push(value);
    push('\nendobj\n');
  };

  push('%PDF-1.4\n');
  addObject(1, '<< /Type /Catalog /Pages 2 0 R >>');
  addObject(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  addObject(3, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>');

  offsets[4] = length;
  push('4 0 obj\n');
  push(`<< /Type /XObject /Subtype /Image /Width ${imageWidth} /Height ${imageHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`);
  push(jpegBytes);
  push('\nendstream\nendobj\n');

  const pageContent = 'q\n595.28 0 0 841.89 0 0 cm\n/Im0 Do\nQ';
  addObject(5, `<< /Length ${pageContent.length} >>\nstream\n${pageContent}\nendstream`);

  const xrefOffset = length;
  push('xref\n0 6\n');
  push('0000000000 65535 f \n');
  for (let number = 1; number <= 5; number += 1){
    push(`${String(offsets[number]).padStart(10, '0')} 00000 n \n`);
  }
  push(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);
  return new Blob(chunks, {type:'application/pdf'});
}

async function createProfessionalInvoicePdf(payload){
  const {canvas, reference} = await buildProfessionalInvoiceCanvas(payload);
  const jpegData = canvas.toDataURL('image/jpeg', 0.94).split(',')[1];
  const pdf = singlePagePdfFromJpeg(base64ToBytes(jpegData), canvas.width, canvas.height);
  return {pdf, reference};
}

function initInvoiceButton(container, payload){
  const btn = container.querySelector('[data-print-invoice]');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    const initialLabel = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Création du PDF…';
    try{
      const {pdf, reference} = await createProfessionalInvoicePdf(payload);
      const url = URL.createObjectURL(pdf);
      const link = document.createElement('a');
      link.href = url;
      link.download = `facture-pro-forma-${safeInvoiceFilename(reference)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      btn.textContent = 'Facture téléchargée';
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    }catch(err){
      console.error('Invoice download failed:', err);
      btn.textContent = 'Téléchargement impossible';
      alert('La facture n’a pas pu être créée. Rechargez la page puis réessayez.');
    }finally{
      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = initialLabel || 'Télécharger votre facture';
      }, 2200);
    }
  });
}

function initPaymentDeclaredButton(container, payload, reservationId){
  const btn = container.querySelector('[data-payment-declared]');
  const status = container.querySelector('[data-payment-declared-status]');
  if (!btn || !reservationId) return;

  btn.addEventListener('click', async () => {
    btn.disabled = true;
    if (status) status.textContent = 'Enregistrement de votre déclaration…';
    try{
      const record = paymentRecordFromReservation(payload, reservationId);
      record.source = 'reservation — virement annoncé par le participant';
      record.label = `${record.label} — virement annoncé`.slice(0, 180);
      await setDoc(doc(db, 'payments', reservationId), record);
      btn.hidden = true;
      if (status) status.textContent = 'Merci. Votre virement est annoncé à l’équipe et reste à vérifier sur le compte bancaire.';
    }catch(err){
      console.error('Payment declaration failed:', err);
      btn.disabled = false;
      if (status) status.textContent = 'Impossible d’enregistrer maintenant. Conservez votre référence et contactez l’équipe si nécessaire.';
    }
  });
}

function makeTrackingCode(type = 'GEN'){
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).replace(/[^a-z0-9]/gi, '').slice(2, 6).toUpperCase().padEnd(4, 'X');
  return `PSSR-${type}-${y}${m}${d}-${random}`;
}

function dataFromForm(form){
  const raw = Object.fromEntries(new FormData(form).entries());
  delete raw.website;

  const data = {};
  for (const [key, value] of Object.entries(raw)) {
    data[key] = cleanString(value, key === 'message' || key === 'objectifs' ? 3000 : 300);
  }

  // Compatibilité : certains anciens formulaires utilisaient name/phone/subject/consent.
  // Firestore V58 attend surtout nom/telephone/type/rgpdConsent.
  if (!data.nom && data.name) data.nom = data.name;
  if (!data.telephone && data.phone) data.telephone = data.phone;
  if (!data.type && data.subject) data.type = data.subject;

  const hasConsent = Boolean(raw.rgpdConsent || raw.consent || raw.privacy || raw.accept);

  return {
    ...data,
    source: location.pathname,
    pageTitle: document.title,
    userAgent: navigator.userAgent.slice(0, 300),
    rgpdConsent: hasConsent,
    createdAt: serverTimestamp ? serverTimestamp() : new Date().toISOString()
  };
}

function findMessageElement(form){
  return form.querySelector('.msg') || document.getElementById(form.id === 'reservation-form' ? 'reservation-msg' : 'contact-msg');
}

function showMessage(form, message, ok = true){
  const msg = findMessageElement(form);
  if (msg){
    msg.hidden = false;
    msg.style.display = 'block';
    msg.textContent = message;
    msg.style.color = ok ? '#356b42' : '#9b2f2f';
    msg.scrollIntoView({behavior:'smooth', block:'nearest'});
  } else {
    alert(message);
  }
}

function showReceipt(form, payload, kind, reservationId = ''){
  const msg = findMessageElement(form);
  const code = payload.reservationCode || payload.messageCode || payload.trackingCode || '—';
  const isReservation = kind === 'reservations';
  const title = isReservation ? 'Réservation reçue' : 'Demande reçue';
  const label = isReservation ? 'Numéro de réservation' : 'Numéro de suivi';
  const next = isReservation
    ? 'Votre place sera vérifiée par l’équipe. Pour finaliser le dossier, utilisez les informations de virement ci-dessous.'
    : 'L’équipe PSSR reviendra vers vous dès que possible.';
  const msgText = isReservation
    ? `Votre demande de réservation a bien été enregistrée. Votre référence de paiement est ${code}.`
    : `Votre demande a bien été enregistrée. Votre numéro de suivi est ${code}.`;

  if (!msg){
    alert(`${msgText}\nConservez ce numéro.`);
    return;
  }

  msg.hidden = false;
  msg.style.display = 'block';
  msg.style.color = '#244b31';
  msg.innerHTML = `
    <article class="receipt-card-v58" role="status" aria-live="polite">
      <p class="receipt-eyebrow-v58">Accusé de réception</p>
      <h2>${esc(title)}</h2>
      <p>${esc(msgText)}</p>
      <div class="receipt-code-v58"><span>${esc(label)}</span><strong>${esc(code)}</strong></div>
      <dl class="receipt-details-v58">
        <div><dt>Statut</dt><dd>${isReservation ? 'Reçu — en attente de virement' : 'Reçu — en attente de traitement'}</dd></div>
        <div><dt>Date</dt><dd>${esc(new Date().toLocaleString('fr-BE'))}</dd></div>
      </dl>
      <p class="receipt-note-v58">Conservez ce numéro pour toute question. ${esc(next)}</p>
      ${isReservation ? paymentInstructionHtml(payload) : ''}
    </article>`;
  initCopyButtons(msg);
  initInvoiceButton(msg, payload);
  initPaymentDeclaredButton(msg, payload, reservationId);
  msg.scrollIntoView({behavior:'smooth', block:'nearest'});
}

function validate(form, data){
  if (!form.checkValidity()) {
    form.reportValidity();
    return 'Veuillez compléter les champs obligatoires.';
  }
  if (!data.nom || data.nom.length < 2) return 'Veuillez indiquer votre nom.';
  if (!data.email || !/^\S+@\S+\.\S+$/.test(data.email)) return 'Veuillez indiquer une adresse email valide.';
  if (!data.rgpdConsent) return 'Veuillez accepter la politique de confidentialité.';
  if (form.dataset.firebaseCollection === 'messages' && (!data.message || data.message.length < 3)) return 'Veuillez écrire un message.';
  if (form.dataset.firebaseCollection === 'reservations' && (!data.creneau || data.creneau.length < 2) && (!data.modules || data.modules.length < 2)) return 'Veuillez choisir une activité ou un module.';
  return '';
}

function ensureFeedbackElement(form){
  let feedback = form.querySelector('.contact-live-feedback-v59');
  if (!feedback) {
    feedback = document.createElement('p');
    feedback.className = 'contact-live-feedback-v59';
    feedback.setAttribute('role', 'status');
    feedback.setAttribute('aria-live', 'polite');
    feedback.hidden = true;
    const actions = form.querySelector('.home-contact-actions-v52, .form-actions, .actions, button[type="submit"]') || form.lastElementChild;
    if (actions && actions.parentNode === form) actions.insertAdjacentElement('afterend', feedback);
    else form.appendChild(feedback);
  }
  return feedback;
}

function setLiveFeedback(form, message, state = 'info'){
  const feedback = ensureFeedbackElement(form);
  feedback.hidden = false;
  feedback.textContent = message;
  feedback.dataset.state = state;
}

function initLiveFormFeedback(form){
  if (form.dataset.liveFeedbackReady === 'true') return;
  form.dataset.liveFeedbackReady = 'true';
  const fields = Array.from(form.querySelectorAll('input, select, textarea')).filter(field => {
    const type = (field.getAttribute('type') || '').toLowerCase();
    return !['hidden', 'submit', 'button', 'reset'].includes(type) && field.name !== 'website';
  });
  const updateField = field => {
    const type = (field.getAttribute('type') || '').toLowerCase();
    const hasValue = type === 'checkbox' || type === 'radio' ? field.checked : String(field.value || '').trim().length > 0;
    field.classList.toggle('is-filled-v59', hasValue);
    field.classList.toggle('is-invalid-v59', Boolean(field.required && !field.checkValidity() && hasValue));
  };
  const updateForm = () => {
    fields.forEach(updateField);
    const filled = fields.filter(field => {
      const type = (field.getAttribute('type') || '').toLowerCase();
      return type === 'checkbox' || type === 'radio' ? field.checked : String(field.value || '').trim().length > 0;
    }).length;
    if (filled > 0 && !form.dataset.submittedOk) {
      setLiveFeedback(form, 'Saisie détectée : vos informations sont prises en compte.', form.checkValidity() ? 'ok' : 'info');
    }
  };
  fields.forEach(field => {
    field.addEventListener('input', updateForm);
    field.addEventListener('change', updateForm);
  });
}

function mailtoFallback(data){
  const code = data.reservationCode || data.messageCode || data.trackingCode || '';
  const subject = encodeURIComponent(code ? `Demande PSSR — ${code}` : 'Message depuis le site PSSR');
  const body = encodeURIComponent(Object.entries(data).filter(([k]) => k !== 'payment' && k !== 'epcPayload').map(([k, v]) => `${k}: ${v}`).join('\n'));
  location.href = `mailto:${siteConfig.contactEmail}?subject=${subject}&body=${body}`;
}

function submissionKey(payload){
  return ['pssrSubmission', payload.email || '', payload.creneau || '', payload.modules || '', payload.message || ''].join('|').toLowerCase();
}

function wasRecentlySubmitted(payload){
  try{
    const key = submissionKey(payload);
    const last = Number(localStorage.getItem(key) || 0);
    return last && (Date.now() - last) < 3 * 60 * 1000;
  }catch(_){ return false; }
}

function rememberSubmission(payload){
  try{ localStorage.setItem(submissionKey(payload), String(Date.now())); }catch(_){ }
}

async function attachForms(){
  const forms = Array.from(document.querySelectorAll('form[data-firebase-collection]'));
  forms.forEach(initLiveFormFeedback);

  const enabled = await initFirebase().catch((err) => {
    console.error('Firebase init error:', err);
    return false;
  });

  forms.forEach(form => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (form.website && form.website.value) return;

      const payload = dataFromForm(form);
      const validationError = validate(form, payload);
      if (validationError){
        showMessage(form, validationError, false);
        return;
      }

      const collectionName = form.dataset.firebaseCollection || 'messages';
      const isReservation = collectionName === 'reservations';

      if (wasRecentlySubmitted(payload)) {
        showMessage(form, 'Une demande identique vient déjà d’être envoyée. Attendez quelques minutes ou contactez l’équipe PSSR si nécessaire.', false);
        return;
      }

      setLiveFeedback(form, 'Envoi en cours… merci de patienter quelques secondes.', 'sending');

      if (isReservation) {
        payload.reservationCode = makeTrackingCode('RES');
        payload.trackingCode = payload.reservationCode;
        payload.status = 'reçu';
        if (!payload.modules && payload.creneau) payload.modules = payload.creneau;
        enrichPayloadWithPayment(form, payload);
      } else {
        payload.messageCode = makeTrackingCode('MSG');
        payload.trackingCode = payload.messageCode;
        payload.status = 'reçu';
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      try{
        if (!enabled || !db){
          showMessage(form, 'Firebase n’est pas encore configuré. Ouverture de votre email pour envoyer la demande.', false);
          mailtoFallback(payload);
          return;
        }
        const firestorePayload = { ...payload };
        delete firestorePayload.payment;
        const docRef = await addDoc(collection(db, collectionName), firestorePayload);
        rememberSubmission(payload);
        form.dataset.submittedOk = 'true';
        form.reset();
        form.querySelectorAll('.is-filled-v59,.is-invalid-v59').forEach(el => el.classList.remove('is-filled-v59','is-invalid-v59'));
        showReceipt(form, payload, collectionName, docRef.id);
      }catch(err){
        console.error(err);
        showMessage(form, 'Impossible d’enregistrer dans Firebase. Vérifiez la connexion, la configuration ou les règles Firestore.', false);
      }finally{
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  });
}

attachForms();
