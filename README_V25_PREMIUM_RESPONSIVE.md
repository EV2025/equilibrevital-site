# V25 — Premium responsive stable

Cette version part de la V24 stable et corrige l'organisation visuelle sans ajouter une nouvelle pile de CSS conflictuelle.

## Objectif

- Site plus expansif sur ordinateur.
- Pages mieux séparées par thème sur téléphone.
- Accueil plus clair avec accès rapides par thème.
- Design plus cadré, respirant et cohérent.
- Cartes, boutons, espacements, formulaires et footer harmonisés.

## Changements principaux

- `assets/css/stable-v24.css` devient la base visuelle premium V25.
- Ajout d'une section “Aller à l’essentiel” sur l'accueil.
- Ajout d'une page `documents.html` pour éviter de surcharger l'accueil sur mobile.
- Les liens “Documents” pointent maintenant vers `documents.html`.
- Aucun changement Firebase ou Firestore.
- Le super cercle PSSR n'a pas été modifié.

## Tests recommandés

- `index.html`
- `documents.html`
- `dispositifs.html`
- `reservation.html`
- `inscription.html`
- `dashboard.html`
- `member/dashboard.html`
- `admin/index.html`

