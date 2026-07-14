# Phase 1B — Réservation + virement bancaire + QR code SEPA/EPC

Cette version ajoute une première brique de paiement sans Stripe, Mollie ni frais de transaction par carte.

Le principe : le site ne prélève pas l’argent. Il prépare un virement bancaire SEPA clair, avec une référence unique et un QR code compatible EPC/SCT.

## Parcours utilisateur

1. Le visiteur remplit `reservation.html`.
2. Le montant est repris automatiquement depuis le formulaire : `priceAmount = 165`, `priceCurrency = EUR`.
3. Le site génère une référence unique : `PSSR-RES-AAAAMMJJ-XXXX`.
4. La réservation est enregistrée dans Firestore avec la référence de paiement.
5. Le site affiche :
   - le QR code SEPA/EPC ;
   - le bénéficiaire ;
   - l’IBAN ;
   - le BIC ;
   - le montant ;
   - la communication structurée côté ASBL, sous forme de référence unique.
6. Le client scanne le QR code avec son application bancaire.
7. Le client vérifie les données préremplies et valide le virement dans son app bancaire.
8. L’équipe vérifie manuellement le compte bancaire.
9. L’admin passe le statut de paiement en `payé`.

## Fichiers modifiés

- `reservation.html`
- `assets/js/firebase-contact.js`
- `assets/js/admin.js`
- `admin/index.html`
- `firestore.rules`

## Données de paiement utilisées

- Bénéficiaire : Équilibre Vital asbl
- IBAN affiché : BE17 5230 8164 9221
- IBAN QR : BE17523081649221
- BIC : TRIOBEBB
- Montant par défaut : 165 EUR
- Communication : numéro de réservation généré automatiquement

## Format QR code

Le QR code contient un payload EPC/SCT de ce type :

```text
BCD
002
1
SCT
TRIOBEBB
Équilibre Vital asbl
BE17523081649221
EUR165.00


PSSR-RES-AAAAMMJJ-XXXX
```

Les deux lignes vides avant la communication servent à laisser vides le `Purpose` et la référence structurée, afin d’utiliser la communication libre comme référence de paiement.

## Données conservées dans Firestore

Dans `reservations`, chaque réservation contient notamment :

- `reservationCode`
- `paymentReference`
- `paymentStatus`
- `paymentMethod`
- `paymentAmount`
- `paymentAmountCents`
- `paymentCurrency`
- `bankBeneficiary`
- `bankIban`
- `bankBic`
- `qrFormat`
- `epcPayload`

Un document de suivi est aussi créé dans `payments`, si les règles Firestore publiées autorisent la création publique validée.

## Test à faire

1. Publier les nouvelles règles `firestore.rules` dans Firebase.
2. Ouvrir `reservation.html`.
3. Remplir une réservation test.
4. Vérifier que l’accusé de réception affiche le QR code.
5. Vérifier les informations en clair : bénéficiaire, IBAN, BIC, montant, communication.
6. Scanner le QR code avec une application bancaire compatible.
7. Vérifier que le virement préremplit bien les données.
8. Ne pas valider le virement réel pendant le test, sauf si c’est volontaire.
9. Ouvrir l’admin.
10. Vérifier la colonne `Montant` et `Référence paiement`.
11. Cliquer sur `Gérer`, changer `Statut paiement` en `payé`, puis enregistrer le suivi.

## Important

Cette phase ne confirme pas automatiquement le paiement : la validation reste manuelle après vérification du compte bancaire.

La génération du QR code utilise une bibliothèque JavaScript chargée depuis CDN. Si elle ne se charge pas, le site garde les informations de virement en clair afin que le paiement reste possible manuellement.
