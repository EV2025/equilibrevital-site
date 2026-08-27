# Notifications automatiques des réservations

La fonction `notifyNewReservation` se déclenche lorsqu’une réservation est créée dans Firestore.

Elle envoie :

1. une notification courte à l’adresse administrative ;
2. une confirmation au participant avec son code de réservation ;
3. un état de livraison dans la réservation et dans `emailLogs`.

Les coordonnées complètes et les données de paiement restent dans le tableau de bord sécurisé.

## Configuration requise

1. Créer ou ouvrir le compte Brevo.
2. Vérifier le domaine ou l’adresse utilisée comme expéditeur.
3. Activer le plan Firebase Blaze, nécessaire au déploiement des Cloud Functions.
4. Installer Firebase CLI et sélectionner le projet `pssr-site-web`.
5. Copier `functions/.env.example` vers `functions/.env.pssr-site-web` et remplacer les valeurs d’exemple.
6. Enregistrer la clé sans la placer dans GitHub :

   `firebase functions:secrets:set BREVO_API_KEY`

7. Installer les dépendances et lancer les tests :

   `npm --prefix functions install`

   `npm --prefix functions test`

8. Déployer uniquement la fonction :

   `firebase deploy --only functions:notifyNewReservation`

## Test fonctionnel

1. Effectuer une réservation avec une adresse e-mail de test.
2. Vérifier le document créé dans `reservations`.
3. Contrôler `notificationStatus`.
4. Vérifier l’e-mail administratif et la confirmation du participant.
5. Contrôler le journal correspondant dans `emailLogs`.

Ne jamais placer la clé Brevo dans un fichier HTML, JavaScript public, `.env.example` ou GitHub.
