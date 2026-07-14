# V66 — Correction déploiement GitHub Pages

Correction ajoutée : `.github/workflows/pages.yml`

Objectif : éviter l'erreur GitHub Pages :

```txt
Deployment request failed ... due to in progress deployment
```

La correction ajoute une règle `concurrency` :

```yaml
concurrency:
  group: "pages"
  cancel-in-progress: false
```

Cela empêche deux déploiements Pages de se lancer en même temps. Si un déploiement est déjà en cours, le suivant attend au lieu d'échouer.

## Important

Si GitHub contient déjà un ancien workflow Pages dans `.github/workflows/`, il faut le remplacer par ce fichier ou supprimer l'ancien doublon. Il ne faut garder qu'un seul workflow de déploiement Pages.
