import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../state/admin_state.dart';
import '../../state/app_state.dart';
import '../../state/shop_state.dart';
import 'account_page.dart';
import 'cart_page.dart';
import 'home_page.dart';
import 'orders_page.dart';

class ShopShell extends StatefulWidget {
  const ShopShell({super.key});
  @override
  State<ShopShell> createState() => _ShopShellState();
}

class _ShopShellState extends State<ShopShell> {
  int _tab = 0;

  @override
  Widget build(BuildContext context) {
    final cartCount = context.select<ShopState, int>((s) => s.cartCount);
    final isAdmin = context.select<AdminState, bool>((a) => a.signedIn);
    return Scaffold(
      body: IndexedStack(index: _tab, children: [
        HomePage(onOpenCart: () => setState(() => _tab = 1)),
        CartPage(onShop: () => setState(() => _tab = 0)),
        const OrdersPage(),
        const AccountPage(),
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
        selectedIndex: _tab,
        onDestinationSelected: (i) => setState(() => _tab = i),
        destinations: [
          const NavigationDestination(icon: Icon(Icons.storefront_outlined), selectedIcon: Icon(Icons.storefront), label: 'Нүүр'),
          NavigationDestination(
            icon: Badge(isLabelVisible: cartCount > 0, label: Text('$cartCount'), child: const Icon(Icons.shopping_bag_outlined)),
            selectedIcon: Badge(isLabelVisible: cartCount > 0, label: Text('$cartCount'), child: const Icon(Icons.shopping_bag)),
            label: 'Сагс',
          ),
          const NavigationDestination(icon: Icon(Icons.receipt_long_outlined), selectedIcon: Icon(Icons.receipt_long), label: 'Захиалга'),
          const NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'Миний'),
        ],
      ),
    );
  }
}
