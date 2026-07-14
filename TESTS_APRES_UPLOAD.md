# Tests après upload

## 1. Tester le site public

Ouvre :

```text
https://ev2025.github.io/pssr/
```

La page PSSR doit s'afficher.

## 2. Tester la page réservation

Ouvre :

```text
https://ev2025.github.io/pssr/reservation.html
```

Essaie d'envoyer une réservation test.

## 3. Vérifier Firestore

Dans Firebase → Firestore Database → Données, tu dois voir une nouvelle entrée dans :

```text
reservations
```

## 4. Tester l'admin

Ouvre :

```text
https://ev2025.github.io/pssr/admin/
```

Connexion :

```text
Email : equilibrevital.bruxelles@gmail.com
Mot de passe : celui créé dans Firebase Authentication
```

Si la connexion passe mais que les données ne s'affichent pas, vérifie :

- Firestore → Règles : le contenu de `firestore.rules` doit être publié.
- Firestore → admins → document `aKDgnDd1ARXXFm2Pu7CT02HXzlJ2` existe.
- Authentication → Domaines autorisés contient `ev2025.github.io`.
