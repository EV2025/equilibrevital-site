# V57 — optimisation PageSpeed

Objectif : améliorer les alertes PageSpeed sans changer les règles Firebase ni la structure SEO validée en V56.

## Changements

- Remplacement du gros `assets/css/common-v58.min.css` par un CSS commun minifié : `assets/css/common-v58.min.css`.
- Ajout de CSS spécifiques et minifiés par zone :
  - `home-v57.min.css`
  - `activites-v57.min.css`
  - `presentation-v57.min.css`
  - `pssr-v57.min.css`
  - `dispositifs-v57.min.css`
  - `partenaires-v57.min.css`
- Chargement CSS optimisé avec `preload` + bascule en stylesheet.
- Ajout d’un petit CSS critique inline pour limiter l’affichage non stylé.
- Conservation de la redirection `calendrier.html` vers `activites.html`.
- Conservation des règles Firestore, Storage et index V56.

## À tester

1. Accueil : `index.html`
2. Activités : `activites.html`
3. Présentation : `presentation-pssr.html`
4. Cercle/PSSR : `pssr.html`
5. Partenaires/formulaires
6. Espace membre et formulaires Firebase

## Déploiement

Les règles Firebase ne changent pas. Pour GitHub Pages, publier simplement les fichiers du site :

```bash
git add .
git commit -m "V57 optimisation PageSpeed"
git push
```
