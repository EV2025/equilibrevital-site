# V58 — Formulaire de contact configuré avec Firestore

## Ce qui change

- Le formulaire de contact de la page d’accueil (`index.html#contact`) n’ouvre plus l’application email par défaut.
- Il enregistre maintenant la demande dans Firestore, collection `messages`.
- Après l’envoi, la personne reçoit un accusé de réception affiché à l’écran avec un numéro de suivi au format :

```text
PSSR-MSG-YYYYMMDD-XXXX
```

## Champs enregistrés dans Firestore

```text
nom
email
telephone
type
message
rgpdConsent
messageCode
trackingCode
status: reçu
createdAt
source
pageTitle
userAgent
```

## Fichiers modifiés

```text
index.html
assets/js/firebase-contact.js
assets/css/common-v58.min.css
```

## À publier

Si les règles V58 sont déjà publiées, il suffit de publier le site :

```bash
git add .
git commit -m "V58 contact Firestore"
git push
```

Si tu n’as pas encore publié les règles V58 :

```bash
firebase deploy --only firestore:rules
```

## Test conseillé

1. Aller sur la page d’accueil.
2. Descendre à la section Contact.
3. Envoyer une demande test.
4. Vérifier l’apparition d’un numéro `PSSR-MSG-...` à l’écran.
5. Vérifier dans Firebase Console > Firestore > `messages` que le message est bien enregistré.
