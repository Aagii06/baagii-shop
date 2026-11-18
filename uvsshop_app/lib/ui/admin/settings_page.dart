import 'package:flutter/material.dart';

import 'admin_widgets.dart';
import 'attrs_page.dart';
import 'categories_page.dart';
import 'payment_page.dart';
import 'package:uvsshop_app/i18n.dart';

/// web-ийн /settings: категори, үзүүлэлт, төлбөрийн тохиргоо.
class SettingsPage extends StatelessWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context) {
    final menu = [
      (Icons.grid_view, Colors.amber.shade700, tr('Категори'), tr('Категори нэмэх, засах'), const CategoriesPage()),
      (Icons.tune, Colors.pink.shade500, tr('Үзүүлэлт'), tr('Өнгө, хэмжээ зэрэг үзүүлэлт, утгууд'), const AttrsPage()),
      (Icons.credit_card, Colors.teal.shade600, tr('Төлбөрийн тохиргоо'), tr('Дансаар шилжүүлэх, QPay-ийн тохиргоо'), const PaymentPage()),
    ];
    return Scaffold(
      appBar: AppBar(title: Text(tr('Тохиргоо'))),
      body: ListView(padding: const EdgeInsets.all(12), children: [
        Panel(
          child: Column(children: [
            for (var i = 0; i < menu.length; i++) ...[
              if (i > 0) const Divider(height: 1),
              MenuTile(
                icon: menu[i].$1,
                color: menu[i].$2,
                title: menu[i].$3,
                subtitle: menu[i].$4,
                onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => menu[i].$5)),
              ),
            ],
          ]),
        ),
      ]),
    );
  }
}
