import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../api/admin_models.dart';
import '../../state/admin_state.dart';
import '../common.dart';
import 'admin_shell.dart';

/// Үлдэгдэл энэ тооноос бага бол "дуусах дөхсөн" гэж тэмдэглэнэ.
const _lowStock = 5;

class AdminProductsPage extends StatefulWidget {
  const AdminProductsPage({super.key});
  @override
  State<AdminProductsPage> createState() => _AdminProductsPageState();
}

class _AdminProductsPageState extends State<AdminProductsPage> {
  static const _take = 30;
  final _scroll = ScrollController();
  final List<AdminProduct> _rows = [];
  String _query = '';
  int _count = 0;
  bool _loading = false;
  Object? _error;

  @override
  void initState() {
    super.initState();
    _scroll.addListener(() {
      if (_scroll.position.pixels > _scroll.position.maxScrollExtent - 400) _loadMore();
    });
    _reload();
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  Future<void> _reload() async {
    setState(() {
      _rows.clear();
      _count = 0;
      _error = null;
    });
    await _loadMore(force: true);
  }

  Future<void> _loadMore({bool force = false}) async {
    if (_loading || (!force && _rows.length >= _count)) return;
    setState(() => _loading = true);
    try {
      final r = await context.read<AdminState>().products(skip: _rows.length, take: _take);
      if (!mounted) return;
      setState(() {
        _rows.addAll(r.rows);
        _count = r.count;
      });
    } catch (e) {
      if (mounted) setState(() => _error = e);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final q = _query.toLowerCase();
    final rows = q.isEmpty ? _rows : _rows.where((p) => p.name.toLowerCase().contains(q)).toList();
    return Scaffold(
      appBar: AppBar(
        title: Text(_count > 0 ? 'Бараа ($_count)' : 'Бараа'),
        actions: const [VisitShopButton()],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(56),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(12, 0, 12, 8),
            child: TextField(
              onChanged: (v) => setState(() => _query = v),
              decoration: InputDecoration(
                hintText: 'Ачаалсан бараанаас хайх',
                prefixIcon: const Icon(Icons.search),
                fillColor: Colors.grey.shade100,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide.none),
              ),
            ),
          ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _reload,
        child: _rows.isEmpty && _loading
            ? const LoadingView()
            : _rows.isEmpty && _error != null
                ? ListView(children: [SizedBox(height: 400, child: ErrorView(_error!, onRetry: _reload))])
                : rows.isEmpty
                    ? ListView(children: const [SizedBox(height: 400, child: EmptyView(icon: Icons.inventory_2_outlined, text: 'Бараа алга'))])
                    : ListView.separated(
                        controller: _scroll,
                        physics: const AlwaysScrollableScrollPhysics(),
                        padding: const EdgeInsets.all(12),
                        itemCount: rows.length + (_loading ? 1 : 0),
                        separatorBuilder: (_, _) => const SizedBox(height: 8),
                        itemBuilder: (context, i) {
                          if (i >= rows.length) return const Padding(padding: EdgeInsets.all(16), child: LoadingView());
                          return _tile(rows[i]);
                        },
                      ),
      ),
    );
  }

  Widget _tile(AdminProduct p) {
    final stockColor = p.remain <= 0 ? Colors.red : (p.remain <= _lowStock ? Colors.orange : Colors.green);
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ExpansionTile(
        shape: const Border(),
        leading: NetImage(p.image, width: 52, height: 52, radius: BorderRadius.circular(8)),
        title: Text(p.name, maxLines: 2, overflow: TextOverflow.ellipsis),
        subtitle: Row(children: [
          Text(money(p.price), style: const TextStyle(fontWeight: FontWeight.w600, color: brandColor)),
          const SizedBox(width: 8),
          StatusChip('Үлд: ${p.remain}', stockColor),
          const SizedBox(width: 6),
          if (!p.isActive) StatusChip(p.status == 'draft' ? 'Ноорог' : 'Идэвхгүй', Colors.grey),
        ]),
        children: [
          if (p.storeName != null) ListTile(dense: true, leading: const Icon(Icons.store_outlined), title: Text(p.storeName!)),
          for (final v in p.variants)
            ListTile(
              dense: true,
              title: Text(v.name.isEmpty ? p.name : v.name),
              subtitle: Text(money(v.price)),
              trailing: Text('${v.remain} ш', style: TextStyle(fontWeight: FontWeight.w600, color: v.remain <= 0 ? Colors.red : null)),
            ),
        ],
      ),
    );
  }
}
