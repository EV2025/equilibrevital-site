const receiptKey = 'pssrRegistrationReceiptV82';
const panel = document.getElementById('registration-receipt');
const fallback = document.getElementById('registration-fallback');

function esc(value){
  return String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[character]));
}

let receipt = null;
try { receipt = JSON.parse(sessionStorage.getItem(receiptKey) || 'null'); }
catch (_) { receipt = null; }

if (receipt?.memberCode && receipt?.email){
  panel.hidden = false;
  fallback.hidden = true;
  panel.innerHTML = `
    <p class="receipt-eyebrow-v58">Compte créé</p>
    <h2>Conservez vos informations de connexion</h2>
    <dl class="receipt-details-v58 registration-details-v82">
      <div><dt>Nom</dt><dd>${esc(receipt.displayName || '—')}</dd></div>
      <div><dt>Nom d’utilisateur</dt><dd><strong>${esc(receipt.email)}</strong></dd></div>
      <div><dt>Code membre</dt><dd><code>${esc(receipt.memberCode)}</code></dd></div>
      <div><dt>Mot de passe</dt><dd>Non affiché et jamais envoyé par e-mail</dd></div>
    </dl>
    <div class="portal-actions">
      <button class="btn secondary" type="button" data-copy-code>Copier le code membre</button>
      <a class="btn" href="./member/dashboard.html">Accéder à mon espace</a>
    </div>
    <p class="notice">${receipt.verificationSent ? `Un e-mail sécurisé de vérification a été envoyé à <strong>${esc(receipt.email)}</strong>. Vérifiez aussi les courriers indésirables.` : `Le compte est créé, mais l’e-mail de vérification n’a pas pu être envoyé. Vous pourrez demander un nouvel envoi depuis votre espace.`} Votre nom d’utilisateur est votre adresse e-mail.</p>`;

  panel.querySelector('[data-copy-code]')?.addEventListener('click', async event => {
    try{
      await navigator.clipboard.writeText(receipt.memberCode);
      event.currentTarget.textContent = 'Code copié';
    }catch(_){
      window.prompt('Copiez votre code membre :', receipt.memberCode);
    }
  });
}else{
  panel.hidden = true;
  fallback.hidden = false;
}
