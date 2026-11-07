import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../state/admin_state.dart';
import '../../state/app_state.dart';
import 'dashboard_page.dart';
import 'orders_page.dart';
import 'products_page.dart';
import 'profile_page.dart';

/// Админы хэсэг. Худалдагч (admin биш) зөвхөн бараа, профайлаа хардаг.
class AdminShell extends StatefulWidget {
  const AdminShell({super.key});
  @override
  State<AdminShell> createState() => _AdminShellState();
}

class _AdminShellState extends State<AdminShell> {
  int _tab = 0;

  @override
  Widget build(BuildContext context) {
    final isAdmin = context.select<AdminState, bool>((a) => a.user?.isAdmin ?? false);
    final tabs = <(NavigationDestination, Widget)>[
      if (isAdmin)
        (
          const NavigationDestination(icon: Icon(Icons.bar_chart_outlined), selectedIcon: Icon(Icons.bar_chart), label: 'Тайлан'),
          const DashboardPage(),
        ),
      (
        const NavigationDestination(icon: Icon(Icons.inventory_2_outlined), selectedIcon: Icon(Icons.inventory_2), label: 'Бараа'),
        const AdminProductsPage(),
      ),
      if (isAdmin)
        (
          const NavigationDestination(icon: Icon(Icons.receipt_long_outlined), selectedIcon: Icon(Icons.receipt_long), label: 'Захиалга'),
          const AdminOrdersPage(),
        ),
      (
        const NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'Профайл'),
        const AdminProfilePage(),
      ),
    ];
    final index = _tab.clamp(0, tabs.length - 1);
    return Scaffold(
      body: IndexedStack(index: index, children: [for (final t in tabs) t.$2]),
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected: (i) => setState(() => _tab = i),
        destinations: [for (final t in tabs) t.$1],
      ),
    );
  }
}

/// Админ хэсгийн AppBar-т байх "Дэлгүүр үзэх" товч.
class VisitShopButton extends StatelessWidget {
  const VisitShopButton({super.key});
  @override
  Widget build(BuildContext context) => TextButton.icon(
        onPressed: () => context.read<AppState>().openShop(),
        icon: const Icon(Icons.storefront_outlined),
        label: const Text('Дэлгүүр'),
      );
}
