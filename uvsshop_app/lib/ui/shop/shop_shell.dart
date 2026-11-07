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
  // Захиалга табыг нээх бүрт жагсаалтыг шинээр татахын тулд.
  int _ordersKey = 0;

  void _select(int i) => setState(() {
        if (i == 2 && _tab != 2) _ordersKey++;
        _tab = i;
      });

  @override
  Widget build(BuildContext context) {
    final cartCount = context.select<ShopState, int>((s) => s.cartCount);
    final isAdmin = context.select<AdminState, bool>((a) => a.signedIn);
    return Scaffold(
      body: IndexedStack(index: _tab, children: [
        const HomePage(),
        CartPage(onShop: () => _select(0)),
        OrdersPage(key: ValueKey(_ordersKey)),
        AccountPage(onOpenTab: _select),
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
        onDestinationSelected: _select,
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
