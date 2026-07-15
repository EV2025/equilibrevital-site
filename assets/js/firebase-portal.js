
import { firebaseConfig, firebaseEnabled } from './firebase-config.js';

let app, auth, db, modules;

export async function getFirebase(){
  if (!firebaseEnabled) throw new Error('Firebase n’est pas configuré.');
  if (modules) return { app, auth, db, ...modules };
  const appMod = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js');
  const authMod = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js');
  const fsMod = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
  app = appMod.initializeApp(firebaseConfig);
  auth = authMod.getAuth(app);
  db = fsMod.getFirestore(app);
  modules = { ...authMod, ...fsMod };
  return { app, auth, db, ...modules };
}

export function esc(v){
  return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;'}[c]));
}

export function fmtDate(v){
  try { return v?.toDate ? v.toDate().toLocaleString('fr-BE') : (v || ''); }
  catch { return ''; }
}

export function clean(value, max=1000){
  return String(value || '').trim().slice(0, max);
}

export function makeCode(prefix='PSSR'){
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth()+1).padStart(2,'0');
  const d = String(now.getDate()).padStart(2,'0');
  const r = Math.random().toString(36).slice(2,6).toUpperCase();
  return `${prefix}-${y}${m}${d}-${r}`;
}

export function levelFromAttendance(count){
  if (count >= 18) return 'SRS';
  if (count >= 12) return 'CPE';
  if (count >= 8) return 'APA';
  if (count >= 4) return 'PDS';
  if (count >= 2) return 'BSS';
  return 'ARF';
}

export function levelLabel(code){
  return ({
    ARF:'ARF — Ateliers de remise en forme',
    BSS:'BSS — Bilan socio-sportif',
    PDS:'PDS — Parcours découverte sportive',
    APA:'APA — Activité physique adaptée',
    CPE:'CPE — Concertation partagée d’engagement',
    SRS:'SRS — Suivi renforcé solution'
  })[code] || code;
}
