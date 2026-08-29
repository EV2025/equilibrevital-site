import { getFirebase, clean, makeCode, levelFromAttendance } from './firebase-portal.js';

const form = document.getElementById('register-form');
const msg = document.getElementById('register-msg');

function show(text, ok = false){
  msg.hidden = false;
  msg.textContent = text;
  msg.style.color = ok ? '#356b42' : '#9b2f2f';
  msg.scrollIntoView({behavior:'smooth', block:'nearest'});
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!form.checkValidity()){
    form.reportValidity();
    return show('Veuillez compléter les champs obligatoires.');
  }

  const fields = new FormData(form);
  const password = String(fields.get('password') || '');
  const passwordConfirm = String(fields.get('passwordConfirm') || '');
  const firstName = clean(fields.get('firstName'), 80);
  const lastName = clean(fields.get('lastName'), 80);
  const data = {
    firstName,
    lastName,
    displayName: clean(`${firstName} ${lastName}`.trim(), 120),
    email: clean(fields.get('email'), 180).toLowerCase(),
    phone: clean(fields.get('phone'), 60),
    birthDate: clean(fields.get('birthDate'), 30),
    address: clean(fields.get('address'), 240),
    modules: clean(fields.get('modules'), 1000),
    role: 'member',
    memberCode: makeCode('PSSR-MBR'),
    trackingCode: '',
    status: 'dossier reçu',
    journeyLevel: levelFromAttendance(0),
    attendanceCount: 0
  };

  if (!data.firstName || !data.lastName || !/^\S+@\S+\.\S+$/.test(data.email)){
    return show('Veuillez vérifier le prénom, le nom et l’adresse e-mail.');
  }
  if (password.length < 8) return show('Choisissez un mot de passe d’au moins 8 caractères.');
  if (password !== passwordConfirm) return show('Les deux mots de passe ne correspondent pas.');

  data.trackingCode = data.memberCode;
  const button = form.querySelector('button[type="submit"]');
  const initialLabel = button.textContent;
  button.disabled = true;
  button.textContent = 'Création du compte…';

  try{
    const fb = await getFirebase();
    const credential = await fb.createUserWithEmailAndPassword(fb.auth, data.email, password);
    await fb.updateProfile(credential.user, {displayName: data.displayName});
    await fb.setDoc(fb.doc(fb.db, 'users', credential.user.uid), {
      ...data,
      uid: credential.user.uid,
      createdAt: fb.serverTimestamp(),
      updatedAt: fb.serverTimestamp()
    });

    let verificationSent = true;
    try{
      await fb.sendEmailVerification(credential.user, {
        url: new URL('/member/dashboard.html', location.origin).href,
        handleCodeInApp: false
      });
    }catch(error){
      verificationSent = false;
      console.warn('Email verification:', error?.code || error?.message || error);
    }

    sessionStorage.setItem('pssrRegistrationReceiptV82', JSON.stringify({
      verificationSent,
      createdAt: new Date().toISOString()
    }));

    show(`Compte créé. Votre nom d’utilisateur est ${data.email} et votre code membre est ${data.memberCode}.`, true);
    setTimeout(() => { location.href = './inscription-confirmee.html'; }, 1600);
  }catch(error){
    console.error(error);
    const messages = {
      'auth/email-already-in-use': 'Un compte existe déjà avec cette adresse e-mail.',
      'auth/weak-password': 'Le mot de passe choisi n’est pas assez sécurisé.',
      'auth/network-request-failed': 'La connexion a échoué. Vérifiez votre accès internet et réessayez.'
    };
    show(messages[error?.code] || `Inscription impossible : ${error?.message || 'erreur Firebase'}`);
  }finally{
    button.disabled = false;
    button.textContent = initialLabel;
  }
});
