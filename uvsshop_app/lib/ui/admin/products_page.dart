import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../api/admin_manage_models.dart';
import '../../api/admin_models.dart';
import '../../state/admin_state.dart';
import '../common.dart';
import 'admin_design.dart';
import 'admin_widgets.dart';
import 'dashboard_page.dart' show lowStockThreshold;
import 'product_form_page.dart';
import 'package:uvsshop_app/i18n.dart';

/// web-ийн /products: хайлт, категори шүүлтүүр, гүйлгэхэд цааш ачаална.
class AdminProductsPage extends StatefulWidget {
  const AdminProductsPage({super.key});
  @override
  State<AdminProductsPage> createState() => _AdminProductsPageState();
}

class _AdminProductsPageState extends State<AdminProductsPage> {
  static const _take = 20;
  final _scroll = ScrollController();
  final List<AdminProduct> _rows = [];
  Timer? _debounce;
  String _query = '';
  List<int> _picked = [];
  List<AdminCategory>? _tree;
  // Сонгосон дэлгүүрүүд; хоосон бол бүгд. Зөвхөн админд.
  List<int> _storeIds = [];
  List<Store>? _stores;
  int? _count;
  bool _loading = false;
  Object? _error;
  // Хайлт солигдоход хуучин хариуг хаяна.
  int _version = 0;

  @override
  void initState() {
    super.initState();
    _scroll.addListener(() {
      if (_scroll.position.pixels > _scroll.position.maxScrollExtent - 400) _loadMore();
    });
    _reload();
    final admin = context.read<AdminState>();
    // Алдаа гарвал хоосон жагсаалт — skeleton алга болж, шүүлтүүр харагдахгүй.
    admin.categoryTree().then((t) {
      if (mounted) setState(() => _tree = t);
    }, onError: (_) {
      if (mounted) setState(() => _tree = []);
    });
    if (admin.user?.isAdmin ?? false) {
      admin.stores().then((s) {
        if (mounted) setState(() => _stores = s);
      }, onError: (_) {
        if (mounted) setState(() => _stores = []);
      });
    } else {
      _stores = [];
    }
  }

  @override
  void dispose() {
    _scroll.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  Future<void> _reload() async {
    _version++;
    setState(() {
      _rows.clear();
      _count = null;
      _error = null;
      _loading = false;
    });
    await _loadMore(force: true);
  }

  Future<void> _loadMore({bool force = false}) async {
    if (_loading || (!force && (_count == null || _rows.length >= _count!))) return;
    final version = _version;
    setState(() => _loading = true);
    try {
      final r = await context
          .read<AdminState>()
          .products(
              skip: _rows.length,
              take: _take,
              query: _query,
              categoryIds: _picked,
              storeIds: _storeIds);
      if (!mounted || version != _version) return;
      setState(() {
        _rows.addAll(r.rows.where((n) => !_rows.any((o) => o.id == n.id)));
        _count = r.count;
      });
    } catch (e) {
      if (mounted && version == _version) setState(() => _error = e);
    } finally {
      if (mounted && version == _version) setState(() => _loading = false);
    }
  }

  Map<int, String> get _categoryNames => {for (final c in flattenCategories(_tree ?? [])) c.id: c.name};

  @override
  Widget build(BuildContext context) {
    final names = _categoryNames;
    final ready = _count != null;
    return AdminTabScaffold(
      body: RefreshIndicator(
        onRefresh: _reload,
        child: ListView(controller: _scroll, padding: EdgeInsets.zero, physics: const AlwaysScrollableScrollPhysics(), children: [
          AdminPageHeader(
            title: tr('Бараа'),
            count: ready && _error == null ? _count : null,
            aside: AdminSmallButton(label: tr('Нэмэх'), onPressed: () => _openForm(null)),
            children: [
              if (_stores == null)
                const _FilterBone()
              else if (_stores!.isNotEmpty)
                StoreFilter(
                  stores: _stores!,
                  value: _storeIds,
                  onChanged: (v) {
                    _storeIds = v;
                    _reload();
                  },
                ),
              TextField(
                onChanged: (v) {
                  _debounce?.cancel();
                  _debounce = Timer(const Duration(milliseconds: 300), () {
                    _query = v;
                    _reload();
                  });
                },
                textInputAction: TextInputAction.search,
                decoration: adminSearchDecoration(tr('Бараа хайх')),
              ),
              if (_tree == null)
                const _FilterBone()
              else if (_tree!.isNotEmpty)
                CategoryFilter(
                  tree: _tree!,
                  value: _picked,
                  onChanged: (v) {
                    _picked = v;
                    _reload();
                  },
                ),
            ],
          ),
          if (!ready && _error == null)
            const LoadingView(count: 6)
          else if (_error != null && _rows.isEmpty)
            Padding(padding: const EdgeInsets.only(top: 16), child: ErrorView(_error!, onRetry: _reload))
          else if (_rows.isEmpty)
            Padding(
              padding: EdgeInsets.only(top: 40),
              child: EmptyView(icon: Icons.search_off, text: tr('Бараа олдсонгүй\nХайлт эсвэл категориа өөрчилж үзнэ үү.')),
            )
          else ...[
            AdminList(children: [for (final p in _rows) _row(p, names)]),
            if (_rows.length < (_count ?? 0))
              _error != null && !_loading
                  ? Padding(padding: const EdgeInsets.all(16), child: Center(child: OutlinedButton(onPressed: _loadMore, child: Text(tr('Дахин оролдох')))))
                  : const LoadingView(count: 2),
          ],
        ]),
      ),
    );
  }

  /// Логогүй дэлгүүрийн 2 үсэг: эхний хоёр үгийн эхний үсэг ("Номин Супермаркет" → "НС"),
  /// нэг үгтэй бол эхний 2 үсэг ("Alpha" → "AL").
  static String _storeInitials(String name) {
    final words = name.split(RegExp(r'\s+')).map((w) => w.replaceAll(RegExp(r'[^\p{L}\p{N}]', unicode: true), '')).where((w) => w.isNotEmpty).toList();
    if (words.isEmpty) return '?';
    final letters = words.length >= 2 ? words[0].characters.first + words[1].characters.first : words[0].characters.take(2).toString();
    return letters.toUpperCase();
  }

  Widget _row(AdminProduct p, Map<int, String> names) {
    final category = p.categoryId == null ? '' : names[p.categoryId] ?? '';
    final store = p.storeName?.trim() ?? '';
    final logo = store.isEmpty ? null : _stores?.where((s) => s.name == store).firstOrNull?.logo;
    final (String stock, Color stockColor) = !p.isActive
        ? (tr('Ноорог'), AdminColors.mutedForeground.withValues(alpha: 0.7))
        : (tr('{remain} нөөц', {'remain': p.remain}), p.remain <= lowStockThreshold ? AdminColors.destructive : AdminColors.mutedForeground);
    return InkWell(
      onTap: () => _openForm(p.id),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(children: [
          // Дэлгүүрийн лого зургийн буланд, нэр нь тусдаа мөрөнд (admin web-тэй адил).
          Stack(clipBehavior: Clip.none, children: [
            ImageBox(fileId: p.images.isEmpty ? null : p.images.first, size: 52),
            if (store.isNotEmpty)
              Positioned(
                right: -4,
                bottom: -4,
                // Лого дугуйг бүтэн дүүргэнэ — хүрээ, зайгүй.
                child: logo != null
                    ? ImageBox(fileId: logo, size: 28, circle: true)
                    : Container(
                        width: 28,
                        height: 28,
                        alignment: Alignment.center,
                        decoration: const BoxDecoration(color: AdminColors.primary, shape: BoxShape.circle),
                        child: Text(_storeInitials(store),
                            style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold, height: 1, letterSpacing: -0.3)),
                      ),
              ),
          ]),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(p.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
              if (store.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 2),
                  child: Row(children: [
                    const Icon(Icons.storefront_outlined, size: 13, color: AdminColors.mutedForeground),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(store,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: AdminColors.foreground.withValues(alpha: 0.8))),
                    ),
                  ]),
                ),
              if (category.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 2),
                  child: Text(category,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontFamily: mono, fontSize: 12, color: AdminColors.mutedForeground)),
                ),
              if (p.createdAt != null)
                Padding(
                  padding: const EdgeInsets.only(top: 2),
                  child: Text(formatDate(p.createdAt),
                      style: TextStyle(fontFamily: mono, fontSize: 11, color: AdminColors.mutedForeground.withValues(alpha: 0.7))),
                ),
            ]),
          ),
          const SizedBox(width: 12),
          Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
            Text(mnt(p.price), style: const TextStyle(fontFamily: mono, fontSize: 14, fontWeight: FontWeight.bold)),
            const SizedBox(height: 2),
            Text(stock, style: TextStyle(fontSize: 12, color: stockColor)),
          ]),
        ]),
      ),
    );
  }

  /// Бараа нэмэх ([id] null) эсвэл засах маягт; хадгалсан/устгасан бол жагсаалтыг шинэчилнэ.
  Future<void> _openForm(int? id) async {
    final changed = await Navigator.of(context).push<bool>(MaterialPageRoute(builder: (_) => ProductFormPage(productId: id)));
    if (changed == true) _reload();
  }
}

/// web-ийн CategoryFilter: мод бүтэцтэй sheet-ээс олон категори сонгоно.
/// Категори сонгоход доорх бүгд сонгогдоно. Хоосон бол бүх категори.
class CategoryFilter extends StatelessWidget {
  final List<AdminCategory> tree;
  final List<int> value;
  final ValueChanged<List<int>> onChanged;
  const CategoryFilter({super.key, required this.tree, required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    final flat = flattenCategories(tree);
    final picked = value.toSet();
    final names = flat.where((c) => picked.contains(c.id) && !(c.parentId != null && picked.contains(c.parentId))).map((c) => c.name).toList();
    final label = names.isEmpty ? tr('Бүх категори') : (names.length <= 2 ? names.join(', ') : tr('{names} категори', {'names': names.length}));
    return Material(
      color: Colors.white,
      shape: StadiumBorder(side: BorderSide(color: names.isEmpty ? AdminColors.border : AdminColors.primary.withValues(alpha: 0.5))),
      child: InkWell(
        customBorder: const StadiumBorder(),
        onTap: () async {
          final next = await showModalBottomSheet<List<int>>(
            context: context,
            isScrollControlled: true,
            showDragHandle: true,
            builder: (_) => _TreeSheet(flat: flat, value: value),
          );
          if (next != null) onChanged(next);
        },
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          child: Row(children: [
            Expanded(
              child: Text(label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 15,
                    color: names.isEmpty ? AdminColors.mutedForeground : AdminColors.foreground,
                    fontWeight: names.isEmpty ? null : FontWeight.w600,
                  )),
            ),
            const Icon(Icons.keyboard_arrow_down, size: 18, color: AdminColors.mutedForeground),
          ]),
        ),
      ),
    );
  }
}

class _TreeSheet extends StatefulWidget {
  final List<AdminCategory> flat;
  final List<int> value;
  const _TreeSheet({required this.flat, required this.value});
  @override
  State<_TreeSheet> createState() => _TreeSheetState();
}

class _TreeSheetState extends State<_TreeSheet> {
  late final Set<int> _picked = widget.value.toSet();
  String _q = '';
  late final Map<int, int?> _parentOf = {for (final c in widget.flat) c.id: c.parentId};
  // Эцэг категориуд хураалттай эхэлнэ — аль хэдийн сонгосон категорийн дээрхүүд л нээлттэй.
  late final Set<int> _open = {
    for (final id in widget.value)
      for (var p = _parentOf[id]; p != null; p = _parentOf[p]) p,
  };

  bool _visible(AdminCategory c) {
    for (var p = c.parentId; p != null; p = _parentOf[p]) {
      if (!_open.contains(p)) return false;
    }
    return true;
  }

  List<int> _subtree(AdminCategory c) => [c.id, for (final ch in c.children) ..._subtree(ch)];

  bool? _stateOf(AdminCategory c) {
    final ids = _subtree(c);
    final n = ids.where(_picked.contains).length;
    return n == ids.length ? true : (n > 0 ? null : false);
  }

  void _toggle(AdminCategory c) => setState(() {
        final on = _stateOf(c) != true;
        for (final id in _subtree(c)) {
          on ? _picked.add(id) : _picked.remove(id);
        }
        // Бүх хүүхэд нь сонгогдсон эцэг ч сонгогдоно.
        for (final p in widget.flat.reversed) {
          if (p.children.isEmpty) continue;
          if (p.children.every((ch) => _picked.contains(ch.id))) {
            _picked.add(p.id);
          } else {
            _picked.remove(p.id);
          }
        }
      });

  @override
  Widget build(BuildContext context) {
    final q = _q.trim().toLowerCase();
    final rows = q.isEmpty ? widget.flat.where(_visible).toList() : widget.flat.where((c) => c.name.toLowerCase().contains(q)).toList();
    return ConstrainedBox(
      constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(context).height * 0.85),
      child: Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Padding(
            padding: EdgeInsets.fromLTRB(20, 0, 20, 8),
            child: Text(tr('Категори'), style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          ),
          if (widget.flat.length >= 12)
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
              child: TextField(onChanged: (v) => setState(() => _q = v), decoration: adminSearchDecoration(tr('Хайх'), icon: Icons.search)),
            ),
          Flexible(
            child: ListView(shrinkWrap: true, children: [
              for (final c in rows)
                CheckboxListTile(
                  tristate: true,
                  value: _stateOf(c),
                  onChanged: (_) => _toggle(c),
                  controlAffinity: ListTileControlAffinity.leading,
                  contentPadding: EdgeInsets.only(left: 12 + (q.isEmpty ? c.depth * 20.0 : 0), right: 4),
                  title: Text(c.name, style: TextStyle(fontWeight: c.depth == 0 ? FontWeight.bold : FontWeight.w500)),
                  // Эцэг категорийг хураах / дэлгэх (мөрийг дарвал сонгоно)
                  secondary: c.children.isEmpty || q.isNotEmpty
                      ? null
                      : IconButton(
                          tooltip: _open.contains(c.id) ? tr('Хураах') : tr('Дэлгэх'),
                          onPressed: () => setState(() => _open.contains(c.id) ? _open.remove(c.id) : _open.add(c.id)),
                          icon: AnimatedRotation(
                            turns: _open.contains(c.id) ? 0.25 : 0,
                            duration: const Duration(milliseconds: 150),
                            child: const Icon(Icons.chevron_right, color: AdminColors.mutedForeground),
                          ),
                        ),
                ),
            ]),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
            child: Row(children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: _picked.isEmpty ? null : () => setState(_picked.clear),
                  child: Text(tr('Цэвэрлэх')),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(child: FilledButton(onPressed: () => Navigator.pop(context, _picked.toList()), child: Text(tr('Болсон')))),
            ]),
          ),
        ]),
      ),
    );
  }
}

/// Дэлгүүрээр шүүх (CategoryFilter шиг): товч дээр сонгосон нь, доороос гарах жагсаалтад лого,
/// нэртэй олныг нь сонгоно. Хоосон — бүгд.
class StoreFilter extends StatelessWidget {
  final List<Store> stores;
  final List<int> value;
  final ValueChanged<List<int>> onChanged;
  const StoreFilter({super.key, required this.stores, required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    final names = [
      for (final s in stores)
        if (value.contains(s.id)) s.name,
    ];
    final label = names.isEmpty ? tr('Бүх дэлгүүр') : (names.length <= 2 ? names.join(', ') : tr('{n} дэлгүүр', {'n': names.length}));
    return Material(
      color: Colors.white,
      shape: StadiumBorder(side: BorderSide(color: names.isEmpty ? AdminColors.border : AdminColors.primary.withValues(alpha: 0.5))),
      child: InkWell(
        customBorder: const StadiumBorder(),
        onTap: () async {
          final next = await showModalBottomSheet<List<int>>(
            context: context,
            isScrollControlled: true,
            showDragHandle: true,
            builder: (_) => _StoreSheet(stores: stores, value: value),
          );
          if (next != null) onChanged(next);
        },
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          child: Row(children: [
            const Icon(Icons.storefront_outlined, size: 18, color: AdminColors.mutedForeground),
            const SizedBox(width: 8),
            Expanded(
              child: Text(label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 15,
                    color: names.isEmpty ? AdminColors.mutedForeground : AdminColors.foreground,
                    fontWeight: names.isEmpty ? null : FontWeight.w600,
                  )),
            ),
            const Icon(Icons.keyboard_arrow_down, size: 18, color: AdminColors.mutedForeground),
          ]),
        ),
      ),
    );
  }
}

class _StoreSheet extends StatefulWidget {
  final List<Store> stores;
  final List<int> value;
  const _StoreSheet({required this.stores, required this.value});
  @override
  State<_StoreSheet> createState() => _StoreSheetState();
}

class _StoreSheetState extends State<_StoreSheet> {
  late final Set<int> _picked = widget.value.toSet();
  String _q = '';

  void _toggle(int id) => setState(() => _picked.contains(id) ? _picked.remove(id) : _picked.add(id));

  Widget _tile(int id, String name, Widget leading) => CheckboxListTile(
        value: _picked.contains(id),
        onChanged: (_) => _toggle(id),
        controlAffinity: ListTileControlAffinity.trailing,
        contentPadding: const EdgeInsets.symmetric(horizontal: 20),
        secondary: leading,
        title: Text(name, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w600)),
      );

  @override
  Widget build(BuildContext context) {
    final q = _q.trim().toLowerCase();
    final rows = q.isEmpty ? widget.stores : widget.stores.where((s) => s.name.toLowerCase().contains(q)).toList();
    return ConstrainedBox(
      constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(context).height * 0.85),
      child: Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Padding(
            padding: EdgeInsets.fromLTRB(20, 0, 20, 8),
            child: Text(tr('Дэлгүүр'), style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          ),
          if (widget.stores.length >= 8)
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
              child: TextField(onChanged: (v) => setState(() => _q = v), decoration: adminSearchDecoration(tr('Хайх'), icon: Icons.search)),
            ),
          Flexible(
            child: ListView(shrinkWrap: true, children: [
              for (final s in rows) _tile(s.id, s.name, ImageBox(fileId: s.logo, size: 36, placeholder: Icons.storefront_outlined)),
            ]),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
            child: Row(children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: _picked.isEmpty ? null : () => setState(_picked.clear),
                  child: Text(tr('Цэвэрлэх')),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(child: FilledButton(onPressed: () => Navigator.pop(context, _picked.toList()), child: Text(tr('Болсон')))),
            ]),
          ),
        ]),
      ),
    );
  }
}

/// Шүүлтүүрийн товчны хэлбэр — сонголтууд ачаалагдах хооронд (толгой үсрэхгүй).
class _FilterBone extends StatelessWidget {
  const _FilterBone();

  @override
  Widget build(BuildContext context) => Pulse(
        child: Container(
          height: 50,
          padding: const EdgeInsets.symmetric(horizontal: 20),
          decoration: ShapeDecoration(color: Colors.white, shape: StadiumBorder(side: BorderSide(color: AdminColors.border))),
          child: const Row(children: [Bone(width: 130), Spacer(), Bone(width: 16, height: 16, radius: 8)]),
        ),
      );
}
