import { getFirebase, clean } from './firebase-portal.js';

const form = document.getElementById('reset-form');
const msg = document.getElementById('reset-msg');

function show(text, ok = true){
  msg.hidden = false;
  msg.textContent = text;
  msg.style.color = ok ? '#356b42' : '#9b2f2f';
}

function resetErrorMessage(error){
  const code = error?.code || '';
  if (code === 'auth/invalid-email') return 'L’adresse email indiquée n’est pas valide.';
  if (code === 'auth/too-many-requests') return 'Trop de demandes ont été effectuées. Attendez quelques minutes avant de réessayer.';
  if (code === 'auth/network-request-failed') return 'La connexion à Firebase a échoué. Vérifiez votre connexion internet et réessayez.';
  if (['auth/unauthorized-domain', 'auth/unauthorized-continue-uri', 'auth/invalid-continue-uri'].includes(code)){
    return 'Le domaine du site n’est pas encore autorisé pour la réinitialisation. La configuration Firebase doit être corrigée.';
  }
  return 'L’envoi du lien a échoué. Réessayez dans quelques instants ou contactez l’administrateur.';
}

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = clean(new FormData(form).get('email'), 180).toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return show('Adresse email invalide.', false);

  const button = form.querySelector('button[type="submit"]');
  const initialLabel = button.textContent;
  msg.hidden = true;
  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  button.textContent = 'Envoi en cours…';

  try {
    const fb = await getFirebase();
    const isAdmin = new URLSearchParams(location.search).get('type') === 'admin';
    const returnPath = isAdmin ? '/admin/index.html' : '/member/dashboard.html';
    const url = new URL(returnPath, location.origin).href;
    await fb.sendPasswordResetEmail(fb.auth, email, { url, handleCodeInApp: false });
    form.reset();
    show('Demande envoyée. Vérifiez votre boîte de réception, les courriers indésirables et l’onglet Promotions. Le message peut prendre quelques minutes.', true);
  } catch (error) {
    console.warn('Password reset:', error?.code || error?.message || error);
    show(resetErrorMessage(error), false);
  } finally {
    button.disabled = false;
    button.removeAttribute('aria-busy');
    button.textContent = initialLabel;
  }
});
