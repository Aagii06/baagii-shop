// Firebase төсөл: uvsshopcom (android/app/google-services.json-оос).
// iOS-ийг холбохдоо Firebase console-оос iOS апп нэмээд (bundle: com.uvsshop.uvsshopApp)
// GoogleService-Info.plist-ийн утгаар `ios`-ийг нөхнө.
import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart' show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) return android;
    throw UnsupportedError('Firebase зөвхөн Android-д тохируулагдсан байна.');
  }

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyAjJzICQBUODK93sWpvIWoqq-aswepSYjc',
    appId: '1:1088537541196:android:35032afe80bf0a241a92e9',
    messagingSenderId: '1088537541196',
    projectId: 'uvsshopcom',
    storageBucket: 'uvsshopcom.firebasestorage.app',
  );
}
