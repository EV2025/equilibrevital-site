# Structure attendue dans GitHub

Après l'upload, GitHub doit montrer au minimum :

```text
.nojekyll
.gitignore
index.html
reservation.html
merci.html
admin/
  index.html
assets/
  css/
    site-overrides.css
    wordpress-extracts/
  img/
    media-manquante.svg
  js/
    firebase-config.js
    firebase-contact.js
    admin.js
    media-fallback.js
data/
  pages-extracted.json
  media-manifest.json
wp-content/
  uploads/
    README_A_PLACER_ICI.txt
original-wordpress-export/
  pssr.WordPress.2026-06-14.xml
firestore.rules
storage.rules
firebase.json
FIREBASE_SETUP.md
README_DEPLOIEMENT.md
```

Si GitHub ne montre pas les dossiers `admin`, `assets`, `data`, `wp-content`, l'upload est incomplet.
