# V56 — stabilité SEO + sécurité Firebase

## Décisions appliquées

- `activites.html` est la page officielle des activités.
- `calendrier.html` devient une redirection vers `activites.html` avec `noindex,follow`.
- Les passeports PSSR sont modifiables uniquement par coach/admin.
- Les membres peuvent seulement modifier leurs informations personnelles simples : téléphone, adresse, contact d’urgence et préférences.
- Les caches/exports WordPress inutiles sont retirés du dépôt.
- Les feuilles CSS historiques sont consolidées dans `assets/css/common-v58.min.css` et les pages ne chargent plus qu’un CSS principal.

## SEO

- Correction des canonical et Open Graph des pages principales.
- Correction de `activites.html` : OG title/url/description et fil d’Ariane.
- Recréation du `sitemap.xml` sans `calendrier.html`, sans pages privées, et avec `activites.html`.
- Ajout `noindex,follow` aux pages techniques ou non destinées au référencement : `dashboard.html`, `merci.html`, `mot-de-passe-oublie.html`, `roadmap.html`.

## Firebase

### Firestore

- Validation stricte des formulaires publics `messages`, `reservations`, `avis`.
- `emailLogs` réservé à l’équipe : les écritures publiques sont bloquées.
- `consents` réservé aux membres connectés pour leurs demandes RGPD.
- `users/{uid}` :
  - création membre encadrée ;
  - lecture propriétaire ou équipe ;
  - mise à jour membre limitée aux infos personnelles ;
  - mise à jour coach limitée au suivi ;
  - suppression admin uniquement.
- `passports/{uid}` : lecture membre/équipe, écriture coach/admin uniquement.

### Storage

- Lecture publique seulement dans `/public`.
- Écriture `/public` et `/passports/{uid}` réservée à coach/admin.
- Fichiers limités aux images/PDF de moins de 10 Mo.
- Tout le reste est refusé par défaut.

## Points à tester après déploiement

1. Envoyer un message public depuis un formulaire partenaire.
2. Créer une réservation publique.
3. Créer un compte membre.
4. Vérifier que le compte membre ne crée plus lui-même de passeport.
5. Se connecter coach/admin et valider une présence.
6. Vérifier que le passeport se met à jour depuis l’espace coach.
7. Vérifier que `calendrier.html` redirige vers `activites.html`.
8. Vérifier que toutes les pages chargent bien `assets/css/common-v58.min.css`.
