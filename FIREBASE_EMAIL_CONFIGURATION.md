# Configuration des e-mails Firebase — Équilibre Vital

Le site utilise Firebase Authentication pour les e-mails de vérification et de réinitialisation. Les mots de passe ne sont jamais enregistrés dans Firestore et ne doivent jamais être envoyés par e-mail.

## Domaines autorisés

Dans Firebase Console > Authentication > Settings > Authorized domains, conserver :

- `equilibrevital.be`
- `www.equilibrevital.be`

## E-mail de vérification

Dans Authentication > Templates > Email address verification :

- nom de l’expéditeur : `Équilibre Vital` ;
- adresse de réponse : l’adresse professionnelle du projet ;
- indiquer que le nom d’utilisateur est l’adresse e-mail du destinataire ;
- conserver le lien Firebase `%LINK%`.

Le code membre est affiché sur la page `inscription-confirmee.html` et reste accessible dans l’espace membre. Il ne s’agit pas du mot de passe.

## Réinitialisation du mot de passe

Dans Authentication > Templates > Password reset > Customize action URL, utiliser :

`https://equilibrevital.be/nouveau-mot-de-passe.html`

Firebase ajoutera automatiquement les paramètres sécurisés `mode`, `oobCode`, `apiKey`, `continueUrl` et `lang`. La page ne doit jamais être appelée avec un code fabriqué manuellement.

## Courriers indésirables

Le code du site ne peut pas garantir le classement dans la boîte principale. Pour améliorer la délivrabilité :

- utiliser un nom d’expéditeur reconnaissable ;
- utiliser une adresse de réponse professionnelle ;
- éviter les formulations promotionnelles dans les modèles d’authentification ;
- demander au destinataire de vérifier les courriers indésirables lors du premier envoi.

Un envoi SMTP personnalisé nécessite un backend sécurisé. Ne jamais placer une clé SMTP dans un fichier JavaScript public du site.
