# Équilibre Vital — Plateforme socio-sportive PSSR

**Bouge ton corps, avance dans ta vie !**

Ce document conserve la vision complète du projet sans la confondre avec la version GitHub Pages + Firebase déjà déployée.

## Version actuelle livrée

- Site institutionnel
- Formulaire de contact
- Réservations avec référence PSSR
- Back-office admin Firebase
- Export CSV
- Créneaux sportifs officiels
- Ateliers socio-professionnels affichés

## Éléments repris dans le site actuel

- Slogan principal
- Tarif solidaire : 165€ / année académique
- Lieu : Gare de l’Ouest — Centre Sportif Pythagoras · urban.brussels — Molenbeek
- Collaboration : L’école du dos
- Créneaux sportifs hebdomadaires
- Ateliers socio-professionnels
- Roadmap de phase 2

## Phase 2 — plateforme complète possible

Ces modules ne sont pas encore actifs dans la version GitHub Pages :

- Espace Membre : tableau de bord, réservations, agenda, parcours, passeport numérique
- Espace Coach : créneaux, validation des présences
- Espace Admin avancé : KPI, utilisateurs, créneaux CRUD, paramètres ASBL modifiables
- Gamification : 6 niveaux ARF → SRS et badges automatiques
- Passeport Socio-Sportif Numérique téléchargeable en PDF
- Accusés de réception email automatisés
- Espace partenaire / financeur / accompagnateur social
- Paiement en ligne
- Attestations PDF
- Export iCal et synchronisation Google Calendar / Outlook
- Multilingue NL / EN / AR

## Stack envisagé pour phase 2

Option possible si l’ASBL veut une plateforme applicative complète :

- Frontend : React, React Router, Tailwind CSS
- Backend : FastAPI
- Base de données : MongoDB ou Firebase selon arbitrage
- Auth : JWT ou Firebase Auth
- Déploiement : VPS, Railway, Render, Fly.io ou autre

## Décision actuelle

Ne pas casser le site qui fonctionne. Stabiliser d’abord la version GitHub Pages + Firebase, puis planifier la phase 2 comme un nouveau chantier technique.
