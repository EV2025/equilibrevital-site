# Équilibre Vital / PSSR — site officiel

La V7 conserve le site existant et améliore l’organisation visuelle : menu court, calendrier compact, inscription simplifiée, footer complet, tableau de bord membre/admin.

# PSSR — Équilibre Vital asbl

Site GitHub Pages + Firebase pour le Parcours Socio-Sportif Renforcé.

## Version actuelle

- Site institutionnel PSSR.
- Formulaire contact → Firestore `messages`.
- Réservations → Firestore `reservations`.
- Tableau de bord admin → `/admin/`.
- Phase 2A : inscription membre, espace membre, espace coach, créneaux, présences, passeport numérique imprimable.

## URLs

- Site : https://equilibrevital.be/
- Inscription : https://equilibrevital.be/inscription.html
- Espace membre : https://equilibrevital.be/member/dashboard.html
- Espace coach : https://equilibrevital.be/coach/
- Admin : https://equilibrevital.be/admin/

## Déploiement

Décompresser le ZIP, copier le contenu à la racine du dépôt local `equilibrevital-site`, puis GitHub Desktop : `Commit to main` → `Push origin`.

Après push, publier les règles Firestore du fichier `firestore.rules`.


## V3 professionnelle

Voir `AMELIORATION_PRO_V3_A_LIRE.md` pour le détail des améliorations front-office, back-office, SEO, RGPD et synchronisation Firebase.
