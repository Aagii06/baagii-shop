import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../state/shop_state.dart';
import '../common.dart';
import 'home_page.dart';

/// Web-ийн /saved — хадгалсан бараа.
class SavedPage extends StatelessWidget {
  final VoidCallback onShop;
  const SavedPage({super.key, required this.onShop});

  @override
  Widget build(BuildContext context) {
    final saved = context.watch<ShopState>().saved;
    return Scaffold(
      appBar: AppBar(title: const Text('Хадгалсан')),
      body: saved.isEmpty
          ? EmptyView(
              icon: Icons.favorite_border,
              text: 'Хадгалсан бараа алга.\nБарааны ♡ дээр дарж хадгална.',
              action: FilledButton(onPressed: onShop, child: const Text('Бараа үзэх')),
            )
          : GridView.builder(
              padding: const EdgeInsets.all(12),
              gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                maxCrossAxisExtent: 220,
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 0.62,
              ),
              itemCount: saved.length,
              itemBuilder: (_, i) => ProductCard(saved[i]),
            ),
    );
  }
}
