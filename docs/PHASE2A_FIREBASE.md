# Phase 2A — Extension Firebase compatible GitHub Pages

Cette version ajoute une phase 2 réaliste sans casser le site déjà en ligne.

## Ajouts fonctionnels

- `inscription.html` : inscription intelligente en 5 étapes simplifiées.
- `member/dashboard.html` : espace membre avec réservations, niveau PSSR et passeport imprimable.
- `coach/index.html` : espace coach pour suivre les réservations et valider des présences.
- `admin/index.html` enrichi : collections messages, réservations, pages, membres, créneaux, présences et logs emails.
- `data/slots-seed.json` : créneaux officiels sport + accompagnement socio-professionnel.
- `data/journey-levels.json` : niveaux ARF → SRS.

## Important

Cette phase utilise Firebase Authentication + Firestore. Elle ne nécessite pas encore FastAPI, MongoDB ou React.

## À faire après upload

1. Pousser tout le dossier sur GitHub.
2. Remplacer les règles Firestore par `firestore.rules`.
3. Dans le dashboard admin, cliquer sur `Importer les créneaux officiels`.
4. Créer au besoin un coach dans Firebase Authentication puis ajouter un document `coaches/{UID}`.
5. Tester inscription membre, réservation membre, espace coach.

## Emails

Les accusés de réception automatiques nécessitent un vrai service d’envoi email. Pour l’instant, la collection `emailLogs` garde une trace `to_send` pour préparer cette étape.
