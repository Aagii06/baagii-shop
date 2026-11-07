import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../api/shop_models.dart';
import '../../state/shop_nav.dart';
import '../../state/shop_state.dart';
import '../common.dart';
import 'home_page.dart' show byNewest;
import 'product_card.dart';

/// Шүүлтүүр — web-ийн FilterSidebar / MobileFilterDrawer.
class _Filters {
  final Set<int> categories;
  final Set<String> stores;
  final RangeValues? price;
  const _Filters({this.categories = const {}, this.stores = const {}, this.price});

  _Filters copyWith({Set<int>? categories, Set<String>? stores, RangeValues? price, bool clearPrice = false}) => _Filters(
        categories: categories ?? this.categories,
        stores: stores ?? this.stores,
        price: clearPrice ? null : price ?? this.price,
      );
}

/// web-ийн /search: дэлгүүрийн tile-ууд, гарчиг + илэрцийн тоо, эрэмбэлэх,
/// шүүлтүүр, барааны grid (20-оор, гүйлгэхэд нэмэгдэнэ).
class SearchPage extends StatefulWidget {
  const SearchPage({super.key});
  @override
  State<SearchPage> createState() => _SearchPageState();
}

class _SearchPageState extends State<SearchPage> {
  static const _pageSize = 20;
  static const _autoPages = 3;

  final _search = TextEditingController();
  final _scroll = ScrollController();
  Timer? _debounce;
  ShopNav? _nav;

  List<Product> _products = [];
  List<Store> _allStores = [];
  bool _loading = true;
  int _request = 0;
  int _page = 1;

  _Filters _filters = const _Filters();
  bool _saleOnly = false;
  SearchSort _sort = SearchSort.discount;
  String _fetchedKey = '';

  @override
  void initState() {
    super.initState();
    _scroll.addListener(_onScroll);
    context.read<ShopState>().getStores().then((s) {
      if (mounted) setState(() => _allStores = s);
    }).catchError((_) {});
    _fetch();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final nav = context.read<ShopNav>();
    if (_nav != nav) {
      _nav?.removeListener(_onNav);
      _nav = nav..addListener(_onNav);
      _onNav();
    }
  }

  @override
  void dispose() {
    _nav?.removeListener(_onNav);
    _search.dispose();
    _scroll.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  /// Нүүр хуудас г.м.-ээс шүүлтүүртэй нээх хүсэлт.
  void _onNav() {
    final r = _nav?.takeSearch();
    if (r == null) return;
    _search.text = r.query ?? '';
    setState(() {
      _saleOnly = r.sale;
      _sort = r.sort ?? SearchSort.discount;
      _filters = _Filters(
        categories: r.categoryId == null ? {} : {r.categoryId!},
        stores: r.store == null ? {} : {r.store!},
      );
      _page = 1;
    });
    if (_scroll.hasClients) _scroll.jumpTo(0);
    _fetch();
  }

  void _onScroll() {
    if (!_scroll.hasClients || _loading) return;
    if (_scroll.position.pixels > _scroll.position.maxScrollExtent - 400 && _page < _autoPages && _visibleCount < _filtered.length) {
      setState(() => _page++);
    }
  }

  /// Сонгосон ангиллууд ба тэдгээрийн бүх дэд ангилал.
  Set<int> _categoryIds() {
    final tree = context.read<ShopState>().categories;
    return {
      for (final id in _filters.categories) ...(Category.findById(tree, id)?.allIds ?? {id}),
    };
  }

  Future<void> _fetch() async {
    final ids = _categoryIds();
    final key = '${(ids.toList()..sort()).join(',')}|${_search.text.trim()}';
    if (key == _fetchedKey && !_loading) return;
    _fetchedKey = key;
    final request = ++_request;
    setState(() => _loading = true);
    try {
      final rows = await context.read<ShopState>().getAllProducts(categoryIds: ids, search: _search.text.trim());
      if (!mounted || request != _request) return;
      setState(() {
        _products = rows;
        _page = 1;
        _filters = _filters.copyWith(clearPrice: true);
      });
    } catch (_) {
      if (mounted && request == _request) setState(() => _products = []);
    } finally {
      if (mounted && request == _request) setState(() => _loading = false);
    }
  }

  RangeValues get _bounds {
    if (_products.isEmpty) return const RangeValues(0, 0);
    final prices = _products.map((p) => p.price);
    return RangeValues(prices.reduce((a, b) => a < b ? a : b), prices.reduce((a, b) => a > b ? a : b));
  }

  /// Дэлгүүр → бараа тоо (бүх дэлгүүр, илэрцэд байхгүй ч 0-тэй).
  Map<String, int> get _storeCounts {
    final m = <String, int>{for (final s in _allStores) s.name: 0};
    for (final p in _products) {
      if (p.storeName != null) m[p.storeName!] = (m[p.storeName!] ?? 0) + 1;
    }
    return m;
  }

  Map<String, String?> get _storeLogos => {
        for (final p in _products)
          if (p.storeName != null) p.storeName!: p.storeLogo,
        for (final s in _allStores) s.name: s.logo,
      };

  List<Product> get _filtered {
    var r = _products.toList();
    if (_saleOnly) r = r.where((p) => p.onSale).toList();
    if (_filters.stores.isNotEmpty) r = r.where((p) => _filters.stores.contains(p.storeName)).toList();
    final price = _filters.price;
    if (price != null) r = r.where((p) => p.price >= price.start && p.price <= price.end).toList();
    switch (_sort) {
      case SearchSort.newest:
        r.sort(byNewest);
      case SearchSort.priceAsc:
        r.sort((a, b) => a.price.compareTo(b.price));
      case SearchSort.rating:
        break;
      case SearchSort.discount:
        r.sort((a, b) => (b.onSale ? b.discountPercent ?? 0 : 0).compareTo(a.onSale ? a.discountPercent ?? 0 : 0));
    }
    return r;
  }

  int get _visibleCount => _page * _pageSize;

  /// Дэлгүүрийн tile: тэр дэлгүүрийн бүх бараа (бусад шүүлт цэвэрлэгдэнэ); дахин дарвал цуцална.
  void _selectStore(String? store) {
    _search.clear();
    setState(() {
      _filters = _Filters(stores: store == null ? {} : {store});
      _saleOnly = false;
      _page = 1;
    });
    _fetch();
  }

  int get _activeFilterCount =>
      _filters.categories.length + _filters.stores.length + (_filters.price != null ? 1 : 0);

  @override
  Widget build(BuildContext context) {
    final categories = context.watch<ShopState>().categories;
    final filtered = _filtered;
    final visible = filtered.take(_visibleCount).toList();
    final hasMore = visible.length < filtered.length;
    final activeCategory = _filters.categories.length == 1 ? Category.findById(categories, _filters.categories.first) : null;
    final title = _search.text.trim().isNotEmpty
        ? '«${_search.text.trim()}»'
        : activeCategory?.name ?? (_saleOnly ? 'Хямдрал' : 'Бүх бараа');
    final pickedStore = _filters.stores.length == 1 ? _filters.stores.first : null;
    final counts = _storeCounts;
    final storeNames = counts.keys.toList()..sort((a, b) => counts[b]!.compareTo(counts[a]!));
    final logos = _storeLogos;

    return Scaffold(
      backgroundColor: const Color(0xFFFAFAFB),
      appBar: AppBar(
        titleSpacing: 12,
        title: TextField(
          controller: _search,
          textInputAction: TextInputAction.search,
          onChanged: (_) {
            setState(() {});
            _debounce?.cancel();
            _debounce = Timer(const Duration(milliseconds: 500), _fetch);
          },
          onSubmitted: (_) => _fetch(),
          decoration: InputDecoration(
            hintText: 'Бараа хайх',
            isDense: true,
            prefixIcon: const Icon(Icons.search),
            fillColor: Colors.white,
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: brandColor, width: 2)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: brandColor, width: 2)),
            suffixIcon: _search.text.isEmpty
                ? null
                : IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () {
                      _search.clear();
                      setState(() {});
                      _fetch();
                    },
                  ),
          ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          _fetchedKey = '';
          await _fetch();
        },
        child: CustomScrollView(controller: _scroll, physics: const AlwaysScrollableScrollPhysics(), slivers: [
          if (storeNames.isNotEmpty)
            SliverToBoxAdapter(
              child: SizedBox(
                height: 128,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                  itemCount: storeNames.length,
                  separatorBuilder: (_, _) => const SizedBox(width: 10),
                  itemBuilder: (_, i) {
                    final name = storeNames[i];
                    final active = name == pickedStore;
                    return InkWell(
                      borderRadius: BorderRadius.circular(16),
                      onTap: () => _selectStore(active ? null : name),
                      child: Container(
                        width: 96,
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: active ? brandColor : borderColor, width: 2),
                        ),
                        child: Column(children: [
                          Opacity(opacity: active ? 1 : 0.85, child: StoreAvatar(name: name, logo: logos[name], size: 52, radius: 12)),
                          const SizedBox(height: 6),
                          Text(name,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: active ? brandColor : Colors.black87)),
                          Text('${counts[name]}', style: TextStyle(fontSize: 11, color: Colors.grey.shade600)),
                        ]),
                      ),
                    );
                  },
                ),
              ),
            ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 20, 16, 12),
            sliver: SliverToBoxAdapter(
              child: Text.rich(TextSpan(children: [
                TextSpan(text: '$title ', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                if (!_loading)
                  TextSpan(text: '${filtered.length} бараа олдлоо', style: TextStyle(fontSize: 15, color: Colors.grey.shade600)),
              ])),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            sliver: SliverToBoxAdapter(
              child: Row(children: [
                if (pickedStore != null) ...[
                  StoreAvatar(name: pickedStore, logo: logos[pickedStore], size: 40, radius: 12),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(pickedStore,
                        maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
                  ),
                ] else
                  const Spacer(),
                const SizedBox(width: 8),
                _SortMenu(value: _sort, onChanged: (s) => setState(() {
                      _sort = s;
                      _page = 1;
                    })),
                const SizedBox(width: 8),
                _FilterButton(
                  count: _activeFilterCount,
                  onTap: () => _openFilters(categories, storeNames, logos),
                ),
              ]),
            ),
          ),
          if (_loading)
            const SliverFillRemaining(hasScrollBody: false, child: Padding(padding: EdgeInsets.all(40), child: LoadingView()))
          else if (visible.isEmpty)
            const SliverFillRemaining(hasScrollBody: false, child: EmptyView(icon: Icons.search_off, text: 'Бараа олдсонгүй'))
          else
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              sliver: SliverGrid(
                gridDelegate: productGridDelegate,
                delegate: SliverChildBuilderDelegate((_, i) => ProductCard(visible[i]), childCount: visible.length),
              ),
            ),
          if (!_loading && hasMore && _page >= _autoPages)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(children: [
                  Text('${filtered.length}-аас ${visible.length} бараа харуулж байна', style: TextStyle(color: Colors.grey.shade600)),
                  const SizedBox(height: 8),
                  OutlinedButton(
                    style: OutlinedButton.styleFrom(minimumSize: const Size(192, 44)),
                    onPressed: () => setState(() => _page++),
                    child: const Text('Цааш үзэх'),
                  ),
                ]),
              ),
            ),
          const SliverToBoxAdapter(child: SizedBox(height: 32)),
        ]),
      ),
    );
  }

  Future<void> _openFilters(List<Category> categories, List<String> stores, Map<String, String?> logos) async {
    final result = await showModalBottomSheet<_Filters>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (_) => _FilterSheet(
        initial: _filters,
        categories: categories,
        stores: stores,
        logos: logos,
        bounds: _bounds,
      ),
    );
    if (result == null) return;
    final categoriesChanged = result.categories.length != _filters.categories.length || !result.categories.containsAll(_filters.categories);
    setState(() {
      _filters = result;
      _page = 1;
    });
    if (categoriesChanged) _fetch();
  }
}

class _SortMenu extends StatelessWidget {
  final SearchSort value;
  final ValueChanged<SearchSort> onChanged;
  const _SortMenu({required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) => PopupMenuButton<SearchSort>(
        initialValue: value,
        onSelected: onChanged,
        position: PopupMenuPosition.under,
        itemBuilder: (_) => [for (final s in SearchSort.values) PopupMenuItem(value: s, child: Text(searchSortLabel[s]!))],
        child: Container(
          height: 40,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: borderColor)),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            Text(searchSortLabel[value]!, style: const TextStyle(fontSize: 13.5)),
            const SizedBox(width: 4),
            Icon(Icons.expand_more, size: 18, color: Colors.grey.shade600),
          ]),
        ),
      );
}

class _FilterButton extends StatelessWidget {
  final int count;
  final VoidCallback onTap;
  const _FilterButton({required this.count, required this.onTap});

  @override
  Widget build(BuildContext context) => InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: Container(
          height: 40,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: borderColor)),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            const Icon(Icons.tune, size: 18),
            const SizedBox(width: 6),
            const Text('Шүүлтүүр', style: TextStyle(fontSize: 13.5)),
            if (count > 0) ...[
              const SizedBox(width: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                decoration: BoxDecoration(color: brandColor, borderRadius: BorderRadius.circular(10)),
                child: Text('$count', style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
              ),
            ],
          ]),
        ),
      );
}

class _FilterSheet extends StatefulWidget {
  final _Filters initial;
  final List<Category> categories;
  final List<String> stores;
  final Map<String, String?> logos;
  final RangeValues bounds;
  const _FilterSheet({
    required this.initial,
    required this.categories,
    required this.stores,
    required this.logos,
    required this.bounds,
  });
  @override
  State<_FilterSheet> createState() => _FilterSheetState();
}

class _FilterSheetState extends State<_FilterSheet> {
  late _Filters _f = widget.initial;
  final Set<int> _open = {};

  void _toggleCategory(int id) {
    final next = {..._f.categories};
    next.contains(id) ? next.remove(id) : next.add(id);
    setState(() => _f = _f.copyWith(categories: next));
  }

  void _toggleStore(String s) {
    final next = {..._f.stores};
    next.contains(s) ? next.remove(s) : next.add(s);
    setState(() => _f = _f.copyWith(stores: next));
  }

  Widget _pick(String label, bool picked, VoidCallback onTap, {Widget? leading, bool sub = false}) => InkWell(
        onTap: onTap,
        child: Padding(
          padding: EdgeInsets.symmetric(vertical: sub ? 8 : 11),
          child: Row(children: [
            if (leading != null) ...[leading, const SizedBox(width: 10)],
            Expanded(
              child: Text(label,
                  style: TextStyle(
                      fontSize: sub ? 14 : 15,
                      color: picked ? brandColor : Colors.black87,
                      fontWeight: picked ? FontWeight.w600 : FontWeight.normal)),
            ),
            if (picked) const Icon(Icons.check, size: 18, color: brandColor),
          ]),
        ),
      );

  Widget _category(Category c, {int depth = 0}) {
    if (c.children.isEmpty) {
      return _pick(c.name, _f.categories.contains(c.id), () => _toggleCategory(c.id), sub: depth > 0);
    }
    final open = _open.contains(c.id);
    final anyPicked = c.allIds.any(_f.categories.contains);
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      InkWell(
        onTap: () => setState(() => open ? _open.remove(c.id) : _open.add(c.id)),
        child: Padding(
          padding: EdgeInsets.symmetric(vertical: depth > 0 ? 8 : 11),
          child: Row(children: [
            Expanded(
              child: Text(c.name,
                  style: TextStyle(
                      fontSize: depth > 0 ? 14 : 15,
                      color: anyPicked ? brandColor : Colors.black87,
                      fontWeight: anyPicked ? FontWeight.w600 : FontWeight.normal)),
            ),
            AnimatedRotation(turns: open ? 0.5 : 0, duration: const Duration(milliseconds: 150), child: const Icon(Icons.expand_more)),
          ]),
        ),
      ),
      if (open)
        Container(
          margin: const EdgeInsets.only(left: 4, bottom: 8),
          padding: const EdgeInsets.only(left: 16),
          decoration: const BoxDecoration(border: Border(left: BorderSide(color: borderColor, width: 2))),
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            _pick('Бүгд', _f.categories.contains(c.id), () => _toggleCategory(c.id), sub: true),
            for (final child in c.children) _category(child, depth: depth + 1),
          ]),
        ),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    final b = widget.bounds;
    final price = _f.price ?? b;
    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.85,
      maxChildSize: 0.95,
      builder: (context, scroll) => Column(children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 14, 8, 6),
          child: Row(children: [
            const Expanded(child: Text('Шүүлтүүр', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold))),
            IconButton(tooltip: 'Хаах', onPressed: () => Navigator.pop(context), icon: const Icon(Icons.close)),
          ]),
        ),
        const Divider(height: 1),
        Expanded(
          child: ListView(controller: scroll, padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12), children: [
            const Text('Ангилал', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
            _pick('Бүх бараа', _f.categories.isEmpty, () => setState(() => _f = _f.copyWith(categories: {}))),
            for (final c in widget.categories) _category(c),
            if (widget.stores.isNotEmpty) ...[
              const Divider(height: 24),
              const Text('Дэлгүүрүүд', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
              for (final s in widget.stores)
                _pick(s, _f.stores.contains(s), () => _toggleStore(s),
                    leading: StoreAvatar(name: s, logo: widget.logos[s], size: 24, radius: 6)),
            ],
            if (b.end > b.start) ...[
              const Divider(height: 24),
              const Text('Үнийн хязгаар', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              RangeSlider(
                min: b.start,
                max: b.end,
                values: RangeValues(price.start.clamp(b.start, b.end), price.end.clamp(b.start, b.end)),
                onChanged: (v) => setState(() => _f = _f.copyWith(price: v)),
              ),
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Text(money(price.start)),
                Text(money(price.end)),
              ]),
            ],
          ]),
        ),
        SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
            child: FilledButton(
              style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
              onPressed: () => Navigator.pop(context, _f),
              child: const Text('Илэрц харах'),
            ),
          ),
        ),
      ]),
    );
  }
}
