# V36 — Performance & accessibilité

Base : V33.

Actions principales :

- Unification des feuilles CSS en un seul fichier `assets/css/v36-performance-accessibilite.css`.
- Suppression des imports Google Fonts externes pour réduire les requêtes bloquantes.
- Suppression des anciens scripts de navigation concurrents.
- Injection d’un seul shell `Header + menu burger + Footer` via `assets/js/v36-performance-accessibilite.js`.
- Menu mobile avec `aria-expanded`, `aria-controls`, fermeture après clic et touche Escape.
- Footer nettoyé, plus contrasté, sans lien légal redondant.
- Images converties en WebP pour l’affichage quand possible.
- Largeur/hauteur ajoutées aux images pour réduire les décalages de mise en page.
- Titres et badges centrés.
- Mots-clés/badges autonomes liés aux pages existantes.
- Le super cercle PSSR n’a pas été modifié.

Limite importante : GitHub Pages ne permet pas de définir manuellement les headers de cache. Un bloc `headers` est ajouté à `firebase.json` pour un futur déploiement Firebase Hosting, mais sur GitHub Pages le cache dépend de GitHub.
