```js

rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function signedIn() {
      return request.auth != null;
    }

    function isAdmin() {
      return signedIn()
        && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }

    function isCoach() {
      return signedIn()
        && exists(/databases/$(database)/documents/coaches/$(request.auth.uid));
    }

    function isTeam() {
      return isAdmin() || isCoach();
    }

    function isOwner(userId) {
      return signedIn() && request.auth.uid == userId;
    }

    match /admins/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      allow write: if false;
    }

    match /coaches/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      allow write: if isAdmin();
    }

    match /users/{userId} {
      allow create: if isOwner(userId) && request.resource.data.role == 'member';
      allow read: if isOwner(userId) || isTeam();
      allow update: if isOwner(userId) || isAdmin();
      allow delete: if isAdmin();
    }

    match /settings/{settingId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /pages/{pageId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /services/{serviceId} {
      allow read: if true;
      allow create, update, delete: if isAdmin();
    }

    match /slots/{slotId} {
      allow read: if true;
      allow create, update, delete: if isTeam();
    }

    match /messages/{messageId} {
      allow create: if true;
      allow read, update, delete: if isTeam();
    }

    match /reservations/{reservationId} {
      allow create: if true;
      allow read: if isTeam() || (signedIn() && resource.data.uid == request.auth.uid);
      allow update, delete: if isTeam();
    }

    match /payments/{paymentId} {
      allow read, create, update, delete: if isAdmin();
    }

    match /notifications/{notificationId} {
      allow read, create, update, delete: if isTeam();
    }

    match /avis/{reviewId} {
      allow create: if true;
      allow read: if resource.data.published == true || isTeam();
      allow update, delete: if isAdmin();
    }

    match /attendances/{attendanceId} {
      allow create, update, delete: if isTeam();
      allow read: if isTeam() || (signedIn() && resource.data.uid == request.auth.uid);
    }

    match /passports/{userId} {
      allow read: if isOwner(userId) || isTeam();
      allow create, update: if isTeam() || isOwner(userId);
      allow delete: if isAdmin();
    }

    match /badges/{badgeId} {
      allow read: if signedIn();
      allow write: if isTeam();
    }

    match /emailLogs/{logId} {
      allow create: if true;
      allow read, update, delete: if isTeam();
    }

    match /consents/{consentId} {
      allow create: if true;
      allow read, update, delete: if isAdmin();
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}

```
