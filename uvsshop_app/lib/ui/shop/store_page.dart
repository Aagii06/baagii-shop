import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../api/shop_models.dart';
import '../../state/shop_nav.dart';
import '../../state/shop_state.dart';
import '../common.dart';
import 'home_page.dart' show byNewest;
import 'product_card.dart';

/// Дэлгүүрийг нээнэ. Буцах товч (AppBar) нээсэн газар руугаа буцна.
void openStore(BuildContext context, int storeId) =>
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => StorePage(storeId: storeId)));

const _tierBadge = {
  'gold': [Color(0xFFFCD34D), Color(0xFFEAB308)],
  'silver': [Color(0xFFE2E8F0), Color(0xFF94A3B8)],
  'bronze': [Color(0xFFFDBA74), Color(0xFFB45309)],
};

/// web-ийн /store?id=: өнгөлөг толгой (лого, нэр, бараа тоо, холбоо барих),
/// дараа нь зөвхөн тухайн дэлгүүрийн бараа — карт дээр дэлгүүрийн нэргүй.
class StorePage extends StatefulWidget {
  final int storeId;
  const StorePage({super.key, required this.storeId});
  @override
  State<StorePage> createState() => _StorePageState();
}

class _StorePageState extends State<StorePage> {
  static const _pageSize = 40;
  Store? _store;
  List<Product> _products = [];
  bool _loading = true;
  bool _notFound = false;
  SearchSort _sort = SearchSort.newest;
  int _shown = _pageSize;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final shop = context.read<ShopState>();
    setState(() {
      _loading = true;
      _notFound = false;
    });
    try {
      final results = await Future.wait([shop.getStore(widget.storeId), shop.getAllProducts()]);
      if (!mounted) return;
      final store = results[0] as Store?;
      setState(() {
        _store = store;
        _notFound = store == null;
        _products = store == null ? [] : (results[1] as List<Product>).where((p) => p.storeId == store.id).toList();
      });
    } catch (_) {
      if (mounted) setState(() => _notFound = true);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<Product> get _sorted {
    final list = [..._products];
    switch (_sort) {
      case SearchSort.newest:
        list.sort(byNewest);
      case SearchSort.priceAsc:
        list.sort((a, b) => a.price.compareTo(b.price));
      case SearchSort.rating:
        break;
      case SearchSort.discount:
        list.sort((a, b) => (b.onSale ? b.discountPercent ?? 0 : 0).compareTo(a.onSale ? a.discountPercent ?? 0 : 0));
    }
    return list;
  }

  @override
  Widget build(BuildContext context) {
    final sorted = _sorted;
    final visible = sorted.take(_shown).toList();
    return Scaffold(
      backgroundColor: const Color(0xFFFAFAFB),
      appBar: AppBar(title: Text(_store?.name ?? 'Дэлгүүр')),
      body: _notFound && !_loading
          ? const EmptyView(icon: Icons.storefront_outlined, text: 'Дэлгүүр олдсонгүй\nЭнэ дэлгүүр хаагдсан эсвэл холбоос буруу байна.')
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(padding: const EdgeInsets.all(16), children: [
                _Header(store: _store, count: _products.length, loading: _loading),
                const SizedBox(height: 16),
                Align(
                  alignment: Alignment.centerRight,
                  child: PopupMenuButton<SearchSort>(
                    initialValue: _sort,
                    position: PopupMenuPosition.under,
                    onSelected: (s) => setState(() {
                      _sort = s;
                      _shown = _pageSize;
                    }),
                    itemBuilder: (_) => [
                      for (final s in SearchSort.values)
                        if (s != SearchSort.rating) PopupMenuItem(value: s, child: Text(searchSortLabel[s]!)),
                    ],
                    child: Container(
                      height: 40,
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                          color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: borderColor)),
                      child: Row(mainAxisSize: MainAxisSize.min, children: [
                        Text(searchSortLabel[_sort]!, style: const TextStyle(fontSize: 13.5)),
                        const SizedBox(width: 4),
                        Icon(Icons.expand_more, size: 18, color: Colors.grey.shade600),
                      ]),
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                if (_loading)
                  const LoadingView(kind: SkeletonKind.grid, count: 4)
                else if (visible.isEmpty)
                  Container(
                    padding: const EdgeInsets.all(32),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: borderColor),
                    ),
                    child: Text('Энэ дэлгүүрт одоогоор бараа алга.',
                        textAlign: TextAlign.center, style: TextStyle(color: Colors.grey.shade600)),
                  )
                else
                  ProductGrid(visible, hideStore: true),
                if (!_loading && sorted.length > _shown) ...[
                  const SizedBox(height: 20),
                  Center(
                    child: OutlinedButton(
                      onPressed: () => setState(() => _shown += _pageSize),
                      child: const Text('Цааш үзэх'),
                    ),
                  ),
                ],
                const SizedBox(height: 24),
              ]),
            ),
    );
  }
}

class _Header extends StatelessWidget {
  final Store? store;
  final int count;
  final bool loading;
  const _Header({required this.store, required this.count, required this.loading});

  Future<void> _launch(BuildContext context, Uri uri) async {
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication) && context.mounted) {
      showMessage(context, 'Нээж чадсангүй', error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = store;
    final badge = s == null ? null : _tierBadge[s.tier];
    final hasContacts = s != null && (s.phones.isNotEmpty || s.emails.isNotEmpty || s.addresses.isNotEmpty);
    Widget chip(IconData icon, String text, {VoidCallback? onTap}) => Material(
          color: Colors.white.withValues(alpha: 0.18),
          borderRadius: BorderRadius.circular(20),
          child: InkWell(
            borderRadius: BorderRadius.circular(20),
            onTap: onTap,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                Icon(icon, size: 15, color: Colors.white),
                const SizedBox(width: 6),
                Flexible(
                  child: Text(text, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13.5)),
                ),
              ]),
            ),
          ),
        );

    return Container(
      decoration: BoxDecoration(
        gradient: brandGradient,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: brandColor.withValues(alpha: 0.25), blurRadius: 18, offset: const Offset(0, 8))],
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(children: [
        // Гэрэлтэй дугуйнууд — гүн мэдрэмж.
        Positioned(right: -60, top: -70, child: _Circle(200)),
        Positioned(right: 60, bottom: -90, child: _Circle(170)),
        Padding(
          padding: const EdgeInsets.all(20),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              if (loading || s == null) ...[
                const Pulse(child: Bone(width: 68, height: 68, radius: 16)),
                const SizedBox(width: 16),
                const Expanded(
                  child: Pulse(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Bone(width: 160, height: 20),
                      SizedBox(height: 8),
                      Bone(width: 80, height: 14),
                    ]),
                  ),
                ),
              ] else ...[
                Container(
                  padding: const EdgeInsets.all(5),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.3), width: 4),
                  ),
                  child: StoreAvatar(name: s.name, logo: s.logo, size: 58, radius: 10),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    if (badge != null)
                      Container(
                        margin: const EdgeInsets.only(bottom: 4),
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(gradient: LinearGradient(colors: badge), borderRadius: BorderRadius.circular(20)),
                        child: Row(mainAxisSize: MainAxisSize.min, children: [
                          const Icon(Icons.workspace_premium, size: 12),
                          const SizedBox(width: 2),
                          Text(s.tier.toUpperCase(), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                        ]),
                      ),
                    Text(s.name,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
                    Text('$count бараа', style: TextStyle(color: Colors.white.withValues(alpha: 0.85))),
                  ]),
                ),
              ],
            ]),
            if (hasContacts) ...[
              const SizedBox(height: 16),
              Divider(height: 1, color: Colors.white.withValues(alpha: 0.25)),
              const SizedBox(height: 12),
              Text('ХОЛБОО БАРИХ',
                  style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.75), fontSize: 11.5, fontWeight: FontWeight.w600, letterSpacing: 1)),
              const SizedBox(height: 10),
              Wrap(spacing: 8, runSpacing: 8, children: [
                for (final p in s.phones)
                  chip(Icons.phone_outlined, _formatPhone(p), onTap: () => _launch(context, Uri(scheme: 'tel', path: p))),
                for (final e in s.emails)
                  chip(Icons.mail_outline, e, onTap: () => _launch(context, Uri(scheme: 'mailto', path: e))),
                for (final a in s.addresses) chip(Icons.place_outlined, a),
              ]),
            ],
          ]),
        ),
      ]),
    );
  }

  static String _formatPhone(String v) {
    final d = digitsOnly(v);
    return d.length > 4 ? '${d.substring(0, 4)} ${d.substring(4)}' : d;
  }
}

class _Circle extends StatelessWidget {
  final double size;
  const _Circle(this.size);
  @override
  Widget build(BuildContext context) => Container(
        width: size,
        height: size,
        decoration: BoxDecoration(shape: BoxShape.circle, color: Colors.white.withValues(alpha: 0.1)),
      );
}
