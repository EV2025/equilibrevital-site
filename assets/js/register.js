
import { getFirebase, clean, makeCode, levelFromAttendance } from './firebase-portal.js';

const form = document.getElementById('register-form');
const msg = document.getElementById('register-msg');
function show(text, ok=false){ msg.hidden=false; msg.textContent=text; msg.style.color=ok?'#356b42':'#9b2f2f'; msg.scrollIntoView({behavior:'smooth',block:'nearest'}); }

form.addEventListener('submit', async (e)=>{
  e.preventDefault();
  if (!form.checkValidity()) { form.reportValidity(); return show('Veuillez compléter les champs obligatoires.'); }
  const fd = new FormData(form);
  const password = String(fd.get('password')||'');
  const firstName = clean(fd.get('firstName'),80);
  const lastName = clean(fd.get('lastName'),80);
  const data = {
    firstName,
    lastName,
    displayName: clean(`${firstName} ${lastName}`.trim(),120),
    email: clean(fd.get('email'),180).toLowerCase(),
    phone: clean(fd.get('phone'),60),
    birthDate: clean(fd.get('birthDate'),30),
    address: clean(fd.get('address'),240),
    modules: clean(fd.get('modules'),1000),
    role: 'member',
    memberCode: makeCode('PSSR-MBR'),
    trackingCode: '',
    status: 'dossier reçu',
    journeyLevel: levelFromAttendance(0),
    attendanceCount: 0
  };
  if (!data.firstName || !data.lastName || !/^\S+@\S+\.\S+$/.test(data.email) || password.length < 6) return show('Veuillez vérifier le prénom, le nom, l’email et le mot de passe.');
  data.trackingCode = data.memberCode;
  const btn = form.querySelector('button'); btn.disabled = true;
  try{
    const fb = await getFirebase();
    const cred = await fb.createUserWithEmailAndPassword(fb.auth, data.email, password);
    await fb.updateProfile(cred.user, { displayName: data.displayName });
    await fb.setDoc(fb.doc(fb.db, 'users', cred.user.uid), {
      ...data,
      uid: cred.user.uid,
      createdAt: fb.serverTimestamp(),
      updatedAt: fb.serverTimestamp()
    });
    // V56 : le passeport PSSR est créé ou mis à jour uniquement par l’équipe coach/admin.
    show(`Dossier membre créé. Votre numéro de dossier est ${data.memberCode}. Conservez ce numéro. Redirection vers l’espace membre…`, true);
    setTimeout(()=> location.href='./member/dashboard.html', 1200);
  }catch(err){
    console.error(err);
    show(err.code === 'auth/email-already-in-use' ? 'Un compte existe déjà avec cet email.' : 'Inscription impossible : ' + (err.message || 'erreur Firebase'));
  }finally{ btn.disabled = false; }
});
