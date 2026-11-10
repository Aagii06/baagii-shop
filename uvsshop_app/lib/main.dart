import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'config.dart';
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

class UvsShopApp extends StatelessWidget {
  const UvsShopApp({super.key});

  @override
  Widget build(BuildContext context) {
    final mode = context.select<AppState, AppMode>((a) => a.mode);
    return MaterialApp(
      title: AppConfig.appName,
      debugShowCheckedModeBanner: false,
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
        AppMode.admin => const AdminShell(key: ValueKey('admin')),
        AppMode.shop => const ShopShell(key: ValueKey('shop')),
      },
    );
  }
}

class _Splash extends StatelessWidget {
  const _Splash();
  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: Colors.white,
        body: Center(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Image.asset('assets/logo.png', width: 140),
            const SizedBox(height: 24),
            const CircularProgressIndicator(),
          ]),
        ),
      );
}
