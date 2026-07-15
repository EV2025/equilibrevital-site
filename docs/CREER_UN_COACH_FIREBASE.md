# Créer un coach dans Firebase

1. Aller dans Firebase → Authentication → Utilisateurs.
2. Créer un utilisateur coach avec email + mot de passe.
3. Copier son UID.
4. Aller dans Firestore → Données.
5. Créer la collection `coaches` si elle n’existe pas.
6. Document ID = UID du coach.
7. Champs recommandés :

```text
email       Chaîne   coach@equilibrevital.be
displayName Chaîne   Coach PSSR
role        Chaîne   coach
active      Booléen  Vrai
createdAt   Chaîne   2026-06-14
```

L’espace coach est ici :

```text
https://ev2025.github.io/pssr/coach/
```
