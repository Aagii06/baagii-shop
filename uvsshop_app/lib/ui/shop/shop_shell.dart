import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../state/admin_state.dart';
import '../../state/app_state.dart';
import '../../state/shop_nav.dart';
import '../../state/shop_state.dart';
import '../common.dart';
import 'account_page.dart';
import 'cart_page.dart';
import 'home_page.dart';
import 'saved_page.dart';
import 'search_page.dart';
import 'package:uvsshop_app/i18n.dart';

/// Худалдан авагчийн доод цэс — web-ийн MobileBottomNav-тай адил:
/// Нүүр · Хайх · Сагс · Хадгалсан (нэвтэрсэн үед) · Профайл / Нэвтрэх.
class ShopShell extends StatefulWidget {
  const ShopShell({super.key});
  @override
  State<ShopShell> createState() => _ShopShellState();
}

class _ShopShellState extends State<ShopShell> with WidgetsBindingObserver {
  Timer? _poll;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    // Профайлын мэдэгдлийн тоо — минут тутам, апп дахин нээгдэхэд.
    final shop = context.read<ShopState>();
    shop.refreshUnread();
    _poll = Timer.periodic(const Duration(minutes: 1), (_) => shop.refreshUnread());
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) context.read<ShopState>().refreshUnread();
  }

  @override
  void dispose() {
    _poll?.cancel();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final nav = context.watch<ShopNav>();
    final tab = nav.tab;
    void open(ShopTab t) => nav.open(t);
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
    final current = tabs.contains(tab) ? tab : ShopTab.home;

    // web-ийн MobileBottomNav-ийн дүрс, нэр, тоо.
    (IconData, String, int) item(ShopTab t) => switch (t) {
          ShopTab.home => (Icons.home_outlined, tr('Нүүр'), 0),
          ShopTab.search => (Icons.search, tr('Хайх'), 0),
          ShopTab.cart => (Icons.shopping_cart_outlined, tr('Сагс'), cartCount),
          ShopTab.saved => (Icons.favorite_border, tr('Хадгалсан'), savedCount),
          ShopTab.profile => (Icons.person_outline, signedIn ? tr('Профайл') : tr('Нэвтрэх'), 0),
        };

    return Scaffold(
      body: IndexedStack(index: ShopTab.values.indexOf(current), children: [
        const HomePage(),
        const SearchPage(),
        CartPage(onShop: () => nav.openSearch()),
        SavedPage(onShop: () => nav.openSearch()),
        AccountPage(onOpenTab: open),
      ]),
      // Админ дэлгүүрээр зочилж байх үед админ руу буцах товч.
      floatingActionButton: isAdmin
          ? FloatingActionButton.extended(
              heroTag: 'toAdmin',
              onPressed: () => context.read<AppState>().openAdmin(),
              icon: const Icon(Icons.admin_panel_settings_outlined),
              label: Text(tr('Админ')),
            )
          : null,
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: Color(0xF2FFFFFF),
          border: Border(top: BorderSide(color: borderColor)),
        ),
        child: SafeArea(
          top: false,
          child: SizedBox(
            height: 64,
            child: Row(children: [
              for (final t in tabs)
                Expanded(child: _NavItem(item: item(t), active: t == current, onTap: () => open(t))),
            ]),
          ),
        ),
      ),
    );
  }
}

/// web-ийн MobileBottomNav-ийн нэг товч: идэвхтэй нь ягаан, тоо нь улаан badge.
class _NavItem extends StatelessWidget {
  final (IconData, String, int) item;
  final bool active;
  final VoidCallback onTap;
  const _NavItem({required this.item, required this.active, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final (icon, label, count) = item;
    final color = active ? brandColor : const Color(0xFF6B7280);
    return InkWell(
      onTap: onTap,
      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        Stack(clipBehavior: Clip.none, children: [
          Icon(icon, size: 22, color: color),
          if (count > 0)
            Positioned(
              top: -6,
              right: -10,
              child: Container(
                constraints: const BoxConstraints(minWidth: 16),
                height: 16,
                padding: const EdgeInsets.symmetric(horizontal: 4),
                alignment: Alignment.center,
                decoration: BoxDecoration(color: Colors.red.shade600, borderRadius: BorderRadius.circular(8)),
                child: Text(count > 99 ? '99+' : '$count',
                    style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold, height: 1)),
              ),
            ),
        ]),
        const SizedBox(height: 4),
        Text(label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(fontSize: 11, color: color, fontWeight: active ? FontWeight.w600 : FontWeight.w400)),
      ]),
    );
  }
}
