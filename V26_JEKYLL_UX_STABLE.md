# V26 — Jekyll + UX stable

Cette version part de la V25 stable et améliore l’expérience sans refaire le site.

## Ajouts Jekyll

- Suppression de `.nojekyll` pour permettre le traitement Jekyll sur GitHub Pages.
- Ajout de `_config.yml` avec `url`, `baseurl`, langue, description et plugins GitHub Pages compatibles.
- Ajout de `_data/navigation.yml` et `_data/footer.yml` pour préparer une navigation maintenable.
- Ajout de `_includes/seo-basic.html` et `_layouts/default.html` pour les futures pages Jekyll.
- Ajout de `404.html` propre.

## UX / design

- Nouveau fichier `assets/css/v26-jekyll-ux.css` placé après `stable-v24.css`.
- Textes principaux mieux centrés et mieux cadrés.
- Grilles, cartes, boutons, formulaires et footer harmonisés.
- Plus d’espace entre les sections.
- Meilleure lisibilité sur mobile.
- Ajout de `assets/js/v26-ux.js` : lien d’évitement, état actif du menu, fermeture du menu mobile après clic, bouton retour haut, protection légère contre double envoi.

## Règles respectées

- Le super cercle PSSR n’est pas modifié.
- Firebase n’est pas modifié.
- Les règles Firestore ne sont pas modifiées.
- Les contenus existants ne sont pas réécrits.
- Les liens internes ont été vérifiés.
