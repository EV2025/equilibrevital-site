import { getFirebase, esc, fmtDate, makeCode, levelLabel } from './firebase-portal.js';
import { downloadMemberPassport } from './member-passport-pdf.js?v=20260830-101';

const loginPanel = document.getElementById('login-panel');
const loginForm = document.getElementById('login-form');
const loginMsg = document.getElementById('login-msg');
const logoutBtn = document.getElementById('logout');
const memberSections = Array.from(document.querySelectorAll('[data-member-view]'));
const bottomNav = document.getElementById('member-bottom-nav');
const globalStatus = document.getElementById('member-global-status');
const reservationList = document.getElementById('reservation-list');
const slotList = document.getElementById('slot-list');
const gdprForm = document.getElementById('gdpr-form');
const gdprMsg = document.getElementById('gdpr-msg');
const emailVerificationPanel = document.getElementById('email-verification-panel');
const resendVerificationButton = document.getElementById('resend-verification');
const refreshVerificationButton = document.getElementById('refresh-verification');
const verificationStatus = document.getElementById('verification-status');
const copyMemberCodeButton = document.getElementById('copy-member-code');
const memberProfileAlert = document.getElementById('member-profile-alert');

let fb;
let currentUser = null;
let profile = null;
let hasMemberProfile = false;
let reservationsUnsubscribe = null;
let profileUnsubscribe = null;
let currentView = ['home','parcours','demandes','profil'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'home';

const steps = [
  {key:'CAND', title:'Candidature — dépôt et validation', short:'Candidature', desc:'Présenter le dispositif, recueillir le consentement, vérifier les critères et préparer l’entrée.'},
  {key:'ARF', title:'Ateliers de Remise en Forme', short:'ARF', desc:'Sensibiliser, informer et remettre progressivement le corps en mouvement.'},
  {key:'BSS', title:'Bilan Socio-Sportif', short:'BSS', desc:'Faire le point sur la santé, l’activité, les freins, les motivations et le plan individuel.'},
  {key:'PDS', title:'Parcours Découverte Sportive', short:'PDS', desc:'Découvrir des disciplines, tester des activités et recueillir les retours d’expérience.'},
  {key:'APA', title:'Activité Physique Adaptée', short:'APA', desc:'Installer une pratique régulière, adaptée et progressive.'},
  {key:'CPE', title:'Concertation Partagée d’Engagement', short:'CPE', desc:'Coordonner sport, santé et social pour lever les obstacles.'},
  {key:'SRS', title:'Suivi Renforcé Solution', short:'SRS', desc:'Maintenir une pratique durable et ajuster l’accompagnement dans le temps.'}
];

function showMessage(element, text, ok = false){
  if (!element) return;
  element.hidden = false;
  element.textContent = text;
  element.style.color = ok ? '#356b42' : '#9b2f2f';
}

function friendlyUnavailable(){
  return 'Vos informations ne sont momentanément pas disponibles. Réessayez dans quelques instants ou contactez l’équipe.';
}

function setAuthenticatedState(authenticated){
  document.body.classList.toggle('member-authenticated-v83', authenticated);
  logoutBtn.hidden = !authenticated;
  bottomNav.hidden = !authenticated;
  loginPanel.hidden = authenticated;
  if (!authenticated) memberSections.forEach(section => { section.hidden = true; });
  else applyMemberView();
}

function applyMemberView(){
  memberSections.forEach(section => {
    section.hidden = !currentUser || section.dataset.memberView !== currentView;
  });
  document.querySelectorAll('[data-member-target]').forEach(button => {
    const active = button.dataset.memberTarget === currentView;
    button.classList.toggle('active', active);
    button.setAttribute('aria-current', active ? 'page' : 'false');
  });
}

function switchMemberView(view){
  if (!['home','parcours','demandes','profil'].includes(view)) return;
  currentView = view;
  history.replaceState(null, '', `#${view}`);
  applyMemberView();
  document.getElementById('member-content')?.scrollIntoView({behavior:'smooth', block:'start'});
}

function moduleList(value){
  if (Array.isArray(value)) return value.map(String).map(item => item.trim()).filter(Boolean);
  return String(value || '').split(/[,;\n]+/).map(item => item.trim()).filter(Boolean);
}

function uniq(values){ return Array.from(new Set(values.filter(Boolean))); }
function activeStepKey(){
  if (profile?.currentStep) return profile.currentStep;
  if (profile?.status === 'dossier reçu') return 'CAND';
  return profile?.journeyLevel || 'CAND';
}
function stepIndex(key){ return Math.max(0, steps.findIndex(step => step.key === key)); }

async function init(){
  setAuthenticatedState(false);
  fb = await getFirebase();

  document.querySelectorAll('[data-member-target]').forEach(button => {
    button.addEventListener('click', () => switchMemberView(button.dataset.memberTarget));
  });

  loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    const fields = new FormData(loginForm);
    const button = loginForm.querySelector('button[type="submit"]');
    button.disabled = true;
    try{
      await fb.signInWithEmailAndPassword(fb.auth, fields.get('email'), fields.get('password'));
      loginMsg.hidden = true;
    }catch(_){
      showMessage(loginMsg, 'Connexion refusée. Vérifiez votre adresse e-mail et votre mot de passe.');
    }finally{ button.disabled = false; }
  });

  logoutBtn.addEventListener('click', async () => {
    if (reservationsUnsubscribe) reservationsUnsubscribe();
    if (profileUnsubscribe) profileUnsubscribe();
    reservationsUnsubscribe = null;
    profileUnsubscribe = null;
    await fb.signOut(fb.auth);
  });

  document.getElementById('print-passport')?.addEventListener('click', async event => {
    const button = event.currentTarget;
    const initialLabel = button.textContent;
    button.disabled = true;
    button.textContent = 'Création du passeport PDF…';
    try{
      await downloadMemberPassport({
        profile,
        user: currentUser,
        steps,
        currentStep: activeStepKey(),
        levelLabel
      });
      button.textContent = 'Passeport téléchargé';
    }catch(error){
      console.error('Passport PDF:', error);
      button.textContent = 'Téléchargement impossible';
      window.alert('Le passeport n’a pas pu être créé. Rechargez la page puis réessayez.');
    }finally{
      window.setTimeout(() => {
        button.disabled = false;
        button.textContent = initialLabel;
      }, 1800);
    }
  });
  gdprForm.addEventListener('submit', sendGdprRequest);
  copyMemberCodeButton?.addEventListener('click', copyMemberCode);
  initVerificationActions();

  fb.onAuthStateChanged(fb.auth, async user => {
    if (reservationsUnsubscribe) reservationsUnsubscribe();
    if (profileUnsubscribe) profileUnsubscribe();
    reservationsUnsubscribe = null;
    profileUnsubscribe = null;
    currentUser = user;
    profile = null;
    globalStatus.hidden = true;
    setAuthenticatedState(Boolean(user));
    if (!user) return;
    renderEmailVerification(user);
    try{ await loadAll(); }
    catch(error){
      console.error('Member load:', error);
      showMessage(globalStatus, friendlyUnavailable());
    }
  });
}

function initVerificationActions(){
  resendVerificationButton?.addEventListener('click', async () => {
    if (!currentUser) return;
    resendVerificationButton.disabled = true;
    const initial = resendVerificationButton.textContent;
    resendVerificationButton.textContent = 'Envoi en cours…';
    try{
      await fb.sendEmailVerification(currentUser, {
        url: new URL('/member/dashboard.html', location.origin).href,
        handleCodeInApp: false
      });
      showMessage(verificationStatus, 'E-mail renvoyé. Vérifiez votre boîte de réception et les courriers indésirables.', true);
    }catch(error){
      const text = error?.code === 'auth/too-many-requests'
        ? 'Trop de demandes. Attendez quelques minutes avant de réessayer.'
        : 'L’e-mail n’a pas pu être renvoyé pour le moment.';
      showMessage(verificationStatus, text);
    }finally{
      resendVerificationButton.disabled = false;
      resendVerificationButton.textContent = initial;
    }
  });

  refreshVerificationButton?.addEventListener('click', async () => {
    if (!currentUser) return;
    refreshVerificationButton.disabled = true;
    try{
      await fb.reload(currentUser);
      currentUser = fb.auth.currentUser;
      renderEmailVerification(currentUser);
      if (currentUser?.emailVerified) showMessage(verificationStatus, 'Votre adresse e-mail est maintenant vérifiée.', true);
      else showMessage(verificationStatus, 'La vérification n’est pas encore confirmée. Ouvrez le lien reçu par e-mail.');
    }catch(_){ showMessage(verificationStatus, 'Vérification impossible pour le moment.'); }
    finally{ refreshVerificationButton.disabled = false; }
  });
}

function renderEmailVerification(user){
  if (!emailVerificationPanel) return;
  emailVerificationPanel.hidden = Boolean(user?.emailVerified);
}

async function loadAll(){
  watchProfile();
  loadReservations();
  renderLinkedModules([]);
}

function watchProfile(){
  const reference = fb.doc(fb.db, 'users', currentUser.uid);
  profileUnsubscribe = fb.onSnapshot(reference, snapshot => {
    applyProfileSnapshot(snapshot);
  }, error => {
    console.error('Member profile sync:', error);
    showMessage(globalStatus, error?.code === 'permission-denied' ? 'Votre dossier ne peut pas être lu avec les autorisations Firebase actuelles.' : friendlyUnavailable());
  });
}

function applyProfileSnapshot(snapshot){
  hasMemberProfile = snapshot.exists();
  profile = hasMemberProfile ? snapshot.data() : {
    displayName: currentUser.displayName || '',
    email: currentUser.email,
    memberCode: '—',
    journeyLevel: 'CAND',
    attendanceCount: 0,
    badges: ['Bienvenue PSSR']
  };
  const current = activeStepKey();
  const rawName = String(profile.displayName || currentUser.displayName || '').trim();
  const displayName = rawName && !rawName.includes('@') ? rawName : '';
  document.getElementById('welcome').textContent = displayName ? `Bienvenue — ${displayName}` : 'Bienvenue dans votre espace';
  memberProfileAlert.hidden = hasMemberProfile;
  document.getElementById('level').textContent = current;
  document.getElementById('attendance-count').textContent = profile.attendanceCount || 0;
  document.getElementById('member-code').textContent = profile.memberCode || '—';
  copyMemberCodeButton.hidden = !profile.memberCode || profile.memberCode === '—';
  document.getElementById('pass-name').textContent = displayName || 'À compléter';
  document.getElementById('pass-code').textContent = profile.memberCode || '—';
  document.getElementById('pass-level').textContent = levelLabel(current) || current;
  document.getElementById('pass-att').textContent = profile.attendanceCount || 0;
  document.getElementById('badges').innerHTML = (profile.badges || ['Bienvenue PSSR']).map(badge => `<span class="badge">${esc(badge)}</span>`).join('');
  renderParticipant();
  renderJourney();
  renderLinkedModules([]);
}

async function copyMemberCode(){
  const code = profile?.memberCode || '';
  if (!code) return;
  try{
    await navigator.clipboard.writeText(code);
    copyMemberCodeButton.textContent = 'Code copié';
    window.setTimeout(() => { copyMemberCodeButton.textContent = 'Copier'; }, 1500);
  }catch(_){ window.prompt('Copiez votre code membre :', code); }
}

function renderParticipant(){
  const rows = [
    ['Nom', profile.displayName && !String(profile.displayName).includes('@') ? profile.displayName : 'À compléter'],
    ['E-mail', profile.email || currentUser.email || '—'],
    ['Téléphone', profile.phone || 'À compléter'],
    ['Référent·e social·e', profile.referent || profile.socialReferent || 'À compléter'],
    ['Session', profile.session || 'À confirmer'],
    ['Statut', profile.status || 'Inscrit'],
    ['Modules souhaités', moduleList(profile.modules).join(', ') || '—']
  ];
  document.getElementById('participant-kv').innerHTML = rows.map(([label, value]) => `<div><strong>${esc(label)}</strong></div><div>${esc(value)}</div>`).join('');
}

function renderJourney(){
  const current = activeStepKey();
  const activeIndex = stepIndex(current);
  const stepWrap = document.getElementById('journey-steps');
  const panels = document.getElementById('journey-panels');
  stepWrap.innerHTML = steps.map((step, index) => `<li><button class="pssr-step" type="button" role="tab" aria-selected="${index === activeIndex}" data-step="${esc(step.key)}" data-active="${index === activeIndex}"><strong>${esc(step.short)}</strong><span>${esc(step.key)}</span></button></li>`).join('');
  panels.innerHTML = steps.map((step, index) => `<article class="pssr-panel ${index === activeIndex ? 'active' : ''}" id="pssr-panel-${esc(step.key)}" role="tabpanel"><p class="eyebrow">${esc(step.key)}</p><h3>${esc(step.title)}</h3><p>${esc(step.desc)}</p><div class="tag-row"><span>Prévue : ${esc(profile?.journeyDates?.[step.key]?.planned || '—')}</span><span>Réalisée : ${esc(profile?.journeyDates?.[step.key]?.done || '—')}</span></div></article>`).join('');
  stepWrap.querySelectorAll('.pssr-step').forEach(tile => {
    tile.addEventListener('click', () => {
      const key = tile.dataset.step;
      stepWrap.querySelectorAll('.pssr-step').forEach(item => { item.dataset.active = 'false'; item.setAttribute('aria-selected', 'false'); });
      tile.dataset.active = 'true';
      tile.setAttribute('aria-selected', 'true');
      panels.querySelectorAll('.pssr-panel').forEach(panel => panel.classList.remove('active'));
      document.getElementById(`pssr-panel-${key}`)?.classList.add('active');
    });
  });
}

function loadReservations(){
  reservationList.innerHTML = '<p>Chargement de vos demandes…</p>';
  try{
    const query = fb.query(
      fb.collection(fb.db, 'reservations'),
      fb.where('uid', '==', currentUser.uid),
      fb.orderBy('createdAt', 'desc')
    );
    reservationsUnsubscribe = fb.onSnapshot(query, snapshot => {
      const rows = snapshot.docs.map(doc => ({id:doc.id, ...doc.data()}));
      reservationList.innerHTML = rows.length ? rows.map(row => `<article class="record"><h3>${esc(row.creneau || row.modules || row.slotTitle || 'Demande PSSR')}</h3><dl><dt>Numéro de réservation</dt><dd><code>${esc(row.reservationCode || '—')}</code></dd><dt>Statut</dt><dd><span class="status-pill">${esc(row.status || 'en attente')}</span></dd><dt>Date</dt><dd>${esc(fmtDate(row.createdAt))}</dd><dt>Modules</dt><dd>${esc(row.modules || row.creneau || '—')}</dd>${row.message ? `<dt>Message</dt><dd>${esc(row.message)}</dd>` : ''}</dl></article>`).join('') : '<p>Aucune réservation disponible pour le moment.</p>';
      renderLinkedModules(rows);
    }, error => {
      console.error('Member reservations:', error);
      reservationList.innerHTML = `<p class="msg">${esc(friendlyUnavailable())}</p>`;
      renderLinkedModules([]);
    });
  }catch(error){
    console.error('Member reservations query:', error);
    reservationList.innerHTML = `<p class="msg">${esc(friendlyUnavailable())}</p>`;
    renderLinkedModules([]);
  }
}

function renderLinkedModules(reservations = []){
  const fromProfile = moduleList(profile?.modules);
  const fromReservations = reservations.flatMap(row => moduleList(row.modules || row.creneau || row.slotTitle));
  const modules = uniq([...fromProfile, ...fromReservations]);
  if (!modules.length){
    slotList.innerHTML = '<article class="slot-card"><h3>Aucun module lié pour le moment</h3><p>Vos modules apparaîtront ici après une inscription ou une réservation.</p><a class="btn small" href="../reservation.html">Faire une demande</a></article>';
    return;
  }
  slotList.innerHTML = modules.map(module => {
    const params = new URLSearchParams({modules:module});
    return `<article class="slot-card"><h3>${esc(module)}</h3><p>Lié à votre parcours PSSR. L’équipe confirme les disponibilités et les modalités.</p><a class="btn small" href="../reservation.html?${params.toString()}">Demander ou modifier</a></article>`;
  }).join('');
}

async function sendGdprRequest(event){
  event.preventDefault();
  try{
    const fields = new FormData(gdprForm);
    const requestType = String(fields.get('requestType') || 'gdpr_deletion_request');
    const allowedTypes = ['gdpr_deletion_request','gdpr_access_request','gdpr_rectification_request'];
    const type = allowedTypes.includes(requestType) ? requestType : 'gdpr_deletion_request';
    const consentCode = makeCode('PSSR-DOC');
    await fb.addDoc(fb.collection(fb.db, 'consents'), {
      uid: currentUser.uid,
      consentCode,
      trackingCode: consentCode,
      email: profile.email || currentUser.email || '',
      displayName: profile.displayName || '',
      type,
      reason: String(fields.get('reason') || '').slice(0, 1500),
      status: 'reçu',
      createdAt: fb.serverTimestamp()
    });
    gdprForm.reset();
    showMessage(gdprMsg, `Votre demande a bien été transmise. Numéro de suivi : ${consentCode}.`, true);
  }catch(error){
    console.error('GDPR request:', error);
    showMessage(gdprMsg, 'Votre demande ne peut pas être envoyée pour le moment. Réessayez plus tard.');
  }
}

init().catch(error => {
  console.error('Member init:', error);
  showMessage(loginMsg, 'L’espace membre est momentanément indisponible. Réessayez dans quelques instants.');
});
