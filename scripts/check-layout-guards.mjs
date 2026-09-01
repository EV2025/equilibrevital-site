import fs from 'node:fs';

const protectedPages = [
  'admin/index.html',
  'dashboard.html',
  'inscription.html',
  'reservation.html',
  'mot-de-passe-oublie.html',
  'nouveau-mot-de-passe.html',
  'remboursement-mutuelle.html',
  'formulaire-ecoles-atl.html',
  'formulaire-institutions-sociales.html',
  'formulaire-partenariats-locaux.html'
];
const viewportPages = [...protectedPages, 'merci.html', 'member/dashboard.html', 'coach/index.html'];
const errors = [];

const manifestPath = 'manifest.webmanifest';
const serviceWorkerPath = 'sw.js';
const appPagePath = 'application.html';
for (const path of [manifestPath, serviceWorkerPath, appPagePath, 'offline.html', 'assets/js/pwa-install.js', 'assets/icons/icon-192.png', 'assets/icons/icon-512.png', 'assets/icons/icon-maskable-512.png']) {
  if (!fs.existsSync(path)) errors.push(`${path}: élément PWA absent`);
}
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.start_url !== '/application.html') errors.push('manifest.webmanifest: page de démarrage incorrecte');
  if (!Array.isArray(manifest.icons) || !manifest.icons.some(icon => icon.sizes === '192x192') || !manifest.icons.some(icon => icon.sizes === '512x512')) errors.push('manifest.webmanifest: icônes installables incomplètes');
}
if (fs.existsSync(serviceWorkerPath)) {
  const serviceWorker = fs.readFileSync(serviceWorkerPath, 'utf8');
  for (const privatePath of ['/member/', '/admin/', '/coach/']) {
    if (!serviceWorker.includes(`'${privatePath}'`)) errors.push(`sw.js: ${privatePath} non protégé du cache`);
  }
}
for (const path of ['member/dashboard.html', 'coach/index.html', 'admin/index.html']) {
  const html = fs.readFileSync(path, 'utf8');
  if (!/manifest\.webmanifest/.test(html)) errors.push(`${path}: manifeste PWA absent`);
  if (!/pwa-register\.js/.test(html)) errors.push(`${path}: enregistrement PWA absent`);
}
for (const path of ['index.html', 'reservation.html', 'inscription-confirmee.html']) {
  const html = fs.readFileSync(path, 'utf8');
  if (!/manifest\.webmanifest/.test(html)) errors.push(`${path}: manifeste d’installation absent`);
  if (!/pwa-install\.js/.test(html)) errors.push(`${path}: aide à l’installation absente`);
}
if (!/data-install-app/.test(fs.readFileSync('index.html', 'utf8'))) errors.push('index.html: invitation à installer absente');
if (!/data-install-app/.test(fs.readFileSync('assets/js/pwa-receipt-promo.js', 'utf8'))) errors.push('assets/js/pwa-receipt-promo.js: invitation après réservation absente');
if (!/data-install-app/.test(fs.readFileSync('assets/js/registration-confirmation.js', 'utf8'))) errors.push('assets/js/registration-confirmation.js: invitation après inscription absente');

for (const path of viewportPages) {
  const html = fs.readFileSync(path, 'utf8');
  if (!/<meta[^>]+name=["']viewport["']/i.test(html)) errors.push(`${path}: balise viewport absente`);
}
for (const path of protectedPages) {
  const html = fs.readFileSync(path, 'utf8');
  if (!/interface-page-v90/.test(html)) errors.push(`${path}: classe interface-page-v90 absente`);
  if (!/interface-guard-v90\.css/.test(html)) errors.push(`${path}: feuille interface-guard-v90.css absente`);
}
const memberHtml = fs.readFileSync('member/dashboard.html', 'utf8');
const memberCss = fs.readFileSync('assets/css/member-app-v83.css', 'utf8');
const memberJs = fs.readFileSync('assets/js/member.js', 'utf8');
const passportPdf = 'assets/js/member-passport-pdf.js';
if (!/member-app-v83\.css/.test(memberHtml)) errors.push('member/dashboard.html: feuille membre absente');
if (!/Télécharger mon passeport PDF/.test(memberHtml)) errors.push('member/dashboard.html: action PDF du passeport absente');
if (!/downloadMemberPassport/.test(memberJs)) errors.push('assets/js/member.js: téléchargement du passeport non relié');
if (!fs.existsSync(passportPdf) || fs.statSync(passportPdf).size < 5000) errors.push('assets/js/member-passport-pdf.js: générateur PDF absent ou incomplet');
if (!/#reservation-list \.record/.test(memberCss)) errors.push('assets/css/member-app-v83.css: protection des demandes absente');
if (!/#slot-list \.slot-card/.test(memberCss)) errors.push('assets/css/member-app-v83.css: protection des modules absente');
if (!/#journey-panel/.test(memberCss) || !/#journey-steps/.test(memberCss)) errors.push('assets/css/member-app-v83.css: protection du parcours absente');
if (!/#participant-kv/.test(memberCss) || !/#passport/.test(memberCss) || !/#gdpr-form/.test(memberCss)) errors.push('assets/css/member-app-v83.css: protection du profil personnel absente');

const admin = fs.readFileSync('admin/index.html', 'utf8');
if (!/admin-app-v90\.css/.test(admin)) errors.push('admin/index.html: feuille admin-app-v90.css absente');

for (const path of ['assets/css/interface-guard-v90.css', 'assets/css/admin-app-v90.css']) {
  if (!fs.existsSync(path) || fs.statSync(path).size < 500) errors.push(`${path}: fichier absent ou incomplet`);
}
const programmeData = JSON.parse(fs.readFileSync('assets/data/programmes-v84.json', 'utf8'));
const programmeNames = Object.fromEntries(programmeData.programmes.map(item => [item.id, item.name]));
const expectedProgrammeNames = {
  'ados-mardi':'Cardio Fit Ados',
  'enfants-vendredi':'Kids Move Training Jeunes (multisport)',
  'adultes-vendredi':'Fitness & Boxing Loisir',
  'femmes-samedi':'Mobility & Recovery'
};
for (const [id, name] of Object.entries(expectedProgrammeNames)) {
  if (programmeNames[id] !== name) errors.push(`assets/data/programmes-v84.json: intitulé incorrect pour ${id}`);
}
const programmeJs = fs.readFileSync('assets/js/programmes-v84.js', 'utf8');
if (!/programme-schedule-v94/.test(programmeJs) || !/programme-audience-v84/.test(programmeJs) || !/programme-time-v94/.test(programmeJs)) {
  errors.push('assets/js/programmes-v84.js: hiérarchie uniforme des programmes absente');
}
if (/programme-label-v94/.test(programmeJs)) errors.push('assets/js/programmes-v84.js: ancien libellé Programme encore présent');

if (errors.length) {
  console.error('Contrôle responsive en échec:\n- ' + errors.join('\n- '));
  process.exit(1);
}
console.log(`Contrôle responsive réussi : ${protectedPages.length} pages protégées.`);
