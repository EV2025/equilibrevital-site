
import { getFirebase, esc, fmtDate, makeCode, levelLabel } from './firebase-portal.js';

const loginPanel = document.getElementById('login-panel');
const dashboard = document.getElementById('dashboard');
const participantPanel = document.getElementById('participant-panel');
const journeyPanel = document.getElementById('journey-panel');
const passportPanel = document.getElementById('passport-panel');
const reservationsPanel = document.getElementById('my-reservations');
const slotsPanel = document.getElementById('slots');
const gdprPanel = document.getElementById('gdpr-panel');
const loginForm = document.getElementById('login-form');
const loginMsg = document.getElementById('login-msg');
const logoutBtn = document.getElementById('logout');
const reservationList = document.getElementById('reservation-list');
const slotList = document.getElementById('slot-list');
const gdprForm = document.getElementById('gdpr-form');
const gdprMsg = document.getElementById('gdpr-msg');
let fb, currentUser, profile;

function setLogoutVisibility(isAuthenticated){
  if (!logoutBtn) return;
  document.body.classList.toggle('ev49-member-authenticated', isAuthenticated);
  document.body.classList.toggle('ev50-member-authenticated', isAuthenticated);
  logoutBtn.hidden = !isAuthenticated;
  logoutBtn.classList.toggle('is-authenticated', isAuthenticated);
  logoutBtn.setAttribute('aria-hidden', isAuthenticated ? 'false' : 'true');
  if (isAuthenticated) {
    logoutBtn.style.setProperty('display', 'inline-flex', 'important');
    logoutBtn.style.setProperty('visibility', 'visible', 'important');
    logoutBtn.style.setProperty('opacity', '1', 'important');
    logoutBtn.style.setProperty('pointer-events', 'auto', 'important');
  } else {
    logoutBtn.style.setProperty('display', 'none', 'important');
    logoutBtn.style.setProperty('visibility', 'hidden', 'important');
    logoutBtn.style.setProperty('opacity', '0', 'important');
    logoutBtn.style.setProperty('pointer-events', 'none', 'important');
  }
}

const steps = [
  {key:'CAND', title:'Candidature — dépôt & éligibilité', short:'Candidature', desc:'Présenter le dispositif, recueillir le consentement, vérifier les critères et planifier l’entrée.'},
  {key:'ARF', title:'Ateliers de Remise en Forme', short:'ARF', desc:'Sensibiliser, informer et remettre progressivement le corps en mouvement.'},
  {key:'BSS', title:'Bilan Socio-Sportif', short:'BSS', desc:'Faire le point sur la santé, l’activité, les freins, les motivations et le plan individuel.'},
  {key:'PDS', title:'Parcours Découverte Sportive', short:'PDS', desc:'Découvrir des disciplines, tester des activités et recueillir les retours d’expérience.'},
  {key:'APA', title:'Activité Physique Adaptée', short:'APA', desc:'Installer une pratique régulière, adaptée et progressive.'},
  {key:'CPE', title:'Concertation Partagée d’Engagement', short:'CPE', desc:'Coordonner sport, santé et social pour lever les obstacles.'},
  {key:'SRS', title:'Suivi Renforcé Solution', short:'SRS', desc:'Maintenir une pratique durable et ajuster l’accompagnement dans le temps.'}
];
function showLogin(text){ loginMsg.hidden=false; loginMsg.textContent=text; loginMsg.style.color='#9b2f2f'; }
function activeStepKey(){ return profile?.journeyLevel || profile?.currentStep || 'CAND'; }
function stepIndex(key){ return Math.max(0, steps.findIndex(s=>s.key===key)); }
function moduleList(value){
  if (Array.isArray(value)) return value.map(String).map(v=>v.trim()).filter(Boolean);
  return String(value || '').split(/[,;
]+/).map(v=>v.trim()).filter(Boolean);
}
function uniq(values){ return Array.from(new Set(values.filter(Boolean))); }
function showGdpr(text, ok=false){ gdprMsg.hidden=false; gdprMsg.textContent=text; gdprMsg.style.color=ok?'#356b42':'#9b2f2f'; }

async function init(){
  setLogoutVisibility(false);
  fb = await getFirebase();
  loginForm.addEventListener('submit', async e=>{ e.preventDefault(); const fd=new FormData(loginForm); try{ await fb.signInWithEmailAndPassword(fb.auth, fd.get('email'), fd.get('password')); }catch(err){ showLogin('Connexion refusée. Vérifiez email/mot de passe.'); }});
  if (logoutBtn) logoutBtn.addEventListener('click', ()=> { setLogoutVisibility(false); fb.signOut(fb.auth); });
  document.getElementById('print-passport').addEventListener('click', ()=> window.print());
  gdprForm.addEventListener('submit', sendGdprRequest);
  fb.onAuthStateChanged(fb.auth, async user=>{
    currentUser = user;
    const show = Boolean(user);
    setLogoutVisibility(show);
    loginPanel.hidden = show; dashboard.hidden = !show; participantPanel.hidden=!show; journeyPanel.hidden=!show; passportPanel.hidden=!show; reservationsPanel.hidden=!show; slotsPanel.hidden=!show; gdprPanel.hidden=!show;
    if (user) await loadAll();
  });
}
async function loadAll(){ await loadProfile(); await loadReservations(); await loadSlots(); }
async function loadProfile(){
  const snap = await fb.getDoc(fb.doc(fb.db,'users',currentUser.uid));
  profile = snap.exists() ? snap.data() : {displayName: currentUser.displayName || currentUser.email, email: currentUser.email, memberCode:'—', journeyLevel:'CAND', attendanceCount:0, badges:['Bienvenue PSSR']};
  const current = activeStepKey();
  document.getElementById('welcome').textContent = `Bienvenue ${profile.displayName || ''}`;
  document.getElementById('level').textContent = current;
  document.getElementById('attendance-count').textContent = profile.attendanceCount || 0;
  document.getElementById('member-code').textContent = profile.memberCode || '—';
  document.getElementById('pass-name').textContent = profile.displayName || '—';
  document.getElementById('pass-email').textContent = profile.email || currentUser.email || '—';
  document.getElementById('pass-code').textContent = profile.memberCode || '—';
  document.getElementById('pass-level').textContent = levelLabel(current) || current;
  document.getElementById('pass-att').textContent = profile.attendanceCount || 0;
  const badges = profile.badges || ['Bienvenue PSSR'];
  document.getElementById('badges').innerHTML = badges.map(b=>`<span class="badge">${esc(b)}</span>`).join('');
  renderParticipant();
  renderJourney();
}
function renderParticipant(){
  const rows = [
    ['Nom', profile.displayName || '—'],
    ['Email', profile.email || currentUser.email || '—'],
    ['Téléphone', profile.phone || '—'],
    ['Référent·e social·e', profile.referent || profile.socialReferent || 'À compléter'],
    ['Session', profile.session || 'À confirmer'],
    ['Statut', profile.status || 'Inscrit'],
    ['Modules souhaités', moduleList(profile.modules).join(', ') || '—']
  ];
  document.getElementById('participant-kv').innerHTML = rows.map(([k,v])=>`<div><strong>${esc(k)}</strong></div><div>${esc(v)}</div>`).join('');
}
function renderJourney(){
  const current = activeStepKey();
  const idx = stepIndex(current);
  const stepWrap = document.getElementById('journey-steps');
  const panels = document.getElementById('journey-panels');
  stepWrap.innerHTML = steps.map((s,i)=>`<li class="pssr-step" role="tab" aria-selected="${i===idx}" data-step="${esc(s.key)}" data-active="${i===idx}"><strong>${esc(s.short)}</strong><br><span>${esc(s.title)}</span></li>`).join('');
  panels.innerHTML = steps.map((s,i)=>`<div class="pssr-panel ${i===idx?'active':''}" id="pssr-panel-${esc(s.key)}" role="tabpanel"><h4>${esc(s.title)}</h4><p>${esc(s.desc)}</p><div class="tag-row"><span>Prévue : ${esc(profile?.journeyDates?.[s.key]?.planned || '—')}</span><span>Réalisée : ${esc(profile?.journeyDates?.[s.key]?.done || '—')}</span></div></div>`).join('');
  stepWrap.querySelectorAll('.pssr-step').forEach(tile=>{
    tile.addEventListener('click',()=>{
      const key = tile.dataset.step;
      stepWrap.querySelectorAll('.pssr-step').forEach(x=>{x.dataset.active='false'; x.setAttribute('aria-selected','false');});
      tile.dataset.active='true'; tile.setAttribute('aria-selected','true');
      panels.querySelectorAll('.pssr-panel').forEach(p=>p.classList.remove('active'));
      document.getElementById('pssr-panel-'+key)?.classList.add('active');
    });
  });
}
async function loadReservations(){
  try{
    const q = fb.query(fb.collection(fb.db,'reservations'), fb.where('uid','==',currentUser.uid), fb.orderBy('createdAt','desc'));
    fb.onSnapshot(q, snap=>{
      const rows = snap.docs.map(d=>({id:d.id,...d.data()}));
      reservationList.innerHTML = rows.length ? rows.map(r=>`<article class="record"><h3>${esc(r.creneau || r.modules || r.slotTitle || r.reservationCode || r.id)}</h3><dl><dt>Référence</dt><dd>${esc(r.reservationCode || '—')}</dd><dt>Statut</dt><dd><span class="status-pill">${esc(r.status || 'en attente')}</span></dd><dt>Date</dt><dd>${esc(fmtDate(r.createdAt))}</dd><dt>Modules</dt><dd>${esc(r.modules || r.creneau || '—')}</dd><dt>Message</dt><dd>${esc(r.message || '')}</dd></dl></article>`).join('') : '<p>Aucune réservation membre.</p>';
      renderLinkedModules(rows);
    }, err=>{ reservationList.innerHTML = `<p class="msg">Lecture impossible : ${esc(err.message)}</p>`; renderLinkedModules([]); });
  }catch(err){ reservationList.innerHTML = `<p class="msg">${esc(err.message)}</p>`; renderLinkedModules([]); }
}
async function loadSlots(){
  renderLinkedModules([]);
}
function renderLinkedModules(reservations = []){
  const fromProfile = moduleList(profile?.modules);
  const fromReservations = reservations.flatMap(r => moduleList(r.modules || r.creneau || r.slotTitle));
  const modules = uniq([...fromProfile, ...fromReservations]);
  if (!slotList) return;
  if (!modules.length){
    slotList.innerHTML = `<article class="slot-card"><h3>Aucun module lié pour le moment</h3><p class="slot-meta">Vos modules apparaîtront ici après une inscription ou une réservation.</p><a class="btn small" href="../reservation.html">Faire une demande</a></article>`;
    return;
  }
  slotList.innerHTML = modules.map(m => {
    const params = new URLSearchParams();
    params.set('modules', m);
    return `<article class="slot-card"><h3>${esc(m)}</h3><p class="slot-meta">Lié à votre parcours PSSR</p><p>L’équipe PSSR confirme les disponibilités et les modalités de participation.</p><a class="btn small" href="../reservation.html?${params.toString()}">Demander / modifier</a></article>`;
  }).join('');
}
async function sendGdprRequest(e){
  e.preventDefault();
  try{
    const fd = new FormData(gdprForm);
    const consentCode = makeCode('PSSR-DOC');
    await fb.addDoc(fb.collection(fb.db,'consents'), {
      uid: currentUser.uid,
      consentCode,
      trackingCode: consentCode,
      email: profile.email || currentUser.email || '',
      displayName: profile.displayName || '',
      type: 'gdpr_deletion_request',
      reason: String(fd.get('reason')||'').slice(0,1500),
      status: 'reçu',
      createdAt: fb.serverTimestamp()
    });
    gdprForm.reset();
    showGdpr(`Votre demande a bien été transmise à l’équipe PSSR. Numéro de suivi : ${consentCode}.`, true);
  }catch(err){ showGdpr('Impossible d’envoyer la demande : '+(err.message||'erreur Firebase')); }
}
init().catch(err=>{ console.error(err); showLogin('Erreur Firebase : '+err.message); });
