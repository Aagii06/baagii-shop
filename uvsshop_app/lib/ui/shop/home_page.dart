import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../api/shop_models.dart';
import '../../state/shop_state.dart';
import '../common.dart';
import 'product_page.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});
  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  static const _pageSize = 20;
  final _scroll = ScrollController();
  final _search = TextEditingController();
  Timer? _debounce;

  Category? _category;
  final List<Product> _items = [];
  int _page = 1;
  bool _loading = false;
  bool _hasMore = true;
  Object? _error;

  @override
  void initState() {
    super.initState();
    _scroll.addListener(() {
      if (_scroll.position.pixels > _scroll.position.maxScrollExtent - 600) _loadMore();
    });
    _reload();
  }

  @override
  void dispose() {
    _scroll.dispose();
    _search.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  Future<void> _reload() async {
    setState(() {
      _items.clear();
      _page = 1;
      _hasMore = true;
      _error = null;
    });
    await _loadMore();
  }

  Future<void> _loadMore() async {
    if (_loading || !_hasMore) return;
    setState(() => _loading = true);
    try {
      final rows = await context.read<ShopState>().getProducts(
            categoryId: _category?.id,
            search: _search.text,
            page: _page,
            limit: _pageSize,
          );
      if (!mounted) return;
      setState(() {
        _items.addAll(rows);
        _page++;
        _hasMore = rows.length >= _pageSize;
      });
    } catch (e) {
      if (mounted) setState(() => _error = e);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _onSearch(String _) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 400), _reload);
  }

  @override
  Widget build(BuildContext context) {
    final categories = context.watch<ShopState>().categories;
    return Scaffold(
      appBar: AppBar(
        title: Image.asset('assets/logo.png', height: 32),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(112),
          child: Column(children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 0, 12, 8),
              child: TextField(
                controller: _search,
                onChanged: _onSearch,
                textInputAction: TextInputAction.search,
                decoration: InputDecoration(
                  hintText: 'Бараа хайх',
                  prefixIcon: const Icon(Icons.search),
                  fillColor: Colors.grey.shade100,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide.none),
                  suffixIcon: _search.text.isEmpty
                      ? null
                      : IconButton(
                          icon: const Icon(Icons.close),
                          onPressed: () {
                            _search.clear();
                            _reload();
                          }),
                ),
              ),
            ),
            SizedBox(
              height: 48,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                children: [
                  _chip('Бүгд', _category == null, () => _pick(null)),
                  for (final c in categories) _chip(c.name, _category?.id == c.id, () => _pick(c)),
                ],
              ),
            ),
          ]),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await context.read<ShopState>().loadCategories();
          await _reload();
        },
        child: _buildBody(),
      ),
    );
  }

  void _pick(Category? c) {
    setState(() => _category = c);
    _reload();
  }

  Widget _chip(String label, bool selected, VoidCallback onTap) => Padding(
        padding: const EdgeInsets.only(right: 8),
        child: ChoiceChip(label: Text(label), selected: selected, onSelected: (_) => onTap(), showCheckmark: false),
      );

  Widget _buildBody() {
    if (_items.isEmpty && _loading) return const LoadingView();
    if (_items.isEmpty && _error != null) return ListView(children: [SizedBox(height: 400, child: ErrorView(_error!, onRetry: _reload))]);
    if (_items.isEmpty) {
      return ListView(children: const [SizedBox(height: 400, child: EmptyView(icon: Icons.search_off, text: 'Бараа олдсонгүй'))]);
    }
    final subs = _category?.children ?? [];
    return CustomScrollView(
      controller: _scroll,
      physics: const AlwaysScrollableScrollPhysics(),
      slivers: [
        if (subs.isNotEmpty)
          SliverToBoxAdapter(
            child: SizedBox(
              height: 44,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.fromLTRB(12, 8, 12, 0),
                children: [
                  for (final c in subs)
                    Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ActionChip(label: Text(c.name), onPressed: () => _pick(c)),
                    ),
                ],
              ),
            ),
          ),
        SliverPadding(
          padding: const EdgeInsets.all(12),
          sliver: SliverGrid(
            gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
              maxCrossAxisExtent: 220,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 0.62,
            ),
            delegate: SliverChildBuilderDelegate((context, i) => ProductCard(_items[i]), childCount: _items.length),
          ),
        ),
        if (_loading) const SliverToBoxAdapter(child: Padding(padding: EdgeInsets.all(16), child: LoadingView())),
        const SliverToBoxAdapter(child: SizedBox(height: 80)),
      ],
    );
  }
}

class ProductCard extends StatelessWidget {
  final Product product;
  const ProductCard(this.product, {super.key});

  @override
  Widget build(BuildContext context) {
    final p = product;
    final soldOut = p.stock != null && p.stock! <= 0;
    return Card(
      clipBehavior: Clip.antiAlias,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => ProductPage(productId: p.id, preview: p))),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          AspectRatio(
            aspectRatio: 1,
            child: Stack(fit: StackFit.expand, children: [
              NetImage(p.image('grid')),
              if (p.discountPercent != null && p.discountPercent! > 0)
                Positioned(
                  left: 8,
                  top: 8,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(color: Colors.red, borderRadius: BorderRadius.circular(6)),
                    child: Text('-${p.discountPercent}%', style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                  ),
                ),
              if (soldOut)
                Container(
                  color: Colors.white60,
                  alignment: Alignment.center,
                  child: const Text('Дууссан', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
            ]),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(10),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(p.name, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w500)),
                if (p.storeName != null)
                  Text(p.storeName!, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                const Spacer(),
                Text(money(p.price), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: brandColor)),
                if (p.originalPrice != null)
                  Text(money(p.originalPrice!),
                      style: TextStyle(fontSize: 12, color: Colors.grey.shade500, decoration: TextDecoration.lineThrough)),
              ]),
            ),
          ),
        ]),
      ),
    );
  }
}
