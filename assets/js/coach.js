
import { getFirebase, esc, fmtDate, levelFromAttendance } from './firebase-portal.js';

const loginPanel = document.getElementById('login-panel');
const coachPanel = document.getElementById('coach-panel');
const loginForm = document.getElementById('login-form');
const loginMsg = document.getElementById('login-msg');
const logoutBtn = document.getElementById('logout');
const records = document.getElementById('coach-records');
let fb, currentTab='reservations', unsub=null, currentUser=null;
function msg(t){ loginMsg.hidden=false; loginMsg.textContent=t; loginMsg.style.color='#9b2f2f'; }
async function init(){
  fb = await getFirebase();
  loginForm.addEventListener('submit', async e=>{ e.preventDefault(); const fd=new FormData(loginForm); try{ await fb.signInWithEmailAndPassword(fb.auth, fd.get('email'), fd.get('password')); }catch{ msg('Connexion refusée.'); }});
  logoutBtn.addEventListener('click', ()=>fb.signOut(fb.auth));
  document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');currentTab=b.dataset.tab;load();}));
  fb.onAuthStateChanged(fb.auth, async user=>{
    currentUser=user; loginPanel.hidden=Boolean(user); coachPanel.hidden=!user; logoutBtn.hidden=!user;
    if (user){
      const ok = await isAllowed(user.uid);
      if (!ok){ msg('Accès refusé : cet utilisateur n’est pas déclaré comme coach/admin dans Firestore.'); await fb.signOut(fb.auth); return; }
      load();
    }
    if (!user && unsub) unsub();
  });
}
async function isAllowed(uid){
  const [admin, coach] = await Promise.all([fb.getDoc(fb.doc(fb.db,'admins',uid)), fb.getDoc(fb.doc(fb.db,'coaches',uid))]);
  return admin.exists() || coach.exists();
}
function load(){
  if (unsub) unsub(); records.innerHTML='<p>Chargement…</p>';
  let q = fb.collection(fb.db,currentTab);
  try{ q = fb.query(q, fb.orderBy(currentTab==='slots'?'order':'createdAt', currentTab==='slots'?'asc':'desc')); }catch{}
  unsub = fb.onSnapshot(q, snap=>{ const rows=snap.docs.map(d=>({id:d.id,...d.data()})); render(rows); }, err=>{records.innerHTML=`<p class="msg">${esc(err.message)}</p>`;});
}
function render(rows){
  if (!rows.length){records.innerHTML='<p>Aucune donnée.</p>';return;}
  records.innerHTML = rows.map(r=>{
    if (currentTab==='reservations') return reservationCard(r);
    if (currentTab==='users') return userCard(r);
    return slotCard(r);
  }).join('');
  records.querySelectorAll('[data-status]').forEach(b=>b.addEventListener('click',()=>updateStatus(b.dataset.id,b.dataset.status)));
  records.querySelectorAll('[data-present]').forEach(b=>b.addEventListener('click',()=>markPresent(b.dataset.uid,b.dataset.name,b.dataset.reservation)));
}
function reservationCard(r){
  return `<article class="record"><h3>${esc(r.nom || r.email || r.id)}</h3><dl><dt>Créneau</dt><dd>${esc(r.creneau || r.slotTitle || '')}</dd><dt>Numéro de réservation</dt><dd>${esc(r.reservationCode || r.trackingCode || '—')}</dd><dt>Statut</dt><dd><span class="status-pill">${esc(r.status || 'reçu')}</span></dd><dt>Date</dt><dd>${esc(fmtDate(r.createdAt))}</dd><dt>Contact</dt><dd>${esc(r.email || '')} · ${esc(r.tel || '')}</dd></dl><div class="coach-actions"><button class="btn small secondary" data-status="confirmée" data-id="${esc(r.id)}">Confirmer</button><button class="btn small secondary" data-status="liste_attente" data-id="${esc(r.id)}">Liste d’attente</button><button class="btn small secondary" data-status="annulée" data-id="${esc(r.id)}">Annuler</button>${r.uid?`<button class="btn small" data-present="1" data-uid="${esc(r.uid)}" data-name="${esc(r.nom || '')}" data-reservation="${esc(r.id)}">Présence validée</button>`:''}</div></article>`;
}
function userCard(r){return `<article class="record"><h3>${esc(r.displayName || r.email || r.id)}</h3><dl><dt>Email</dt><dd>${esc(r.email || '')}</dd><dt>Code</dt><dd>${esc(r.memberCode || '')}</dd><dt>Niveau</dt><dd>${esc(r.journeyLevel || 'ARF')}</dd><dt>Présences</dt><dd>${esc(r.attendanceCount || 0)}</dd><dt>Objectifs</dt><dd>${esc(r.goals || '')}</dd></dl></article>`;}
function slotCard(r){return `<article class="record"><h3>${esc(r.activity || r.id)}</h3><dl><dt>Jour</dt><dd>${esc(r.day || '')} ${esc(r.start || '')}–${esc(r.end || '')}</dd><dt>Public</dt><dd>${esc(r.public || '')}</dd><dt>Capacité</dt><dd>${esc(r.capacity || '')}</dd><dt>Actif</dt><dd>${r.active===false?'Non':'Oui'}</dd></dl></article>`;}
async function updateStatus(id,status){ await fb.updateDoc(fb.doc(fb.db,'reservations',id), {status, updatedAt:fb.serverTimestamp()}); }
async function markPresent(uid,name,reservationId){
  if(!uid) return;
  await fb.addDoc(fb.collection(fb.db,'attendances'), {uid, name, reservationId, status:'présent', createdAt:fb.serverTimestamp(), coachUid:currentUser.uid});
  const userRef = fb.doc(fb.db,'users',uid);
  const snap = await fb.getDoc(userRef);
  const count = (snap.data()?.attendanceCount || 0) + 1;
  const level = levelFromAttendance(count);
  await fb.setDoc(userRef, {attendanceCount: count, journeyLevel: level, updatedAt: fb.serverTimestamp()}, {merge:true});
  await fb.setDoc(fb.doc(fb.db,'passports',uid), {attendanceCount:count, journeyLevel:level, updatedAt:fb.serverTimestamp()}, {merge:true});
  alert('Présence validée et niveau recalculé.');
}
init().catch(err=>msg('Erreur Firebase : '+err.message));
