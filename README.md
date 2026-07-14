# PSSR — Version V7 organisation professionnelle

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

- Site : https://ev2025.github.io/pssr/
- Inscription : https://ev2025.github.io/pssr/inscription.html
- Espace membre : https://ev2025.github.io/pssr/member/dashboard.html
- Espace coach : https://ev2025.github.io/pssr/coach/
- Admin : https://ev2025.github.io/pssr/admin/

## Déploiement

Décompresser le ZIP, copier le contenu à la racine du dépôt local `pssr`, puis GitHub Desktop : `Commit to main` → `Push origin`.

Après push, publier les règles Firestore du fichier `firestore.rules`.


## V3 professionnelle

Voir `AMELIORATION_PRO_V3_A_LIRE.md` pour le détail des améliorations front-office, back-office, SEO, RGPD et synchronisation Firebase.
