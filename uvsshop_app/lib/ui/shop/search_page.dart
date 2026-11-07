import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../api/shop_models.dart';
import '../../state/shop_state.dart';
import '../common.dart';
import 'home_page.dart';

/// Web-ийн /search — хайлт ба ангиллаар үзэх. Хайлт хоосон, ангилал
/// сонгоогүй үед ангиллын жагсаалт; эс бөгөөс барааны үр дүн.
class SearchPage extends StatefulWidget {
  const SearchPage({super.key});
  @override
  State<SearchPage> createState() => _SearchPageState();
}

class _SearchPageState extends State<SearchPage> {
  static const _pageSize = 20;
  final _search = TextEditingController();
  final _scroll = ScrollController();
  Timer? _debounce;

  Category? _category;
  final List<Product> _items = [];
  int _page = 1;
  bool _loading = false;
  bool _hasMore = true;
  Object? _error;
  int _request = 0;

  bool get _browsing => _search.text.trim().isEmpty && _category == null;

  @override
  void initState() {
    super.initState();
    _scroll.addListener(() {
      if (_scroll.hasClients && _scroll.position.pixels > _scroll.position.maxScrollExtent - 600) _loadMore();
    });
  }

  @override
  void dispose() {
    _search.dispose();
    _scroll.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  Future<void> _reload() async {
    _request++;
    setState(() {
      _items.clear();
      _page = 1;
      _hasMore = true;
      _error = null;
      _loading = false;
    });
    if (!_browsing) await _loadMore();
  }

  Future<void> _loadMore() async {
    if (_loading || !_hasMore || _browsing) return;
    final request = _request;
    setState(() => _loading = true);
    try {
      final rows = await context.read<ShopState>().getProducts(
            categoryId: _category?.id,
            search: _search.text,
            page: _page,
            limit: _pageSize,
          );
      if (!mounted || request != _request) return;
      setState(() {
        _items.addAll(rows);
        _page++;
        _hasMore = rows.length >= _pageSize;
      });
    } catch (e) {
      if (mounted && request == _request) setState(() => _error = e);
    } finally {
      if (mounted && request == _request) setState(() => _loading = false);
    }
  }

  void _pick(Category? c) {
    _category = c;
    _reload();
  }

  @override
  Widget build(BuildContext context) {
    final categories = context.watch<ShopState>().categories;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Хайх'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(60),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(12, 0, 12, 10),
            child: TextField(
              controller: _search,
              textInputAction: TextInputAction.search,
              onChanged: (_) {
                setState(() {});
                _debounce?.cancel();
                _debounce = Timer(const Duration(milliseconds: 400), _reload);
              },
              onSubmitted: (_) => _reload(),
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
                        },
                      ),
              ),
            ),
          ),
        ),
      ),
      body: _browsing ? _categoryList(categories) : _results(),
    );
  }

  Widget _categoryList(List<Category> categories) {
    if (categories.isEmpty) return const LoadingView();
    return ListView(padding: const EdgeInsets.all(12), children: [
      const Padding(
        padding: EdgeInsets.fromLTRB(4, 0, 4, 10),
        child: Text('Ангилал', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
      ),
      Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey.shade200),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(children: [
          for (var i = 0; i < categories.length; i++) ...[
            if (i > 0) Divider(height: 1, color: Colors.grey.shade200),
            ListTile(
              leading: categories[i].image == null
                  ? Container(
                      width: 38,
                      height: 38,
                      decoration: BoxDecoration(color: brandColor.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
                      child: const Icon(Icons.category_outlined, size: 20, color: brandColor),
                    )
                  : NetImage(categories[i].image, width: 38, height: 38, radius: BorderRadius.circular(12)),
              title: Text(categories[i].name, style: const TextStyle(fontWeight: FontWeight.w500)),
              trailing: Icon(Icons.chevron_right, color: Colors.grey.shade500),
              onTap: () => _pick(categories[i]),
            ),
          ],
        ]),
      ),
    ]);
  }

  Widget _results() {
    final c = _category;
    return Column(children: [
      if (c != null)
        SizedBox(
          height: 48,
          child: ListView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.fromLTRB(12, 8, 12, 4),
            children: [
              Padding(
                padding: const EdgeInsets.only(right: 8),
                child: InputChip(label: Text(c.name), selected: true, onDeleted: () => _pick(null), showCheckmark: false),
              ),
              for (final sub in c.children)
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ActionChip(label: Text(sub.name), onPressed: () => _pick(sub)),
                ),
            ],
          ),
        ),
      Expanded(child: _grid()),
    ]);
  }

  Widget _grid() {
    if (_items.isEmpty && _loading) return const LoadingView();
    if (_items.isEmpty && _error != null) return ErrorView(_error!, onRetry: _reload);
    if (_items.isEmpty) return const EmptyView(icon: Icons.search_off, text: 'Бараа олдсонгүй');
    return CustomScrollView(controller: _scroll, slivers: [
      SliverPadding(
        padding: const EdgeInsets.all(12),
        sliver: SliverGrid(
          gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
            maxCrossAxisExtent: 220,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 0.62,
          ),
          delegate: SliverChildBuilderDelegate((_, i) => ProductCard(_items[i]), childCount: _items.length),
        ),
      ),
      if (_loading) const SliverToBoxAdapter(child: Padding(padding: EdgeInsets.all(16), child: LoadingView())),
    ]);
  }
}
