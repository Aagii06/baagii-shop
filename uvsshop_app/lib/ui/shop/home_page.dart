import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../api/shop_models.dart';
import '../../state/shop_nav.dart';
import '../../state/shop_state.dart';
import '../common.dart';
import 'notifications_page.dart';
import 'product_card.dart';
import 'store_page.dart';
import 'stores_page.dart';
import 'package:uvsshop_app/i18n.dart';

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
    final newest = goldFirst([..._products]..sort(byNewest), _stores);
    final shown = newest.take(_homeListSize).toList();
    final nav = context.read<ShopNav>();

    return Scaffold(
      backgroundColor: const Color(0xFFFAFAFB),
      appBar: AppBar(
        // Апп-ын header: лого + UVSSHOP.COM / Увс анхны зарын сайт (вэбийн header-тэй адил).
        title: Row(mainAxisSize: MainAxisSize.min, children: [
          Image.asset('assets/logo.png', height: 36),
          const SizedBox(width: 8),
          Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('UVSSHOP.COM',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: brandColor, letterSpacing: -0.3)),
            const SizedBox(height: 2),
            Text(tr('Увс анхны зарын сайт'),
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: Colors.grey.shade600)),
          ]),
        ]),
        actions: const [_NotificationsButton(), SizedBox(width: 4)],
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
          _CategoryShowcase(products: _products, loading: _loading),
          const SizedBox(height: 20),
          _SectionTitle(
            tr('Санал болгох бараа'),
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
                child: Text(tr('Цааш үзэх')),
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

/// Gold дэлгүүрийн бараа эхэнд (шинэ нь эхэндээ), бусад нь өмнөх дараалалаараа
/// (web: goldFirst).
List<Product> goldFirst(List<Product> products, List<Store> stores) {
  final gold = stores.where((s) => s.tier == 'gold');
  if (gold.isEmpty) return products;
  final ids = {for (final s in gold) s.id};
  final names = {for (final s in gold) s.name};
  bool isGold(Product p) => p.storeId != null ? ids.contains(p.storeId) : names.contains(p.storeName);
  return [...products.where(isGold).toList()..sort(byNewest), ...products.where((p) => !isGold(p))];
}

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
            child: Text(tr('Бүгдийг үзэх'), style: TextStyle(color: brandColor, fontWeight: FontWeight.w500, fontSize: 14)),
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
        chip(tr('Хямдрал'), () => nav.openSearch(const SearchRequest(sale: true)), sale: true),
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
    final text = category != null && category.children.isNotEmpty ? category.children.map((c) => c.name).join(' · ') : tr(s.text);

    return Container(
      decoration: _cardBox(),
      padding: const EdgeInsets.all(8),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(6),
        // Утсан дээр нүүрийн дээд хэсгийг хэт эзлэхгүй намхан баннер.
        child: SizedBox(
          height: 250,
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
                padding: const EdgeInsets.fromLTRB(20, 18, 20, 0),
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 500),
                  child: Column(
                    key: ValueKey(_index),
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text((category?.name ?? tr(s.kicker)).toUpperCase(),
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, letterSpacing: 2, color: Colors.black.withValues(alpha: 0.6))),
                      const SizedBox(height: 6),
                      Text.rich(
                        TextSpan(children: [
                          TextSpan(text: '${tr(s.light)} ', style: const TextStyle(fontWeight: FontWeight.w300)),
                          TextSpan(text: tr(s.bold), style: const TextStyle(fontWeight: FontWeight.bold, color: brandColor)),
                        ]),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 24, height: 1.2, color: Colors.black87),
                      ),
                      const SizedBox(height: 6),
                      Text(text,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(fontSize: 13.5, height: 1.5, color: Colors.black.withValues(alpha: 0.75))),
                      const SizedBox(height: 12),
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
                            child: Padding(
                              padding: EdgeInsets.symmetric(horizontal: 18, vertical: 9),
                              child: Text(tr('Дэлгэрэнгүй үзэх'),
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
      _SectionTitle(tr('Манай дэлгүүрүүд'),
          onViewAll: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const StoresPage()))),
      const SizedBox(height: 12),
      // Жижиг tile-ууд — дэлгэцэнд олон дэлгүүр багтана.
      SizedBox(
        height: 124,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          clipBehavior: Clip.none,
          itemCount: loading ? 8 : stores.length,
          separatorBuilder: (_, _) => const SizedBox(width: 10),
          itemBuilder: (_, i) => loading ? const _StoreTileSkeleton() : StoreTile(stores[i]),
        ),
      ),
    ]);
  }
}

/// Дэлгүүрийн түвшний хүрээний өнгө (web: TIER_BORDER).
const tierRing = {
  'gold': Color(0xFFFBBF24),
  'silver': Color(0xFFCBD5E1),
  'bronze': Color(0xFFFDBA74),
};
const _tierRibbon = {
  'gold': [Color(0xFFFCD34D), Color(0xFFFACC15), Color(0xFFF59E0B)],
  'silver': [Color(0xFFE2E8F0), Color(0xFF94A3B8)],
  'bronze': [Color(0xFFFDBA74), Color(0xFFB45309)],
};

/// Картын баруун дээд буланд налуу тууз ("GOLD"); Stack дотор, карт нь
/// clip хийсэн байх ёстой. Энгийн дэлгүүрт юу ч зурахгүй (web: TierRibbon).
class TierRibbon extends StatelessWidget {
  final String tier;
  const TierRibbon(this.tier, {super.key});

  @override
  Widget build(BuildContext context) {
    final colors = _tierRibbon[tier];
    if (colors == null) return const SizedBox.shrink();
    return Positioned(
      top: 12,
      right: -28,
      child: IgnorePointer(
        child: Transform.rotate(
          angle: 0.785398, // 45°
          child: Container(
            width: 96,
            padding: const EdgeInsets.symmetric(vertical: 2),
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: colors),
              boxShadow: const [BoxShadow(color: Color(0x33000000), blurRadius: 2, offset: Offset(0, 1))],
            ),
            child: Text(tier.toUpperCase(),
                textAlign: TextAlign.center,
                style: const TextStyle(
                    fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 0.8, color: Color(0xFF451A03))),
          ),
        ),
      ),
    );
  }
}

/// Дэлгүүрийн лого tile — дарвал тэр дэлгүүрийн бараагаар хайна.
class StoreTile extends StatelessWidget {
  final Store store;
  const StoreTile(this.store, {super.key});

  @override
  Widget build(BuildContext context) {
    final ring = tierRing[store.tier];
    return Container(
        width: 88,
        clipBehavior: Clip.antiAlias,
        decoration: ring == null
            ? _cardBox(14)
            : BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: ring, width: 2),
              ),
        child: Stack(children: [
          Material(
          color: Colors.transparent,
          child: InkWell(
            borderRadius: BorderRadius.circular(14),
            onTap: () => openStore(context, store.id),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(8, 10, 8, 8),
              child: Column(children: [
                StoreAvatar(name: store.name, logo: store.logo, size: 48, radius: 10),
                const SizedBox(height: 6),
                SizedBox(
                  height: 28,
                  child: Text(store.name,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      textAlign: TextAlign.center,
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, height: 1.25)),
                ),
                Text(tr('{productCount} бараа', {'productCount': store.productCount}), style: TextStyle(fontSize: 10.5, color: Colors.grey.shade600)),
              ]),
            ),
          ),
        ),
          TierRibbon(store.tier),
        ]),
      );
  }
}

class _StoreTileSkeleton extends StatelessWidget {
  const _StoreTileSkeleton();
  @override
  Widget build(BuildContext context) => Container(
        width: 88,
        decoration: _cardBox(14),
        padding: const EdgeInsets.fromLTRB(8, 10, 8, 8),
        child: Column(children: [
          _Bone(48, 48, radius: 10),
          const SizedBox(height: 8),
          _Bone(56, 11),
          const SizedBox(height: 6),
          _Bone(36, 9),
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
// 8 барааны showcase (web: CategoryShowcase)

class _CategoryShowcase extends StatelessWidget {
  final List<Product> products;
  final bool loading;
  const _CategoryShowcase({required this.products, required this.loading});

  /// Доорх жагсаалттай ижил бараа картууд; web шиг 10 (бараа цөөн бол 5).
  @override
  Widget build(BuildContext context) {
    if (loading) return const _GridSkeleton(count: 4);
    if (products.length < 5) return const SizedBox.shrink();
    return ProductGrid(products.take(products.length >= 10 ? 10 : 5).toList());
  }
}

class _GridSkeleton extends StatelessWidget {
  final int count;
  const _GridSkeleton({this.count = 6});
  @override
  Widget build(BuildContext context) => GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        padding: EdgeInsets.zero,
        gridDelegate: productGridDelegate(context),
        itemCount: count,
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

/// Header-ийн хонх (вэбийн header шиг): нэвтэрсэн үед л харагдана, уншаагүйн тоотой.
class _NotificationsButton extends StatelessWidget {
  const _NotificationsButton();

  @override
  Widget build(BuildContext context) {
    final signedIn = context.select<ShopState, bool>((s) => s.signedIn);
    if (!signedIn) return const SizedBox.shrink();
    final unread = context.select<ShopState, int>((s) => s.unreadNotifications);
    return IconButton(
      tooltip: tr('Мэдэгдэл'),
      onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ShopNotificationsPage())),
      icon: Badge(
        isLabelVisible: unread > 0,
        label: Text(unread > 99 ? '99+' : '$unread'),
        child: const Icon(Icons.notifications_none),
      ),
    );
  }
}
