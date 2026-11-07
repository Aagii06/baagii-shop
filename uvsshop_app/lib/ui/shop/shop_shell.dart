import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../state/admin_state.dart';
import '../../state/app_state.dart';
import '../../state/shop_state.dart';
import 'account_page.dart';
import 'cart_page.dart';
import 'home_page.dart';
import 'saved_page.dart';
import 'search_page.dart';

/// Худалдан авагчийн доод цэс — web-ийн MobileBottomNav-тай адил:
/// Нүүр · Хайх · Сагс · Хадгалсан (нэвтэрсэн үед) · Профайл / Нэвтрэх.
enum ShopTab { home, search, cart, saved, profile }

class ShopShell extends StatefulWidget {
  const ShopShell({super.key});
  @override
  State<ShopShell> createState() => _ShopShellState();
}

class _ShopShellState extends State<ShopShell> {
  ShopTab _tab = ShopTab.home;

  void _open(ShopTab t) => setState(() => _tab = t);

  @override
  Widget build(BuildContext context) {
    final cartCount = context.select<ShopState, int>((s) => s.cartCount);
    final savedCount = context.select<ShopState, int>((s) => s.saved.length);
    final signedIn = context.select<ShopState, bool>((s) => s.signedIn);
    final isAdmin = context.select<AdminState, bool>((a) => a.signedIn);

    final tabs = [
      ShopTab.home,
      ShopTab.search,
      ShopTab.cart,
      if (signedIn) ShopTab.saved,
      ShopTab.profile,
    ];
    final current = tabs.contains(_tab) ? _tab : ShopTab.home;

    Widget badge(int n, IconData icon) => Badge(
          isLabelVisible: n > 0,
          label: Text(n > 99 ? '99+' : '$n'),
          child: Icon(icon),
        );

    NavigationDestination dest(ShopTab t) => switch (t) {
          ShopTab.home => const NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Нүүр'),
          ShopTab.search => const NavigationDestination(icon: Icon(Icons.search), selectedIcon: Icon(Icons.search), label: 'Хайх'),
          ShopTab.cart => NavigationDestination(
              icon: badge(cartCount, Icons.shopping_cart_outlined),
              selectedIcon: badge(cartCount, Icons.shopping_cart),
              label: 'Сагс',
            ),
          ShopTab.saved => NavigationDestination(
              icon: badge(savedCount, Icons.favorite_border),
              selectedIcon: badge(savedCount, Icons.favorite),
              label: 'Хадгалсан',
            ),
          ShopTab.profile => NavigationDestination(
              icon: const Icon(Icons.person_outline),
              selectedIcon: const Icon(Icons.person),
              label: signedIn ? 'Профайл' : 'Нэвтрэх',
            ),
        };

    return Scaffold(
      body: IndexedStack(index: ShopTab.values.indexOf(current), children: [
        const HomePage(),
        const SearchPage(),
        CartPage(onShop: () => _open(ShopTab.search)),
        SavedPage(onShop: () => _open(ShopTab.search)),
        AccountPage(onOpenTab: _open),
      ]),
      // Админ дэлгүүрээр зочилж байх үед админ руу буцах товч.
      floatingActionButton: isAdmin
          ? FloatingActionButton.extended(
              heroTag: 'toAdmin',
              onPressed: () => context.read<AppState>().openAdmin(),
              icon: const Icon(Icons.admin_panel_settings_outlined),
              label: const Text('Админ'),
            )
          : null,
      bottomNavigationBar: NavigationBar(
        selectedIndex: tabs.indexOf(current),
        onDestinationSelected: (i) => _open(tabs[i]),
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        destinations: [for (final t in tabs) dest(t)],
      ),
    );
  }
}
