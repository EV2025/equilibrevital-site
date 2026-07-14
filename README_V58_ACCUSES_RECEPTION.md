# V58 — Accusés de réception gratuits

Objectif : donner à chaque personne une preuve immédiate que sa demande est bien enregistrée, sans email automatique et sans passer au plan Blaze.

## Ce qui est ajouté

- Numéro de réservation : `PSSR-RES-YYYYMMDD-XXXX`
- Numéro de suivi message / partenariat : `PSSR-MSG-YYYYMMDD-XXXX`
- Numéro de dossier membre : `PSSR-MBR-YYYYMMDD-XXXX`
- Numéro document / RGPD : `PSSR-DOC-YYYYMMDD-XXXX`
- Statut initial : `reçu` ou `dossier reçu`
- Carte d’accusé de réception affichée immédiatement après envoi du formulaire
- Références enregistrées dans Firestore via `trackingCode`
- Back-office admin/coach mis à jour pour afficher les références

## Ce qui n’est pas ajouté volontairement

- Pas d’email automatique
- Pas de Cloud Function
- Pas d’extension Firebase payante ou nécessitant Blaze

## À publier

Les règles Firestore doivent être redéployées car les formats de référence ont changé.

```bash
firebase deploy --only firestore:rules
```

Si tu veux tout republier ensemble :

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```

## Tests à faire

1. Envoyer une réservation depuis `reservation.html`
2. Vérifier l’affichage du numéro `PSSR-RES-...`
3. Vérifier dans Firestore `reservations.trackingCode`
4. Envoyer une demande partenaire/contact
5. Vérifier l’affichage du numéro `PSSR-MSG-...`
6. Créer un compte membre
7. Vérifier le numéro `PSSR-MBR-...`
8. Envoyer une demande RGPD depuis l’espace membre
9. Vérifier le numéro `PSSR-DOC-...`
