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
        <button type="button" class="btn secondary payment-invoice-v1" data-print-invoice>Imprimer votre facture</button>
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


function professionalInvoiceHtml(payload){
  const payment = payload.payment || resolvePaymentFromForm(null, payload);
  const invoiceNumber = payload.reservationCode || payload.trackingCode || 'À confirmer';
  const customerName = payload.nom || 'Participant';
  const customerEmail = payload.email || '';
  const customerPhone = payload.tel || payload.telephone || payload.phone || '';
  const service = payload.creneau || payload.modules || payment.label || 'Cotisation PSSR';
  const issueDate = new Intl.DateTimeFormat('fr-BE', {dateStyle:'long'}).format(new Date());

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Facture pro forma — ${esc(invoiceNumber)}</title>
<style>
@page{size:A4;margin:16mm}
*{box-sizing:border-box}
body{margin:0;font-family:Arial,Helvetica,sans-serif;color:#24112f;background:#fff;font-size:14px;line-height:1.5}
.invoice{max-width:820px;margin:0 auto}
.header{display:flex;justify-content:space-between;gap:28px;padding-bottom:22px;border-bottom:3px solid #7c3aed}
.brand h1{margin:0;color:#b71968;font-size:28px}.brand p{margin:5px 0}
.status{text-align:right}.status strong{display:inline-block;padding:7px 12px;border-radius:999px;background:#f5ecff;color:#5b21b6}
.meta{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:24px}
.box{padding:16px;border:1px solid #d8c4f2;border-radius:14px}.box h2{margin:0 0 9px;font-size:15px;text-transform:uppercase;color:#5b21b6}
table{width:100%;border-collapse:collapse;margin-top:26px}th,td{padding:12px;border-bottom:1px solid #ddd;text-align:left}th{background:#f8f4fc}.amount{text-align:right;font-weight:700}
.total{margin:22px 0 0 auto;width:min(340px,100%);padding:16px;border-radius:14px;background:#24112f;color:#fff}.total div{display:flex;justify-content:space-between;gap:20px;font-size:18px}
.payment{margin-top:26px;padding:18px;border:2px solid #7c3aed;border-radius:14px}.payment h2{margin-top:0}.payment code{font-size:14px;word-break:break-all}
.notice{margin-top:26px;padding:14px;border-left:4px solid #d92e83;background:#fff7fb}
.footer{margin-top:34px;padding-top:16px;border-top:1px solid #ddd;color:#604b6c;font-size:12px}
@media(max-width:640px){.header,.meta{display:block}.status{text-align:left;margin-top:18px}.box{margin-top:12px}}
@media print{.invoice{max-width:none}}
</style>
</head>
<body>
<main class="invoice">
  <header class="header">
    <div class="brand">
      <h1>Équilibre Vital ASBL</h1>
      <p>1080 Bruxelles</p>
      <p>BCE : 1019.487.618</p>
      <p>equilibrevital.bruxelles@gmail.com · 0492/691.070</p>
    </div>
    <div class="status">
      <strong>FACTURE PRO FORMA</strong>
      <p>En attente de paiement</p>
    </div>
  </header>
  <section class="meta">
    <div class="box"><h2>Document</h2><p><strong>Référence :</strong> ${esc(invoiceNumber)}</p><p><strong>Date :</strong> ${esc(issueDate)}</p></div>
    <div class="box"><h2>Participant</h2><p><strong>${esc(customerName)}</strong></p><p>${esc(customerEmail)}</p><p>${esc(customerPhone)}</p></div>
  </section>
  <table>
    <thead><tr><th>Description</th><th>Quantité</th><th class="amount">Montant</th></tr></thead>
    <tbody><tr><td>${esc(service)}</td><td>1</td><td class="amount">${esc(payment.amountDisplay)}</td></tr></tbody>
  </table>
  <section class="total"><div><span>Total à payer</span><strong>${esc(payment.amountDisplay)}</strong></div></section>
  <section class="payment">
    <h2>Informations de virement</h2>
    <p><strong>Bénéficiaire :</strong> ${esc(payment.beneficiary)}</p>
    <p><strong>IBAN :</strong> <code>${esc(payment.ibanDisplay)}</code></p>
    <p><strong>BIC :</strong> <code>${esc(payment.bic)}</code></p>
    <p><strong>Communication obligatoire :</strong> <code>${esc(payment.communication)}</code></p>
  </section>
  <p class="notice"><strong>Document non acquitté.</strong> Cette facture pro forma est une demande de paiement et ne constitue pas une preuve de paiement. La réception du virement doit être vérifiée par Équilibre Vital ASBL.</p>
  <footer class="footer">Équilibre Vital ASBL · BCE 1019.487.618 · 1080 Bruxelles · equilibrevital.be</footer>
</main>
</body>
</html>`;
}

function initInvoiceButton(container, payload){
  const btn = container.querySelector('[data-print-invoice]');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const invoiceWindow = window.open('', '_blank', 'width=900,height=900');
    if (!invoiceWindow) {
      alert('L’impression a été bloquée par le navigateur. Autorisez les fenêtres contextuelles puis réessayez.');
      return;
    }
    invoiceWindow.opener = null;
    invoiceWindow.document.open();
    invoiceWindow.document.write(professionalInvoiceHtml(payload));
    invoiceWindow.document.close();
    invoiceWindow.focus();
    setTimeout(() => invoiceWindow.print(), 300);
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
