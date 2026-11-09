import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../api/shop_models.dart';
import '../../state/shop_nav.dart';
import '../../state/shop_state.dart';
import '../common.dart';
import 'product_card.dart';
import 'store_page.dart';
import 'product_page.dart';
import 'stores_page.dart';

/// web-ийн app/page.tsx (утасны харагдац, header/footer-гүй):
/// ангиллын чип → hero carousel → манай дэлгүүрүүд → хямдрал →
/// showcase → санал болгох бараа.
class HomePage extends StatefulWidget {
  const HomePage({super.key});
  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  static const _homeListSize = 40;
  List<Product> _products = [];
  List<Store> _stores = [];
  bool _loading = true;
  bool _storesLoading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load({bool refresh = false}) async {
    final shop = context.read<ShopState>();
    setState(() {
      _loading = true;
      _storesLoading = true;
    });
    shop.getStores(refresh: refresh).then((s) {
      if (mounted) setState(() => _stores = s);
    }).catchError((_) {
      if (mounted) setState(() => _stores = []);
    }).whenComplete(() {
      if (mounted) setState(() => _storesLoading = false);
    });
    try {
      final rows = await shop.getAllProducts();
      if (mounted) setState(() => _products = rows);
    } catch (_) {
      if (mounted) setState(() => _products = []);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final newest = [..._products]..sort(byNewest);
    final shown = newest.take(_homeListSize).toList();
    final nav = context.read<ShopNav>();

    return Scaffold(
      backgroundColor: const Color(0xFFFAFAFB),
      appBar: AppBar(
        // Апп-ын header: лого + UVSSHOP.COM / Online Shop.
        title: Row(mainAxisSize: MainAxisSize.min, children: [
          Image.asset('assets/logo.png', height: 36),
          const SizedBox(width: 8),
          Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('UVSSHOP.COM',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: brandColor, letterSpacing: -0.3)),
            Text('ONLINE SHOP',
                style: TextStyle(fontSize: 10, fontWeight: FontWeight.w500, color: Colors.grey.shade600, letterSpacing: 1.5)),
          ]),
        ]),
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await context.read<ShopState>().loadCategories();
          await _load(refresh: true);
        },
        child: ListView(padding: const EdgeInsets.fromLTRB(16, 12, 16, 32), children: [
          const _CategoryScrollRow(),
          const SizedBox(height: 20),
          const _HeroCarousel(),
          const SizedBox(height: 20),
          _StoresRow(stores: _stores, loading: _storesLoading),
          if (_storesLoading || _stores.isNotEmpty) const SizedBox(height: 20),
          _DealsSection(products: _products, loading: _loading),
          const SizedBox(height: 20),
          _CategoryShowcase(products: _products, loading: _loading),
          const SizedBox(height: 20),
          _SectionTitle(
            'Санал болгох бараа',
            onViewAll: () => nav.openSearch(const SearchRequest(sort: SearchSort.newest)),
            large: true,
          ),
          const SizedBox(height: 14),
          if (_loading) const _GridSkeleton() else ProductGrid(shown),
          if (!_loading && _products.length > _homeListSize) ...[
            const SizedBox(height: 24),
            Center(
              child: OutlinedButton(
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: brandColor, width: 2),
                  padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                onPressed: () => nav.openSearch(const SearchRequest(sort: SearchSort.newest)),
                child: const Text('Цааш үзэх'),
              ),
            ),
          ],
        ]),
      ),
    );
  }
}

/// Сүүлд засварласан нь эхэндээ (web: byNewest).
int byNewest(Product a, Product b) =>
    (b.updatedAt ?? DateTime(2000)).compareTo(a.updatedAt ?? DateTime(2000));

class _SectionTitle extends StatelessWidget {
  final String title;
  final VoidCallback? onViewAll;
  final bool large;
  const _SectionTitle(this.title, {this.onViewAll, this.large = false});

  @override
  Widget build(BuildContext context) => Row(children: [
        Expanded(
          child: Text(
            large ? title : title.toUpperCase(),
            style: large
                ? const TextStyle(fontSize: 22, fontWeight: FontWeight.w600)
                : TextStyle(fontSize: 12, fontWeight: FontWeight.w600, letterSpacing: 1, color: Colors.grey.shade600),
          ),
        ),
        if (onViewAll != null)
          GestureDetector(
            onTap: onViewAll,
            child: const Text('Бүгдийг үзэх', style: TextStyle(color: brandColor, fontWeight: FontWeight.w500, fontSize: 14)),
          ),
      ]);
}

BoxDecoration _cardBox([double radius = 8]) => BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(radius),
      border: Border.all(color: borderColor),
    );

// ---------------------------------------------------------------------------
// Ангиллын чип (web: CategoryScrollRow)

class _CategoryScrollRow extends StatelessWidget {
  const _CategoryScrollRow();

  @override
  Widget build(BuildContext context) {
    final categories = context.watch<ShopState>().categories;
    final nav = context.read<ShopNav>();
    Widget chip(String label, VoidCallback onTap, {bool sale = false}) => Padding(
          padding: const EdgeInsets.only(right: 8),
          child: Material(
            color: sale ? accentColor : mutedColor,
            borderRadius: BorderRadius.circular(6),
            child: InkWell(
              borderRadius: BorderRadius.circular(6),
              onTap: onTap,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                child: Text(label,
                    style: TextStyle(
                        fontSize: 14, color: sale ? brandColor : Colors.black87, fontWeight: sale ? FontWeight.w500 : FontWeight.normal)),
              ),
            ),
          ),
        );
    return SizedBox(
      height: 36,
      child: ListView(scrollDirection: Axis.horizontal, clipBehavior: Clip.none, children: [
        chip('Хямдрал', () => nav.openSearch(const SearchRequest(sale: true)), sale: true),
        for (final c in categories) chip(c.name, () => nav.openSearch(SearchRequest(categoryId: c.id))),
      ]),
    );
  }
}

// ---------------------------------------------------------------------------
// Hero carousel (web: HeroCarousel)

class _Slide {
  final String code;
  final Alignment focus;
  final String kicker, light, bold, text;
  const _Slide(this.code, this.focus, this.kicker, this.light, this.bold, this.text);
}

const _slides = [
  _Slide('women', Alignment(0.2, -0.4), 'Эмэгтэй хувцас', 'Улирлын', 'шинэ загвар', 'Даашинз, цамц, гадуур хувцас нэг дороос.'),
  _Slide('electronics', Alignment.center, 'Цахилгаан бараа', 'Ухаалаг', 'технологи',
      'Гар утас, чихэвч, ухаалаг цаг, дагалдах хэрэгсэл.'),
  _Slide('beauty', Alignment(0, -0.2), 'Гоо сайхан', 'Өөрийгөө', 'гоёоцгооё', 'Арьс арчилгаа, нүүр будалт, үнэртэн.'),
];

class _HeroCarousel extends StatefulWidget {
  const _HeroCarousel();
  @override
  State<_HeroCarousel> createState() => _HeroCarouselState();
}

class _HeroCarouselState extends State<_HeroCarousel> {
  int _index = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _schedule();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _schedule() {
    _timer?.cancel();
    _timer = Timer(const Duration(seconds: 6), () => _go(1));
  }

  void _go(int d) {
    if (!mounted) return;
    setState(() => _index = (_index + d + _slides.length) % _slides.length);
    _schedule();
  }

  @override
  Widget build(BuildContext context) {
    final categories = context.watch<ShopState>().categories;
    final s = _slides[_index];
    final category = Category.findByCode(categories, s.code);
    final text = category != null && category.children.isNotEmpty ? category.children.map((c) => c.name).join(' · ') : s.text;

    return Container(
      decoration: _cardBox(),
      padding: const EdgeInsets.all(12),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(6),
        child: SizedBox(
          height: 360,
          child: GestureDetector(
            onHorizontalDragEnd: (d) {
              final v = d.primaryVelocity ?? 0;
              if (v < -100) _go(1);
              if (v > 100) _go(-1);
            },
            child: Stack(fit: StackFit.expand, children: [
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 700),
                child: Image.asset('assets/hero/${s.code}-sm.webp',
                    key: ValueKey(s.code), fit: BoxFit.cover, alignment: s.focus, width: double.infinity, height: double.infinity),
              ),
              // Цагаан туяа — бараан текст ямар ч зураг дээр уншигдана (утсан дээр дээрээс доош).
              const DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Color(0xF2FFFFFF), Color(0xBFFFFFFF), Color(0x1AFFFFFF)],
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 28, 24, 0),
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 500),
                  child: Column(
                    key: ValueKey(_index),
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text((category?.name ?? s.kicker).toUpperCase(),
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, letterSpacing: 2, color: Colors.black.withValues(alpha: 0.6))),
                      const SizedBox(height: 8),
                      Text.rich(
                        TextSpan(children: [
                          TextSpan(text: '${s.light} ', style: const TextStyle(fontWeight: FontWeight.w300)),
                          TextSpan(text: s.bold, style: const TextStyle(fontWeight: FontWeight.bold, color: brandColor)),
                        ]),
                        style: const TextStyle(fontSize: 30, height: 1.2, color: Colors.black87),
                      ),
                      const SizedBox(height: 12),
                      Text(text, style: TextStyle(fontSize: 14, height: 1.5, color: Colors.black.withValues(alpha: 0.75))),
                      const SizedBox(height: 20),
                      DecoratedBox(
                        decoration: BoxDecoration(
                          gradient: brandGradient,
                          borderRadius: BorderRadius.circular(6),
                          boxShadow: [BoxShadow(color: brandColor.withValues(alpha: 0.25), blurRadius: 10, offset: const Offset(0, 4))],
                        ),
                        child: Material(
                          color: Colors.transparent,
                          child: InkWell(
                            borderRadius: BorderRadius.circular(6),
                            onTap: () => context.read<ShopNav>().openSearch(SearchRequest(categoryId: category?.id)),
                            child: const Padding(
                              padding: EdgeInsets.symmetric(horizontal: 20, vertical: 11),
                              child: Text('Дэлгэрэнгүй үзэх',
                                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 14)),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              Positioned(
                left: 24,
                right: 24,
                bottom: 16,
                child: Row(children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.8), borderRadius: BorderRadius.circular(20)),
                    child: Row(children: [
                      for (var i = 0; i < _slides.length; i++)
                        GestureDetector(
                          onTap: () {
                            setState(() => _index = i);
                            _schedule();
                          },
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 250),
                            margin: EdgeInsets.only(right: i == _slides.length - 1 ? 0 : 6),
                            width: i == _index ? 32 : 16,
                            height: 6,
                            decoration: BoxDecoration(
                              color: i == _index ? brandColor : Colors.black.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(3),
                            ),
                          ),
                        ),
                    ]),
                  ),
                  const Spacer(),
                  _RoundButton(Icons.chevron_left, () => _go(-1)),
                  const SizedBox(width: 8),
                  _RoundButton(Icons.chevron_right, () => _go(1)),
                ]),
              ),
            ]),
          ),
        ),
      ),
    );
  }
}

class _RoundButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  const _RoundButton(this.icon, this.onTap);

  @override
  Widget build(BuildContext context) => Material(
        color: Colors.white.withValues(alpha: 0.9),
        shape: const CircleBorder(),
        elevation: 2,
        child: InkWell(
          customBorder: const CircleBorder(),
          onTap: onTap,
          child: SizedBox(width: 36, height: 36, child: Icon(icon, size: 20)),
        ),
      );
}

// ---------------------------------------------------------------------------
// Манай дэлгүүрүүд (web: StoresGrid)

class _StoresRow extends StatelessWidget {
  final List<Store> stores;
  final bool loading;
  const _StoresRow({required this.stores, required this.loading});

  @override
  Widget build(BuildContext context) {
    if (!loading && stores.isEmpty) return const SizedBox.shrink();
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      _SectionTitle('Манай дэлгүүрүүд',
          onViewAll: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const StoresPage()))),
      const SizedBox(height: 12),
      SizedBox(
        height: 160,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          clipBehavior: Clip.none,
          itemCount: loading ? 8 : stores.length,
          separatorBuilder: (_, _) => const SizedBox(width: 12),
          itemBuilder: (_, i) => loading ? const _StoreTileSkeleton() : StoreTile(stores[i]),
        ),
      ),
    ]);
  }
}

/// Дэлгүүрийн лого tile — дарвал тэр дэлгүүрийн бараагаар хайна.
class StoreTile extends StatelessWidget {
  final Store store;
  const StoreTile(this.store, {super.key});

  // web-ийн StoresGrid: gold/silver/bronze дэлгүүрт өнгөт хүрээ, булангийн тууз.
  static const _ribbon = {
    'gold': [Color(0xFFFCD34D), Color(0xFFFACC15), Color(0xFFF59E0B)],
    'silver': [Color(0xFFE2E8F0), Color(0xFF94A3B8)],
    'bronze': [Color(0xFFFDBA74), Color(0xFFB45309)],
  };
  static const _ring = {
    'gold': Color(0xFFFBBF24),
    'silver': Color(0xFFCBD5E1),
    'bronze': Color(0xFFFDBA74),
  };

  @override
  Widget build(BuildContext context) {
    final ring = _ring[store.tier];
    final ribbon = _ribbon[store.tier];
    return Container(
        width: 112,
        clipBehavior: Clip.antiAlias,
        decoration: ring == null
            ? _cardBox(16)
            : BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: ring, width: 2),
              ),
        child: Stack(children: [
          Material(
          color: Colors.transparent,
          child: InkWell(
            borderRadius: BorderRadius.circular(16),
            onTap: () => openStore(context, store.id),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(children: [
                StoreAvatar(name: store.name, logo: store.logo, size: 64, radius: 12),
                const SizedBox(height: 8),
                SizedBox(
                  height: 32,
                  child: Text(store.name,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      textAlign: TextAlign.center,
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, height: 1.25)),
                ),
                Text('${store.productCount} бараа', style: TextStyle(fontSize: 11, color: Colors.grey.shade600)),
              ]),
            ),
          ),
        ),
          if (ribbon != null)
            Positioned(
              top: 12,
              right: -28,
              child: IgnorePointer(
                child: Transform.rotate(
                  angle: 0.785398, // 45°
                  child: Container(
                    width: 96,
                    padding: const EdgeInsets.symmetric(vertical: 2),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(colors: ribbon),
                      boxShadow: const [BoxShadow(color: Color(0x33000000), blurRadius: 2, offset: Offset(0, 1))],
                    ),
                    child: Text(store.tier.toUpperCase(),
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                            fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 0.8, color: Color(0xFF451A03))),
                  ),
                ),
              ),
            ),
        ]),
      );
  }
}

class _StoreTileSkeleton extends StatelessWidget {
  const _StoreTileSkeleton();
  @override
  Widget build(BuildContext context) => Container(
        width: 112,
        decoration: _cardBox(16),
        padding: const EdgeInsets.all(12),
        child: Column(children: [
          _Bone(64, 64, radius: 12),
          const SizedBox(height: 10),
          _Bone(64, 12),
          const SizedBox(height: 6),
          _Bone(40, 10),
        ]),
      );
}

class _Bone extends StatelessWidget {
  final double width, height, radius;
  const _Bone(this.width, this.height, {this.radius = 6});
  @override
  Widget build(BuildContext context) => Container(
        width: width,
        height: height,
        decoration: BoxDecoration(color: mutedColor, borderRadius: BorderRadius.circular(radius)),
      );
}

// ---------------------------------------------------------------------------
// Хямдрал, урамшуулал (web: DealsSection)

class _DealsSection extends StatefulWidget {
  final List<Product> products;
  final bool loading;
  const _DealsSection({required this.products, required this.loading});
  @override
  State<_DealsSection> createState() => _DealsSectionState();
}

class _DealsSectionState extends State<_DealsSection> {
  static const _tiles = 5;
  late Timer _timer;
  Duration _left = Duration.zero;

  @override
  void initState() {
    super.initState();
    _tick();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) => _tick());
  }

  void _tick() {
    final now = DateTime.now();
    final end = DateTime(now.year, now.month, now.day + 1);
    setState(() => _left = end.difference(now));
  }

  @override
  void dispose() {
    _timer.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final products = widget.products;
    final deals = products.where((p) => p.onSale).toList()
      ..sort((a, b) => (b.discountPercent ?? 0).compareTo(a.discountPercent ?? 0));
    final dealTiles = deals.take(_tiles).toList();
    final dealIds = dealTiles.map((p) => p.id).toSet();
    final featured = (products.where((p) => !dealIds.contains(p.id)).toList()..sort(byNewest)).take(_tiles - dealTiles.length);
    final tiles = [...dealTiles, ...featured];
    final featuredOnly = !widget.loading && dealTiles.isEmpty;
    if (!widget.loading && tiles.isEmpty) return const SizedBox.shrink();

    final secs = _left.inSeconds;
    final units = [
      (0, 'Өдөр'),
      (secs ~/ 3600, 'Цаг'),
      ((secs % 3600) ~/ 60, 'Мин'),
      (secs % 60, 'Сек'),
    ];

    return Container(
      decoration: _cardBox(),
      clipBehavior: Clip.antiAlias,
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Container(
          padding: const EdgeInsets.all(18),
          decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: borderColor))),
          child: Row(children: [
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(featuredOnly ? 'Онцлох бараа' : 'Хямдрал, урамшуулал',
                    style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w600)),
                const SizedBox(height: 2),
                Text(featuredOnly ? 'Хамгийн их эрэлттэй бараанууд' : 'Өнөөдрийн онцлох хямдрал',
                    style: TextStyle(color: Colors.grey.shade600, fontSize: 13)),
              ]),
            ),
            const SizedBox(width: 12),
            if (featuredOnly)
              OutlinedButton(
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: brandColor, width: 2),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                ),
                onPressed: () => context.read<ShopNav>().openSearch(),
                child: const Text('Бүгдийг үзэх'),
              )
            else
              Row(children: [
                for (final u in units)
                  Container(
                    width: 44,
                    margin: const EdgeInsets.only(left: 5),
                    padding: const EdgeInsets.symmetric(vertical: 5),
                    decoration: BoxDecoration(color: brandColor, borderRadius: BorderRadius.circular(6)),
                    child: Column(children: [
                      Text(u.$1.toString().padLeft(2, '0'),
                          style: const TextStyle(
                              color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15, fontFeatures: [FontFeature.tabularFigures()])),
                      Text(u.$2, style: const TextStyle(color: Colors.white, fontSize: 10.5)),
                    ]),
                  ),
              ]),
          ]),
        ),
        _TileGrid(
          count: widget.loading ? _tiles : tiles.length,
          builder: (i) {
            if (widget.loading) {
              return Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                _Bone(112, 112),
                const SizedBox(height: 12),
                _Bone(96, 14),
                const SizedBox(height: 10),
                _Bone(56, 26, radius: 13),
              ]);
            }
            final p = tiles[i];
            final discount = p.onSale ? p.discountPercent ?? 0 : 0;
            return InkWell(
              onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => ProductPage(productId: p.id, preview: p))),
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(children: [
                  NetImage(p.image('thumbnail'), width: 112, height: 112, fit: BoxFit.contain, radius: BorderRadius.circular(6)),
                  const SizedBox(height: 10),
                  Text(p.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13.5)),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: (discount > 0 ? Colors.red : brandColor).withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(discount > 0 ? '-$discount%' : money(p.price),
                        style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13.5, color: discount > 0 ? Colors.red.shade700 : brandColor)),
                  ),
                ]),
              ),
            );
          },
        ),
      ]),
    );
  }
}

/// Хүрээтэй 2 баганатай tile-ууд (web-ийн border-b border-r grid).
class _TileGrid extends StatelessWidget {
  final int count;
  final Widget Function(int i) builder;
  const _TileGrid({required this.count, required this.builder});

  @override
  Widget build(BuildContext context) {
    final rows = <Widget>[];
    for (var i = 0; i < count; i += 2) {
      rows.add(IntrinsicHeight(
        child: Row(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          for (var j = i; j < i + 2; j++)
            Expanded(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  border: Border(
                    right: j == i ? const BorderSide(color: borderColor) : BorderSide.none,
                    bottom: i + 2 < count ? const BorderSide(color: borderColor) : BorderSide.none,
                  ),
                ),
                child: j < count ? builder(j) : const SizedBox.shrink(),
              ),
            ),
        ]),
      ));
    }
    return Column(children: rows);
  }
}

// ---------------------------------------------------------------------------
// 8 барааны showcase (web: CategoryShowcase)

class _CategoryShowcase extends StatelessWidget {
  final List<Product> products;
  final bool loading;
  const _CategoryShowcase({required this.products, required this.loading});

  @override
  Widget build(BuildContext context) {
    if (!loading && products.length < 4) return const SizedBox.shrink();
    final shown = loading ? <Product>[] : products.take(products.length >= 8 ? 8 : 4).toList();
    final count = loading ? 8 : shown.length;
    return Container(
      decoration: _cardBox(),
      clipBehavior: Clip.antiAlias,
      child: _TileGrid(
        count: count,
        builder: (i) {
          if (loading) {
            return Padding(
              padding: const EdgeInsets.all(16),
              child: SizedBox(
                height: 95,
                child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      _Bone(70, 13),
                      const SizedBox(height: 8),
                      _Bone(36, 11),
                    ]),
                  ),
                  Align(alignment: Alignment.bottomRight, child: _Bone(56, 56)),
                ]),
              ),
            );
          }
          final p = shown[i];
          return InkWell(
            onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => ProductPage(productId: p.id, preview: p))),
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: SizedBox(
                height: 99,
                child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(p.name, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13.5)),
                      const SizedBox(height: 4),
                      Text('Үнэ\n${money(p.price)}', style: TextStyle(fontSize: 12.5, color: Colors.grey.shade600, height: 1.35)),
                    ]),
                  ),
                  const SizedBox(width: 4),
                  Align(
                    alignment: Alignment.bottomRight,
                    child: NetImage(p.image('thumbnail'), width: 60, height: 60, fit: BoxFit.contain, radius: BorderRadius.circular(6)),
                  ),
                ]),
              ),
            ),
          );
        },
      ),
    );
  }
}

class _GridSkeleton extends StatelessWidget {
  const _GridSkeleton();
  @override
  Widget build(BuildContext context) => GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        padding: EdgeInsets.zero,
        gridDelegate: productGridDelegate,
        itemCount: 6,
        itemBuilder: (_, _) => Container(
          decoration: _cardBox(),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const AspectRatio(aspectRatio: 1, child: ColoredBox(color: mutedColor)),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                _Bone(80, 16),
                const SizedBox(height: 8),
                _Bone(120, 12),
              ]),
            ),
          ]),
        ),
      );
}
