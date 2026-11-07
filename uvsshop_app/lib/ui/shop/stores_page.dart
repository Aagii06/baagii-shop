import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../api/shop_models.dart';
import '../../state/shop_nav.dart';
import '../../state/shop_state.dart';
import 'home_page.dart' show byNewest;
import 'product_card.dart';

const _tierRank = {'gold': 0, 'silver': 1, 'bronze': 2, 'normal': 3};
const _tierLabel = {'gold': 'Gold', 'silver': 'Silver', 'bronze': 'Bronze'};
const _tierBadge = {
  'gold': [Color(0xFFFCD34D), Color(0xFFEAB308)],
  'silver': [Color(0xFFE2E8F0), Color(0xFF94A3B8)],
  'bronze': [Color(0xFFFDBA74), Color(0xFFB45309)],
};
const _tierRing = {
  'gold': Color(0xFFFBBF24),
  'silver': Color(0xFFCBD5E1),
  'bronze': Color(0xFFFDBA74),
};

/// web-ийн /stores: бүх дэлгүүр (түвшнээр), доор нь тэдний бараа.
class StoresPage extends StatefulWidget {
  const StoresPage({super.key});
  @override
  State<StoresPage> createState() => _StoresPageState();
}

class _StoresPageState extends State<StoresPage> {
  static const _pageSize = 40;
  List<Store> _stores = [];
  List<Product> _products = [];
  bool _loading = true;
  int _shown = _pageSize;

  @override
  void initState() {
    super.initState();
    final shop = context.read<ShopState>();
    Future.wait([shop.getStores(), shop.getAllProducts()]).then((r) {
      if (!mounted) return;
      setState(() {
        _stores = r[0] as List<Store>;
        _products = r[1] as List<Product>;
      });
    }).catchError((_) {}).whenComplete(() {
      if (mounted) setState(() => _loading = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    final rankOf = {for (final s in _stores) s.name: _tierRank[s.tier] ?? 3};
    int rank(Product p) => p.storeName == null ? 3 : rankOf[p.storeName] ?? 3;
    final sorted = [..._products]..sort((a, b) {
        final r = rank(a).compareTo(rank(b));
        return r != 0 ? r : byNewest(a, b);
      });
    final visible = sorted.take(_shown).toList();

    return Scaffold(
      appBar: AppBar(title: const Text('Дэлгүүрүүд')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(padding: const EdgeInsets.all(16), children: [
              Text.rich(TextSpan(children: [
                const TextSpan(text: 'Дэлгүүрүүд ', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                TextSpan(text: '${_stores.length} дэлгүүр', style: TextStyle(fontSize: 15, color: Colors.grey.shade600)),
              ])),
              const SizedBox(height: 18),
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                padding: EdgeInsets.zero,
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 3,
                  mainAxisSpacing: 14,
                  crossAxisSpacing: 12,
                  childAspectRatio: 0.72,
                ),
                itemCount: _stores.length,
                itemBuilder: (_, i) => _TierStoreTile(_stores[i]),
              ),
              const SizedBox(height: 32),
              const Text('Дэлгүүрүүдийн бараа', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w600)),
              const SizedBox(height: 2),
              Text('Gold, Silver, Bronze дэлгүүрүүдийн бараа эхэндээ', style: TextStyle(color: Colors.grey.shade600)),
              const SizedBox(height: 14),
              ProductGrid(visible),
              if (visible.length < sorted.length) ...[
                const SizedBox(height: 20),
                Center(
                  child: OutlinedButton(
                    onPressed: () => setState(() => _shown += _pageSize),
                    child: const Text('Цааш үзэх'),
                  ),
                ),
              ],
            ]),
    );
  }
}

class _TierStoreTile extends StatelessWidget {
  final Store store;
  const _TierStoreTile(this.store);

  @override
  Widget build(BuildContext context) {
    final badge = _tierBadge[store.tier];
    return Stack(clipBehavior: Clip.none, children: [
      Positioned.fill(
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: _tierRing[store.tier] ?? const Color(0xFFE5E7EB), width: 2),
          ),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              borderRadius: BorderRadius.circular(16),
              onTap: () {
                Navigator.of(context).popUntil((r) => r.isFirst);
                context.read<ShopNav>().openSearch(SearchRequest(store: store.name));
              },
              child: Padding(
                padding: const EdgeInsets.all(10),
                child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                  StoreAvatar(name: store.name, logo: store.logo, size: 60, radius: 12),
                  const SizedBox(height: 8),
                  Text(store.name,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      textAlign: TextAlign.center,
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, height: 1.25)),
                  const SizedBox(height: 2),
                  Text('${store.productCount} бараа', style: TextStyle(fontSize: 11, color: Colors.grey.shade600)),
                ]),
              ),
            ),
          ),
        ),
      ),
      if (badge != null)
        Positioned(
          top: -8,
          left: 0,
          right: 0,
          child: Center(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(gradient: LinearGradient(colors: badge), borderRadius: BorderRadius.circular(20)),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                const Icon(Icons.workspace_premium, size: 12),
                const SizedBox(width: 2),
                Text(_tierLabel[store.tier]!.toUpperCase(), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
              ]),
            ),
          ),
        ),
    ]);
  }
}
