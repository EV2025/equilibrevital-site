
import { getFirebase, esc, fmtDate, levelFromAttendance } from './firebase-portal.js';

const loginPanel = document.getElementById('login-panel');
const coachPanel = document.getElementById('coach-panel');
const loginForm = document.getElementById('login-form');
const loginMsg = document.getElementById('login-msg');
const logoutBtn = document.getElementById('logout');
const records = document.getElementById('coach-records');
const coachStatus = document.getElementById('coach-status');
let fb, currentTab='reservations', unsub=null, currentUser=null;
function msg(t){ loginMsg.hidden=false; loginMsg.textContent=t; loginMsg.style.color='#9b2f2f'; }
function status(t,error=false){ if(!coachStatus)return; coachStatus.textContent=t; coachStatus.style.color=error?'#9b2f2f':'#356b42'; }
function maskMemberCode(value){ const code=String(value||''); return code.length>4 ? `•••• ${code.slice(-4)}` : '—'; }
async function init(){
  fb = await getFirebase();
  loginForm.addEventListener('submit', async e=>{ e.preventDefault(); const fd=new FormData(loginForm); const button=loginForm.querySelector('button[type="submit"]'); button.disabled=true; try{ await fb.signInWithEmailAndPassword(fb.auth, fd.get('email'), fd.get('password')); loginMsg.hidden=true; }catch{ msg('Connexion refusée.'); }finally{ button.disabled=false; }});
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
  unsub = fb.onSnapshot(q, snap=>{ const rows=snap.docs.map(d=>({id:d.id,...d.data()})); render(rows); status(`Synchronisé en temps réel · ${new Date().toLocaleTimeString('fr-BE',{hour:'2-digit',minute:'2-digit'})}`); }, err=>{ console.error('Coach realtime sync:',err); const denied=err?.code==='permission-denied'; records.innerHTML=`<p class="msg">${denied?'Accès Firebase refusé. Vérifiez les règles Firestore publiées.':'Synchronisation interrompue. Rechargez la page.'}</p>`; status(denied?'Synchronisation refusée par Firebase.':'Synchronisation interrompue.',true);});
}
function render(rows){
  if (!rows.length){records.innerHTML='<p>Aucune donnée.</p>';return;}
  records.innerHTML = rows.map(r=>{
    if (currentTab==='reservations') return reservationCard(r);
    if (currentTab==='users') return userCard(r);
    return slotCard(r);
  }).join('');
  records.querySelectorAll('[data-present]').forEach(button=>button.addEventListener('click',async()=>{
    button.disabled=true;
    status('Action en cours…');
    try{
      await markPresent(button.dataset.uid,button.dataset.name,button.dataset.reservation);
    }catch(error){
      console.error('Coach action:',error);
      status(error?.code==='permission-denied'?'Action refusée par les règles Firebase.':'Action impossible. Réessayez.',true);
    }finally{ button.disabled=false; }
  }));
}
function reservationCard(r){
  const participant = r.nom || r.displayName || 'Participant';
  return `<article class="record"><h3>${esc(participant)}</h3><dl><dt>Activité</dt><dd>${esc(r.creneau || r.slotTitle || r.modules || 'À confirmer')}</dd><dt>Réservation</dt><dd>${esc(r.reservationCode || r.trackingCode || '—')}</dd><dt>Statut</dt><dd><span class="status-pill">${esc(r.status || 'reçu')}</span></dd><dt>Date</dt><dd>${esc(fmtDate(r.createdAt))}</dd></dl><div class="coach-actions">${r.uid?`<button type="button" class="btn small" data-present="1" data-uid="${esc(r.uid)}" data-name="${esc(participant)}" data-reservation="${esc(r.id)}">Valider la présence</button>`:'<span class="secondary-muted">Compte membre à relier avant l’appel.</span>'}</div></article>`;
}
function userCard(r){
  return `<article class="record"><h3>${esc(r.displayName || 'Membre PSSR')}</h3><dl><dt>Code abrégé</dt><dd>${esc(maskMemberCode(r.memberCode))}</dd><dt>Étape</dt><dd>${esc(r.journeyLevel || 'ARF')}</dd><dt>Présences</dt><dd>${esc(r.attendanceCount || 0)}</dd><dt>Objectifs sportifs</dt><dd>${esc(r.goals || 'À compléter')}</dd><dt>Modules</dt><dd>${esc(Array.isArray(r.modules)?r.modules.join(', '):(r.modules||'—'))}</dd></dl></article>`;
}
function slotCard(r){return `<article class="record"><h3>${esc(r.activity || r.id)}</h3><dl><dt>Jour</dt><dd>${esc(r.day || '')} ${esc(r.start || '')}–${esc(r.end || '')}</dd><dt>Public</dt><dd>${esc(r.public || '')}</dd><dt>Capacité</dt><dd>${esc(r.capacity || '')}</dd><dt>Actif</dt><dd>${r.active===false?'Non':'Oui'}</dd></dl></article>`;}
async function markPresent(uid,name,reservationId){
  if(!uid) return;
  const sessionKey = new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Brussels'}).format(new Date());
  const safeReservation = String(reservationId || 'session').replace(/[^a-zA-Z0-9_-]/g,'_');
  const attendanceRef = fb.doc(fb.db,'attendances',`${uid}_${safeReservation}_${sessionKey}`);
  const userRef = fb.doc(fb.db,'users',uid);
  const passportRef = fb.doc(fb.db,'passports',uid);
  let newCount = 0;
  try{
    await fb.runTransaction(fb.db, async transaction=>{
      const existing = await transaction.get(attendanceRef);
      if(existing.exists()){
        const duplicate = new Error('already-present');
        duplicate.code = 'already-present';
        throw duplicate;
      }
      const userSnapshot = await transaction.get(userRef);
      newCount = (userSnapshot.data()?.attendanceCount || 0) + 1;
      const level = levelFromAttendance(newCount);
      transaction.set(attendanceRef,{uid,name,reservationId:reservationId||'',sessionDate:sessionKey,status:'présent',createdAt:fb.serverTimestamp(),coachUid:currentUser.uid});
      transaction.set(userRef,{attendanceCount:newCount,journeyLevel:level,updatedAt:fb.serverTimestamp()},{merge:true});
      transaction.set(passportRef,{attendanceCount:newCount,journeyLevel:level,updatedAt:fb.serverTimestamp()},{merge:true});
    });
    status(`Présence validée · ${newCount} présence${newCount>1?'s':''} au total.`);
  }catch(error){
    if(error?.code==='already-present'){
      status('Cette présence est déjà enregistrée pour aujourd’hui.',true);
      return;
    }
    throw error;
  }
}
init().catch(err=>msg('Erreur Firebase : '+err.message));
