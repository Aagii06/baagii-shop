import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../state/admin_state.dart';
import '../../state/app_state.dart';
import 'admin_design.dart';
import 'dashboard_page.dart';
import 'orders_page.dart';
import 'products_page.dart';
import 'profile_page.dart';

/// Аль tab нээлттэй вэ — самбараас "Захиалга" руу шилжихэд.
final adminTab = ValueNotifier<String>('dashboard');

/// Админы хэсэг (web-ийн PanelShell). Худалдагч (admin биш) самбар, захиалгыг харахгүй.
class AdminShell extends StatefulWidget {
  const AdminShell({super.key});
  @override
  State<AdminShell> createState() => _AdminShellState();
}

class _AdminShellState extends State<AdminShell> with WidgetsBindingObserver {
  Timer? _poll;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    // Толгойн 🔔-ийн тоог 30 секунд тутам шинэчилнэ (вэбийнхтэй ижил).
    final admin = context.read<AdminState>();
    admin.refreshUnread();
    _poll = Timer.periodic(const Duration(seconds: 30), (_) => admin.refreshUnread());
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // Апп дахин нээгдэхэд шууд шалгана.
    if (state == AppLifecycleState.resumed) context.read<AdminState>().refreshUnread();
  }

  @override
  void dispose() {
    _poll?.cancel();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isAdmin = context.select<AdminState, bool>((a) => a.user?.isAdmin ?? false);
    final tabs = <(String, IconData, String, Widget)>[
      if (isAdmin) ('dashboard', Icons.bar_chart_rounded, 'Самбар', const DashboardPage()),
      ('products', Icons.crop_square_rounded, 'Бараа', const AdminProductsPage()),
      if (isAdmin) ('orders', Icons.receipt_long_outlined, 'Захиалга', const AdminOrdersPage()),
      ('profile', Icons.person_outline_rounded, 'Профайл', const AdminProfilePage()),
    ];
    return ValueListenableBuilder<String>(
      valueListenable: adminTab,
      builder: (context, current, _) {
        final index = tabs.indexWhere((t) => t.$1 == current).clamp(0, tabs.length - 1);
        return Scaffold(
          backgroundColor: AdminColors.background,
          body: IndexedStack(index: index, children: [for (final t in tabs) t.$4]),
          bottomNavigationBar: Container(
            decoration: const BoxDecoration(
              color: AdminColors.background,
              border: Border(top: BorderSide(color: AdminColors.border)),
            ),
            child: SafeArea(
              top: false,
              child: Row(children: [
                for (var i = 0; i < tabs.length; i++)
                  Expanded(
                    child: InkWell(
                      onTap: () => adminTab.value = tabs[i].$1,
                      child: Padding(
                        padding: const EdgeInsets.only(top: 12, bottom: 10),
                        child: Column(mainAxisSize: MainAxisSize.min, children: [
                          Icon(tabs[i].$2,
                              size: 24, color: i == index ? AdminColors.foreground : AdminColors.mutedForeground.withValues(alpha: 0.8)),
                          const SizedBox(height: 4),
                          Text(tabs[i].$3,
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: i == index ? AdminColors.foreground : AdminColors.mutedForeground.withValues(alpha: 0.8),
                              )),
                        ]),
                      ),
                    ),
                  ),
              ]),
            ),
          ),
        );
      },
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
