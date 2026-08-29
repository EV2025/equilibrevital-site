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

for (const path of viewportPages) {
  const html = fs.readFileSync(path, 'utf8');
  if (!/<meta[^>]+name=["']viewport["']/i.test(html)) errors.push(`${path}: balise viewport absente`);
}
for (const path of protectedPages) {
  const html = fs.readFileSync(path, 'utf8');
  if (!/interface-page-v90/.test(html)) errors.push(`${path}: classe interface-page-v90 absente`);
  if (!/interface-guard-v90\.css/.test(html)) errors.push(`${path}: feuille interface-guard-v90.css absente`);
}
const admin = fs.readFileSync('admin/index.html', 'utf8');
if (!/admin-app-v90\.css/.test(admin)) errors.push('admin/index.html: feuille admin-app-v90.css absente');

for (const path of ['assets/css/interface-guard-v90.css', 'assets/css/admin-app-v90.css']) {
  if (!fs.existsSync(path) || fs.statSync(path).size < 500) errors.push(`${path}: fichier absent ou incomplet`);
}
if (errors.length) {
  console.error('Contrôle responsive en échec:\n- ' + errors.join('\n- '));
  process.exit(1);
}
console.log(`Contrôle responsive réussi : ${protectedPages.length} pages protégées.`);
