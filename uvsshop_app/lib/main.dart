import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'config.dart';
import 'i18n.dart';
import 'push/push_service.dart';
import 'state/admin_state.dart';
import 'state/app_state.dart';
import 'state/shop_nav.dart';
import 'state/shop_state.dart';
import 'ui/admin/admin_design.dart';
import 'ui/admin/admin_shell.dart';
import 'ui/common.dart';
import 'ui/shop/shop_shell.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  final shop = ShopState();
  final admin = AdminState();
  final app = AppState(shop, admin)..init();
  // Firebase тохируулаагүй бол юу ч хийхгүй (lib/firebase_options.dart).
  PushService.init(app, navigatorKey);
  runApp(MultiProvider(
    providers: [
      ChangeNotifierProvider.value(value: shop),
      ChangeNotifierProvider.value(value: admin),
      ChangeNotifierProvider.value(value: app),
      ChangeNotifierProvider(create: (_) => ShopNav()),
    ],
    child: const UvsShopApp(),
  ));
}

/// Push мэдэгдэл дээр дарахад хуудас нээхэд.
final navigatorKey = GlobalKey<NavigatorState>();

class UvsShopApp extends StatelessWidget {
  const UvsShopApp({super.key});

  @override
  Widget build(BuildContext context) {
    final mode = context.select<AppState, AppMode>((a) => a.mode);
    return ListenableBuilder(
      listenable: appLang,
      builder: (context, _) => MaterialApp(
      title: AppConfig.appName,
      navigatorKey: navigatorKey,
      debugShowCheckedModeBanner: false,
      // Дэлгүүр ↔ админ шилжихэд theme-ийг шууд солино. Хөдөлгөөнтэй шилжвэл хоёр
      // theme-ийн TextStyle-уудыг холих гэж "different inherit values" алдаа шиддэг.
      themeAnimationDuration: Duration.zero,
      // Админ хэсэг вэбийн админы загвартай (admin_design.dart).
      theme: mode == AppMode.admin ? adminTheme : ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: brandColor, primary: brandColor),
        useMaterial3: true,
        scaffoldBackgroundColor: const Color(0xFFF7F7F9),
        appBarTheme: const AppBarTheme(backgroundColor: Colors.white, surfaceTintColor: Colors.white, centerTitle: false),
        cardTheme: const CardThemeData(color: Colors.white, surfaceTintColor: Colors.white, elevation: 0, margin: EdgeInsets.zero),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: Colors.white,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        ),
      ),
      home: switch (mode) {
        AppMode.loading => const _Splash(),
        // A new language remounts the screens (keyed by it), so every tr() runs again.
        AppMode.admin => AdminShell(key: ValueKey('admin|${appLang.code}')),
        AppMode.shop => ShopShell(key: ValueKey('shop|${appLang.code}')),
      },
      ),
    );
  }
}

class _Splash extends StatelessWidget {
  const _Splash();
  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: const Color(0xFFF9FAFC),
        // web-ийн админы FullScreenLoader-тэй адил.
        body: const Center(child: LogoLoader()),
      );
}
