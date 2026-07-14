# Configuration Firebase pour PSSR

URL GitHub Pages prévue : `https://ev2025.github.io/pssr/`

## 1. Créer le projet Firebase

1. Ouvrez Firebase Console.
2. Créez un projet, par exemple `pssr` ou `pssr-2026`.
3. Dans le projet, ajoutez une application Web avec le nom `PSSR GitHub Pages`.
4. Copiez la configuration Web Firebase.

## 2. Coller la configuration dans le site

Ouvrez :

```text
assets/js/firebase-config.js
```

Remplacez les valeurs :

```js
apiKey: "<COLLER_API_KEY>",
authDomain: "<COLLER_PROJECT_ID>.firebaseapp.com",
projectId: "<COLLER_PROJECT_ID>",
storageBucket: "<COLLER_PROJECT_ID>.appspot.com",
messagingSenderId: "<COLLER_MESSAGING_SENDER_ID>",
appId: "<COLLER_APP_ID>"
```

La clé `apiKey` Firebase Web n'est pas un mot de passe : la vraie sécurité vient surtout des règles Firestore/Storage.

## 3. Activer Authentication

Dans Firebase :

```text
Build > Authentication > Sign-in method
```

Activez :

```text
Email/Password
```

Puis dans :

```text
Authentication > Settings > Authorized domains
```

Ajoutez :

```text
ev2025.github.io
```

Ajoutez aussi `localhost` seulement si vous voulez tester sur votre ordinateur.

## 4. Créer l'utilisateur administrateur

Dans Firebase :

```text
Authentication > Users > Add user
```

Créez votre email admin avec un mot de passe fort.

Copiez ensuite son `User UID`.

## 5. Activer Firestore

Dans Firebase :

```text
Build > Firestore Database > Create database
```

Choisissez le mode production.

Créez ensuite la collection :

```text
admins
```

Créez un document dont l'ID est exactement le `User UID` de l'admin.

Ajoutez par exemple ces champs :

```text
email: votre-email@example.com
role: admin
createdAt: 2026-06-14
```

## 6. Installer les règles Firestore

Dans :

```text
Firestore Database > Rules
```

Collez le contenu du fichier :

```text
firestore.rules
```

Puis cliquez sur `Publish`.

Ces règles autorisent le public à envoyer un message/réservation, mais seuls les admins déclarés dans `admins/{uid}` peuvent lire les demandes.

## 7. Activer Storage, optionnel

Pour les images gérées plus tard via Firebase Storage :

```text
Build > Storage
```

Collez le contenu du fichier :

```text
storage.rules
```

Puis publiez les règles.

Les règles actuelles autorisent la lecture publique des fichiers dans `public/`, mais l'écriture uniquement aux admins.

## 8. Tester sur GitHub Pages

Après avoir poussé le dossier sur GitHub :

1. Ouvrez `https://ev2025.github.io/pssr/`.
2. Envoyez un message via le formulaire de contact.
3. Vérifiez dans Firestore que le document apparaît dans `messages`.
4. Ouvrez `https://ev2025.github.io/pssr/admin/`.
5. Connectez-vous avec l'email admin.
6. Vérifiez que les messages et réservations apparaissent.

## 9. Collections utilisées

```text
messages       demandes du formulaire de contact
reservations   demandes de réservation
pages          contenu WordPress importé depuis data/pages-extracted.json
admins         liste des administrateurs autorisés
```

## 10. Importer le contenu WordPress dans Firestore

Dans le tableau de bord admin :

```text
https://ev2025.github.io/pssr/admin/
```

Cliquez sur :

```text
Importer le contenu WordPress
```

Cela importe `data/pages-extracted.json` dans la collection `pages`.
