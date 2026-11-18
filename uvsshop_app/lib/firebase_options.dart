// ЗӨВХӨН ТҮР ОРЛУУЛГА. Firebase төсөл холбоход энэ файлыг дараах командаар дарж бичнэ:
//
//   dart pub global activate flutterfire_cli
//   flutterfire configure --project=<firebase-project-id> \
//     --platforms=android,ios \
//     --android-package-name=com.uvsshop.uvsshop_app --ios-bundle-id=com.uvsshop.uvsshopApp
//
// Тэр болтол push идэвхгүй (PushService алдааг барьж, апп хэвийн ажиллана).
import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform =>
      throw UnsupportedError('Firebase тохируулаагүй байна — flutterfire configure ажиллуулна уу.');
}
