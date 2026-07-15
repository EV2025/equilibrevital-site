import { firebaseConfig, firebaseEnabled, siteConfig } from './firebase-config.js';

let db = null;
let addDoc = null;
let collection = null;
let serverTimestamp = null;

async function initFirebase(){
  if (!firebaseEnabled) return false;
  const appMod = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js');
  const fsMod = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
  const app = appMod.initializeApp(firebaseConfig);
  db = fsMod.getFirestore(app);
  addDoc = fsMod.addDoc;
  collection = fsMod.collection;
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

const QR_CODE_CDN = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.4/build/qrcode.min.js';
let qrCodeLibraryPromise = null;

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
  const epcPayloadB64 = btoa(unescape(encodeURIComponent(payment.epcPayload)));
  return `
    <section class="receipt-payment-v1" aria-label="Instructions de virement bancaire">
      <p class="receipt-eyebrow-v58">Paiement par virement SEPA</p>
      <h3>Scannez le QR code avec votre app bancaire</h3>
      <div class="sepa-payment-layout-v1">
        <div class="sepa-qr-card-v1">
          <canvas class="sepa-qr-canvas-v1" data-sepa-qr-canvas data-epc-payload="${esc(epcPayloadB64)}" width="256" height="256" aria-label="QR code SEPA/EPC"></canvas>
          <p class="sepa-qr-status-v1" data-sepa-qr-status>Génération du QR code…</p>
        </div>
        <div>
          <p class="receipt-note-v58">Votre application bancaire préremplit le bénéficiaire, l’IBAN, le montant et la communication. Vous devez toujours vérifier les informations puis valider le virement dans votre app bancaire.</p>
          <dl class="receipt-details-v58 payment-details-clear-v1">
            <div><dt>Montant</dt><dd><strong>${esc(payment.amountDisplay)}</strong></dd></div>
            <div><dt>Bénéficiaire</dt><dd>${esc(payment.beneficiary)}</dd></div>
            <div><dt>IBAN</dt><dd><code>${esc(payment.ibanDisplay)}</code> <button type="button" class="copy-payment-v1" data-copy-value="${esc(payment.iban)}">Copier</button></dd></div>
            <div><dt>BIC</dt><dd><code>${esc(payment.bic)}</code></dd></div>
            <div><dt>Communication</dt><dd><code>${esc(payment.communication)}</code> <button type="button" class="copy-payment-v1" data-copy-value="${esc(payment.communication)}">Copier</button></dd></div>
          </dl>
        </div>
      </div>
      <p class="receipt-note-v58"><strong>Important :</strong> indiquez exactement la communication. L’équipe vérifiera le compte bancaire et passera votre dossier en “payé” manuellement.</p>
    </section>`;
}

function loadQRCodeLibrary(){
  if (window.QRCode?.toCanvas) return Promise.resolve(window.QRCode);
  if (qrCodeLibraryPromise) return qrCodeLibraryPromise;
  qrCodeLibraryPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${QR_CODE_CDN}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(window.QRCode), { once:true });
      existing.addEventListener('error', reject, { once:true });
      return;
    }
    const script = document.createElement('script');
    script.src = QR_CODE_CDN;
    script.async = true;
    script.onload = () => window.QRCode?.toCanvas ? resolve(window.QRCode) : reject(new Error('Bibliothèque QR indisponible'));
    script.onerror = () => reject(new Error('Chargement QR impossible'));
    document.head.appendChild(script);
  });
  return qrCodeLibraryPromise;
}

function decodeBase64Utf8(value){
  try { return decodeURIComponent(escape(atob(value || ''))); }
  catch(_) { return ''; }
}

async function renderSepaQrCodes(container){
  const canvases = Array.from(container.querySelectorAll('[data-sepa-qr-canvas]'));
  if (!canvases.length) return;
  try{
    const QRCode = await loadQRCodeLibrary();
    for (const canvas of canvases){
      const payload = decodeBase64Utf8(canvas.dataset.epcPayload || '');
      const status = canvas.parentElement?.querySelector('[data-sepa-qr-status]');
      if (!payload) {
        if (status) status.textContent = 'QR code indisponible : informations manquantes.';
        continue;
      }
      await new Promise((resolve, reject) => {
        QRCode.toCanvas(canvas, payload, {
          errorCorrectionLevel: 'M',
          margin: 2,
          width: 256,
          color: { dark: '#111111', light: '#FFFFFF' }
        }, err => err ? reject(err) : resolve());
      });
      if (status) status.textContent = 'QR code SEPA/EPC prêt à scanner.';
    }
  }catch(err){
    console.warn('QR code generation failed:', err);
    container.querySelectorAll('[data-sepa-qr-status]').forEach(status => {
      status.textContent = 'QR code indisponible. Utilisez les informations de virement affichées ci-dessous.';
    });
  }
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

function showReceipt(form, payload, kind){
  const msg = findMessageElement(form);
  const code = payload.reservationCode || payload.messageCode || payload.trackingCode || '—';
  const isReservation = kind === 'reservations';
  const title = isReservation ? 'Réservation reçue' : 'Demande reçue';
  const label = isReservation ? 'Numéro de réservation' : 'Numéro de suivi';
  const next = isReservation
    ? 'Votre place sera vérifiée par l’équipe. Pour finaliser le dossier, utilisez le QR code SEPA ou les informations de virement ci-dessous.'
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
  renderSepaQrCodes(msg);
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
        if (isReservation) {
          await addDoc(collection(db, 'payments'), paymentRecordFromReservation(payload, docRef.id)).catch(err => {
            console.warn('Payment tracking document not created:', err);
          });
        }
        rememberSubmission(payload);
        form.dataset.submittedOk = 'true';
        form.reset();
        form.querySelectorAll('.is-filled-v59,.is-invalid-v59').forEach(el => el.classList.remove('is-filled-v59','is-invalid-v59'));
        showReceipt(form, payload, collectionName);
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
