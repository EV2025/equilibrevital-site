# Équilibre Vital — application Android

Application Android officielle basée sur une Trusted Web Activity et reliée à `https://equilibrevital.be`.

## Identité technique

- Application ID : `be.equilibrevital.pssr`
- Version : `1.0.0` (`versionCode 1`)
- Android minimum : API 23
- Cible Google Play : Android 16 / API 36
- URL de démarrage : `https://equilibrevital.be/application.html`

## Construction

La Pull Request et les changements de ce dossier déclenchent le workflow GitHub `Android app`. Le fichier AAB non signé est conservé comme artefact de test.

La version Play Store devra être signée avec une clé d’import distincte, conservée uniquement dans les secrets GitHub ou dans Play Console. Ne jamais ajouter une clé ou son mot de passe au dépôt.

## Étape obligatoire avant la publication

Après création de l’application dans Play Console et activation de Play App Signing :

1. récupérer l’empreinte SHA-256 du certificat de signature d’application ;
2. remplacer `SHA256_CERT_FINGERPRINT` dans `assetlinks.template.json` ;
3. publier le résultat à la racine du site sous `.well-known/assetlinks.json` ;
4. vérifier `https://equilibrevital.be/.well-known/assetlinks.json` ;
5. construire et envoyer l’AAB signé.
