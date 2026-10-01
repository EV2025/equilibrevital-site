import { firebaseConfig, firebaseEnabled } from './firebase-config.js';

const state = { catalogue: [], availability: {} };

function normalized(value){
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function programmeState(programme){
  const published = state.availability?.[programme.id] || {};
  const capacity = Number(published.capacity ?? programme.capacity ?? 0);
  const registered = Math.max(0, Number(published.registered ?? 0));
  const waiting = Math.max(0, Number(published.waiting ?? 0));
  const waitlistLimit = Math.max(0, Number(published.waitlistLimit ?? programme.waitlistLimit ?? capacity));
  const hasPublishedCounts = published.registered !== undefined || published.waiting !== undefined;
  const full = capacity > 0 && registered >= capacity;
  const waitlistFull = full && waitlistLimit > 0 && waiting >= waitlistLimit;
  return {capacity, registered, waiting, waitlistLimit, hasPublishedCounts, full, waitlistFull};
}

function availabilityText(programme, info){
  if (programme.registrationOpen === false && !programme.waitlistEnabled) {
    return programme.registrationNotice || 'Indisponible pour le moment.';
  }
  if (!info.hasPublishedCounts) {
    return info.capacity > 0
      ? `Inscriptions ouvertes · ${info.capacity} places maximum`
      : 'Inscriptions ouvertes';
  }
  if (info.waitlistFull) return `Groupe complet · liste d’attente complète (${info.waiting}/${info.waitlistLimit})`;
  if (info.full) return `Groupe complet · ${info.waiting} personne${info.waiting > 1 ? 's' : ''} en attente`;
  const remaining = Math.max(0, info.capacity - info.registered);
  return info.capacity > 0
    ? `${info.registered}/${info.capacity} inscrit${info.registered > 1 ? 's' : ''} · ${remaining} place${remaining > 1 ? 's' : ''} disponible${remaining > 1 ? 's' : ''}`
    : `${info.registered} inscription${info.registered > 1 ? 's' : ''}`;
}

function updateProgrammeCards(){
  for (const programme of state.catalogue){
    const info = programmeState(programme);
    const status = document.querySelector(`[data-programme-availability="${programme.id}"]`);
    if (status){
      status.textContent = availabilityText(programme, info);
      status.dataset.state = info.waitlistFull ? 'closed' : info.full ? 'waiting' : 'open';
    }
    const action = document.querySelector(`[data-programme-action="${programme.id}"]`);
    if (!action) continue;
    if (info.waitlistFull){
      action.textContent = 'Liste d’attente complète';
      action.removeAttribute('href');
      action.setAttribute('aria-disabled', 'true');
      action.classList.add('is-disabled-v121');
    } else if (info.full){
      action.textContent = 'Rejoindre la liste d’attente';
      action.href = `./reservation.html?programme=${encodeURIComponent(programme.id)}&mode=waitlist`;
      action.removeAttribute('aria-disabled');
      action.classList.remove('is-disabled-v121');
    }
  }
}

function selectedProgramme(form){
  const option = form.elements.creneau?.selectedOptions?.[0];
  const id = option?.dataset?.programmeId || '';
  return state.catalogue.find(item => item.id === id) || null;
}

function updateReservationForm(){
  const form = document.getElementById('reservation-form');
  if (!form) return;
  const programme = selectedProgramme(form);
  const notice = document.getElementById('reservation-availability');
  const programmeId = form.elements.programmeId;
  const registrationMode = form.elements.registrationMode;
  const submit = form.querySelector('button[type="submit"]');
  if (!programme){
    if (programmeId) programmeId.value = '';
    if (registrationMode) registrationMode.value = 'registration';
    if (notice) notice.hidden = true;
    if (submit) submit.textContent = 'Envoyer ma réservation';
    return;
  }
  const info = programmeState(programme);
  const waiting = info.full && !info.waitlistFull;
  if (programmeId) programmeId.value = programme.id;
  if (registrationMode) registrationMode.value = waiting ? 'waitlist' : 'registration';
  if (notice){
    notice.hidden = false;
    notice.textContent = availabilityText(programme, info) + (waiting ? ' Votre demande sera enregistrée dans l’ordre d’arrivée. Aucun paiement ne sera demandé avant la confirmation d’une place.' : '');
    notice.dataset.state = info.waitlistFull ? 'closed' : waiting ? 'waiting' : 'open';
  }
  if (submit){
    submit.disabled = info.waitlistFull;
    submit.textContent = info.waitlistFull ? 'Liste d’attente complète' : waiting ? 'Rejoindre la liste d’attente' : 'Envoyer ma réservation';
  }
}

function applyAvailability(){
  if (!state.catalogue.length) return;
  updateProgrammeCards();
  const form = document.getElementById('reservation-form');
  if (form && form.dataset.availabilityReady !== 'true'){
    form.dataset.availabilityReady = 'true';
    form.elements.creneau?.addEventListener('change', updateReservationForm);
  }
  updateReservationForm();
}

async function loadPublishedAvailability(){
  if (!firebaseEnabled) return;
  try{
    const [appMod, fsMod] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js')
    ]);
    const app = appMod.getApps().length ? appMod.getApp() : appMod.initializeApp(firebaseConfig);
    const db = fsMod.getFirestore(app);
    const snapshot = await fsMod.getDoc(fsMod.doc(db, 'settings', 'programmeAvailability'));
    if (snapshot.exists()) state.availability = snapshot.data().programmes || {};
  }catch(error){
    console.warn('Disponibilités publiques:', error);
  }
}

document.addEventListener('pssr:programmes-ready', event => {
  state.catalogue = event.detail?.programmes || window.__pssrProgrammes || [];
  applyAvailability();
});

await loadPublishedAvailability();
state.catalogue = window.__pssrProgrammes || state.catalogue;
applyAvailability();
