# PSSR — projet stabilisé GitHub Pages + Firebase

Cette version intègre les éléments utiles du plan global tout en gardant le site compatible avec GitHub Pages et Firebase.

## Ajouts de cette version

- Page `roadmap.html`
- Dossier `docs/` avec vision phase 2 séparée
- Créneaux sportifs officiels dans la réservation
- Planning socio-professionnel sur la page d’accueil
- Slogan officiel : “Bouge ton corps, avance dans ta vie !”
- Références de réservation PSSR

## Important

La version actuelle n’utilise pas React/FastAPI/MongoDB. Ces éléments sont conservés comme vision de phase 2 dans `docs/ROADMAP_PLATEFORME_COMPLETE.md`.

---

# Déploiement PSSR sur GitHub Pages

## Dossier prêt

Ce projet est prévu pour :

```text
https://ev2025.github.io/pssr/
```

## Recommencer proprement sur GitHub

1. Va dans le dépôt GitHub `ev2025/pssr`.
2. Supprime les anciens fichiers si tu veux repartir de zéro.
3. Décompresse le ZIP fourni.
4. Ouvre le dossier décompressé.
5. Sélectionne **tout le contenu** du dossier : fichiers + dossiers.
6. Dans GitHub : `Add file` → `Upload files`.
7. Dépose tous les éléments.
8. Clique sur `Commit changes`.

Après upload, la racine du dépôt doit contenir directement :

```text
index.html
reservation.html
merci.html
admin/
assets/
data/
wp-content/
original-wordpress-export/
firestore.rules
storage.rules
.nojekyll
```

## Pages importantes

```text
Site : https://ev2025.github.io/pssr/
Réservation : https://ev2025.github.io/pssr/reservation.html
Merci : https://ev2025.github.io/pssr/merci.html
Admin : https://ev2025.github.io/pssr/admin/
```

## Firebase

La configuration Firebase est déjà dans :

```text
assets/js/firebase-config.js
```

Projet Firebase : `pssr-site-web`

## Images WordPress

Les vraies images Hostinger/WordPress doivent être ajoutées ici :

```text
wp-content/uploads/
```

Le dossier existe déjà avec un fichier README. Remplace ou complète ce dossier avec ton vrai dossier `uploads`.

## Règles Firebase

Les règles à publier sont dans :

```text
firestore.rules
storage.rules
```

Firestore doit contenir au minimum :

```text
admins/aKDgnDd1ARXXFm2Pu7CT02HXzlJ2
settings/site
messages/test-message
reservations/test-reservation
pages/accueil
```

