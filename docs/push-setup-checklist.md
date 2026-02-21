# Push Setup Checklist (Expo + Firebase)

## 1) One-time cloud setup

1. Firebase projesini Blaze plana al.
2. Terminalde proje klasorunde Firebase login yap:
   - `firebase login`
3. Dogru Firebase projesini sec:
   - `firebase use --add`
4. Cloud Functions API acik degilse ac:
   - Firebase Console -> Build -> Functions -> Enable

## 2) Firestore rules (merge ederek ekle)

Asagidaki mantigi mevcut rules dosyana ekle:

- Kullanici kendi `users/{uid}` dokumaninda sadece `expoPushTokens` guncelleyebilsin.
- Admin tum `notifications` dokumanlarini olusturabilsin/silebilsin.
- Musteri sadece kendine gelen bildirimleri okuyabilsin.
- Musteri sadece `readBy` alanina kendi UID'sini ekleyebilsin.

Ornek snippet:

```txt
function signedIn() { return request.auth != null; }
function isOwner(uid) { return signedIn() && request.auth.uid == uid; }
function isAdmin() {
  return signedIn()
    && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}

match /users/{uid} {
  allow read: if isOwner(uid) || isAdmin();
  allow update: if isOwner(uid)
    && request.resource.data.diff(resource.data).changedKeys().hasOnly(['expoPushTokens', 'updatedAt']);
}

match /notifications/{id} {
  allow read: if isAdmin()
    || (signedIn() && (
      resource.data.targetType == 'all'
      || (resource.data.targetType == 'users' && request.auth.uid in resource.data.targetUserIds)
    ));

  allow create, delete: if isAdmin();

  allow update: if isAdmin() || (
    signedIn()
    && request.resource.data.diff(resource.data).changedKeys().hasOnly(['readBy'])
    && request.resource.data.readBy is list
    && resource.data.readBy is list
    && request.resource.data.readBy.hasAll(resource.data.readBy)
    && (
      request.resource.data.readBy.size() == resource.data.readBy.size()
      || (
        request.resource.data.readBy.size() == resource.data.readBy.size() + 1
        && request.auth.uid in request.resource.data.readBy
      )
    )
  );
}
```

## 3) Deploy functions

1. Functions bagimliliklarini kur:
   - `cd functions`
   - `npm install`
2. Deploy:
   - `firebase deploy --only functions`

Deploy edilecek fonksiyonlar:
- `sendPushWhenNotificationCreated`
- `createOrderStatusNotification`

## 4) Expo push credential setup (required for closed-app push)

### Android (FCM)
1. Firebase Console -> Project Settings -> Service accounts.
2. "Generate new private key" ile service-account JSON indir.
3. EAS'e yukle:
   - `eas credentials`
   - Android -> FCM V1 credentials -> service account JSON sec.

### iOS (APNs)
1. Apple Developer hesabinda APNs Auth Key (.p8) olustur.
2. EAS'e yukle:
   - `eas credentials`
   - iOS -> Push Notifications -> APNs key ekle.

## 5) App build and test

1. Native degisiklikler icin yeni build al:
   - `eas build --platform android`
   - `eas build --platform ios`
2. Fiziksel telefonda test et (emulator push token uretmez).
3. Test senaryolari:
   - Admin -> "Bildirim Gonder" -> telefon kilitliyken push gelsin.
   - Admin -> Promosyon ekle -> otomatik push gelsin.
   - Satici -> durum `Hazirlaniyor`, `Yolda`, `Teslim Edildi` -> musteriye push gelsin.

