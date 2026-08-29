import { getFirebase } from './firebase-portal.js';

const form = document.getElementById('new-password-form');
const status = document.getElementById('password-action-status');
const account = document.getElementById('password-action-account');
const submit = form?.querySelector('button[type="submit"]');
const params = new URLSearchParams(location.search);
const mode = params.get('mode');
const oobCode = params.get('oobCode');

function show(message, ok = false){
  status.hidden = false;
  status.textContent = message;
  status.style.color = ok ? '#356b42' : '#9b2f2f';
}

function safeReturnUrl(){
  const fallback = new URL('/member/dashboard.html', location.origin).href;
  const raw = params.get('continueUrl');
  if (!raw) return fallback;
  try{
    const target = new URL(raw);
    const allowed = ['/member/dashboard.html', '/admin/index.html'];
    return target.origin === location.origin && allowed.includes(target.pathname) ? target.href : fallback;
  }catch(_){ return fallback; }
}

async function init(){
  if (mode !== 'resetPassword' || !oobCode){
    form.hidden = true;
    return show('Ce lien est incomplet ou invalide. Demandez un nouveau lien de réinitialisation.');
  }
  try{
    const fb = await getFirebase();
    const email = await fb.verifyPasswordResetCode(fb.auth, oobCode);
    account.textContent = `Compte concerné : ${email}`;
    form.hidden = false;
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const data = new FormData(form);
      const password = String(data.get('password') || '');
      const confirmation = String(data.get('passwordConfirm') || '');
      if (password.length < 8) return show('Choisissez un mot de passe d’au moins 8 caractères.');
      if (password !== confirmation) return show('Les deux mots de passe ne correspondent pas.');
      submit.disabled = true;
      submit.textContent = 'Enregistrement…';
      try{
        await fb.confirmPasswordReset(fb.auth, oobCode, password);
        form.hidden = true;
        show('Votre nouveau mot de passe est enregistré. Vous pouvez maintenant vous connecter.', true);
        const link = document.getElementById('password-action-return');
        link.href = safeReturnUrl();
        link.hidden = false;
      }catch(error){
        console.warn('Password action:', error?.code || error?.message || error);
        show(error?.code === 'auth/expired-action-code' ? 'Ce lien a expiré. Demandez un nouveau lien.' : 'Le mot de passe n’a pas pu être enregistré. Demandez un nouveau lien.');
      }finally{
        submit.disabled = false;
        submit.textContent = 'Enregistrer mon nouveau mot de passe';
      }
    });
  }catch(error){
    form.hidden = true;
    show(error?.code === 'auth/expired-action-code' ? 'Ce lien a expiré. Demandez un nouveau lien de réinitialisation.' : 'Ce lien est invalide ou a déjà été utilisé.');
  }
}

init().catch(error => {
  console.error(error);
  form.hidden = true;
  show('Impossible d’ouvrir le service de réinitialisation pour le moment.');
});
