import { getFirebase, clean } from './firebase-portal.js';

const form = document.getElementById('reset-form');
const msg = document.getElementById('reset-msg');
function show(text, ok = true){
  msg.hidden = false;
  msg.textContent = text;
  msg.style.color = ok ? '#356b42' : '#9b2f2f';
}
form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = clean(new FormData(form).get('email'), 180).toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return show('Adresse email invalide.', false);
  const btn = form.querySelector('button');
  btn.disabled = true;
  try {
    const fb = await getFirebase();
    const url = `${location.origin}${location.pathname.replace(/mot-de-passe-oublie\.html$/, '')}dashboard.html`;
    await fb.sendPasswordResetEmail(fb.auth, email, { url, handleCodeInApp: false });
  } catch (err) {
    console.warn('Password reset:', err?.code || err?.message || err);
  } finally {
    form.reset();
    btn.disabled = false;
    show('Si un compte existe avec cette adresse, un email de réinitialisation a été envoyé.', true);
  }
});
