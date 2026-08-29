import { getFirebase, esc } from './firebase-portal.js';

const panel = document.getElementById('registration-receipt');
const fallback = document.getElementById('registration-fallback');
const receiptStateKey = 'pssrRegistrationReceiptV82';

function showFallback(message){
  panel.hidden = true;
  fallback.hidden = false;
  const paragraph = fallback.querySelector('[data-fallback-message]');
  if (paragraph) paragraph.textContent = message;
}

function renderReceipt(profile, user, verificationSent){
  panel.hidden = false;
  fallback.hidden = true;
  const memberCode = profile.memberCode || '—';
  panel.innerHTML = `
    <p class="receipt-eyebrow-v58">Compte créé</p>
    <h2>Conservez vos informations de connexion</h2>
    <dl class="receipt-details-v58 registration-details-v82">
      <div><dt>Nom</dt><dd>${esc(profile.displayName || user.displayName || '—')}</dd></div>
      <div><dt>Nom d’utilisateur</dt><dd><strong>${esc(user.email || profile.email || '—')}</strong></dd></div>
      <div><dt>Code membre</dt><dd><code>${esc(memberCode)}</code></dd></div>
      <div><dt>Mot de passe</dt><dd>Non conservé et jamais envoyé par e-mail</dd></div>
    </dl>
    <div class="portal-actions"><button class="btn secondary" type="button" data-copy-code>Copier le code membre</button><a class="btn" href="./member/dashboard.html">Accéder à mon espace</a></div>
    <p class="notice">${verificationSent === false ? 'Le compte est créé, mais le premier e-mail de vérification n’a pas pu être envoyé. Vous pourrez le renvoyer depuis votre espace.' : `Un e-mail sécurisé de vérification a été envoyé à <strong>${esc(user.email || profile.email || '')}</strong>. Vérifiez aussi les courriers indésirables.`} Votre nom d’utilisateur est votre adresse e-mail.</p>`;
  panel.querySelector('[data-copy-code]')?.addEventListener('click', async event => {
    try{ await navigator.clipboard.writeText(memberCode); event.currentTarget.textContent = 'Code copié'; }
    catch(_){ window.prompt('Copiez votre code membre :', memberCode); }
  });
}

async function init(){
  const fb = await getFirebase();
  let receiptState = null;
  try{ receiptState = JSON.parse(sessionStorage.getItem(receiptStateKey) || 'null'); }
  catch(_){ receiptState = null; }
  fb.onAuthStateChanged(fb.auth, async user => {
    if (!user) return showFallback('Reconnectez-vous pour consulter votre code membre et vos informations de compte.');
    try{
      const snapshot = await fb.getDoc(fb.doc(fb.db, 'users', user.uid));
      if (!snapshot.exists()) return showFallback('Votre compte existe, mais le dossier membre n’est pas encore disponible.');
      renderReceipt(snapshot.data(), user, receiptState?.verificationSent);
    }catch(error){
      console.error('Registration receipt:', error);
      showFallback('Les informations du compte sont momentanément indisponibles. Accédez à votre espace membre pour réessayer.');
    }
  });
}

init().catch(error => { console.error('Registration receipt init:', error); showFallback('Cette page est momentanément indisponible.'); });
