import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../api/admin_models.dart';
import '../../config.dart';
import '../../state/admin_state.dart';
import '../common.dart';
import 'admin_shell.dart';

class AdminOrdersPage extends StatefulWidget {
  const AdminOrdersPage({super.key});
  @override
  State<AdminOrdersPage> createState() => _AdminOrdersPageState();
}

class _AdminOrdersPageState extends State<AdminOrdersPage> {
  static const _take = 30;
  final _scroll = ScrollController();
  final _phone = TextEditingController();
  Timer? _debounce;
  String? _status;
  final List<AdminOrder> _rows = [];
  int _count = 0;
  int _pending = 0;
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
    _phone.dispose();
    _debounce?.cancel();
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
      final r = await context.read<AdminState>().orders(skip: _rows.length, take: _take, status: _status, phone: digitsOnly(_phone.text));
      if (!mounted) return;
      setState(() {
        _rows.addAll(r.rows);
        _count = r.count;
        _pending = r.pending;
      });
    } catch (e) {
      if (mounted) setState(() => _error = e);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_pending > 0 ? 'Захиалга ($_pending хүлээгдэж буй)' : 'Захиалга'),
        actions: const [VisitShopButton()],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(104),
          child: Column(children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 0, 12, 6),
              child: TextField(
                controller: _phone,
                keyboardType: TextInputType.phone,
                onChanged: (_) {
                  _debounce?.cancel();
                  _debounce = Timer(const Duration(milliseconds: 500), _reload);
                },
                decoration: InputDecoration(
                  hintText: 'Утасны дугаараар хайх',
                  prefixIcon: const Icon(Icons.search),
                  fillColor: Colors.grey.shade100,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide.none),
                ),
              ),
            ),
            SizedBox(
              height: 46,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                children: [
                  for (final s in [null, ...orderStatusLabel.keys])
                    Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        showCheckmark: false,
                        label: Text(s == null ? 'Бүгд' : orderStatusLabel[s]!),
                        selected: _status == s,
                        onSelected: (_) {
                          _status = s;
                          _reload();
                        },
                      ),
                    ),
                ],
              ),
            ),
          ]),
        ),
      ),
      body: RefreshIndicator(onRefresh: _reload, child: _body()),
    );
  }

  Widget _body() {
    if (_rows.isEmpty && _loading) return const LoadingView();
    if (_rows.isEmpty && _error != null) return ListView(children: [SizedBox(height: 400, child: ErrorView(_error!, onRetry: _reload))]);
    if (_rows.isEmpty) {
      return ListView(children: const [SizedBox(height: 400, child: EmptyView(icon: Icons.receipt_long_outlined, text: 'Захиалга алга'))]);
    }
    return ListView.separated(
      controller: _scroll,
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(12),
      itemCount: _rows.length + (_loading ? 1 : 0),
      separatorBuilder: (_, _) => const SizedBox(height: 8),
      itemBuilder: (context, i) {
        if (i >= _rows.length) return const Padding(padding: EdgeInsets.all(16), child: LoadingView(count: 2));
        final o = _rows[i];
        return Card(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: InkWell(
            onTap: () async {
              final changed = await Navigator.of(context).push<bool>(MaterialPageRoute(builder: (_) => AdminOrderPage(orderId: o.id)));
              if (changed == true) _reload();
            },
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  Text('#${o.id}', style: const TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(width: 8),
                  Text(formatDate(o.createdAt), style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
                  const Spacer(),
                  if (o.overdue) const Padding(padding: EdgeInsets.only(right: 6), child: Icon(Icons.warning_amber, color: Colors.orange, size: 18)),
                  StatusChip(orderStatusLabel[o.status] ?? o.status, orderStatusColor(o.status)),
                ]),
                const SizedBox(height: 6),
                Text('${o.customerName.isEmpty ? 'Нэргүй' : o.customerName} · ${o.phone}'),
                Text(o.address, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(color: Colors.grey.shade600, fontSize: 13)),
                const SizedBox(height: 6),
                Row(children: [
                  Text('${o.items.length} бараа', style: TextStyle(color: Colors.grey.shade700)),
                  if (o.paidAt != null) ...[
                    const SizedBox(width: 8),
                    const StatusChip('Төлөгдсөн', Colors.green),
                  ],
                  const Spacer(),
                  Text(money(o.total), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                ]),
              ]),
            ),
          ),
        );
      },
    );
  }
}

class AdminOrderPage extends StatefulWidget {
  final int orderId;
  const AdminOrderPage({super.key, required this.orderId});
  @override
  State<AdminOrderPage> createState() => _AdminOrderPageState();
}

class _AdminOrderPageState extends State<AdminOrderPage> {
  AdminOrder? _order;
  Object? _error;
  bool _busy = false;
  bool _changed = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final o = await context.read<AdminState>().order(widget.orderId);
      if (mounted) setState(() => _order = o);
    } catch (e) {
      if (mounted) setState(() => _error = e);
    }
  }

  Future<bool> _confirm(String text) async =>
      await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          content: Text(text),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Болих')),
            FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Тийм')),
          ],
        ),
      ) ??
      false;

  Future<void> _run(Future<void> Function() fn, String done) async {
    setState(() => _busy = true);
    try {
      await fn();
      _changed = true;
      await _load();
      if (mounted) showMessage(context, done);
    } catch (e) {
      if (mounted) showMessage(context, e.toString(), error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _returnItem(AdminOrderItem item) async {
    var qty = item.keptQty;
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, set) => AlertDialog(
          title: const Text('Бараа буцаах'),
          content: Column(mainAxisSize: MainAxisSize.min, children: [
            Text(item.name),
            const SizedBox(height: 12),
            Row(mainAxisAlignment: MainAxisAlignment.center, children: [
              IconButton(onPressed: qty > 1 ? () => set(() => qty--) : null, icon: const Icon(Icons.remove)),
              Text('$qty', style: const TextStyle(fontSize: 20)),
              IconButton(onPressed: qty < item.keptQty ? () => set(() => qty++) : null, icon: const Icon(Icons.add)),
            ]),
          ]),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Болих')),
            FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Буцаах')),
          ],
        ),
      ),
    );
    if (ok == true) {
      await _run(() => context.read<AdminState>().returnItem(widget.orderId, item.id, qty), 'Буцаалаа');
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) Navigator.of(context).pop(_changed);
      },
      child: Scaffold(
        appBar: AppBar(title: Text('Захиалга #${widget.orderId}')),
        body: _order == null
            ? (_error != null ? ErrorView(_error!, onRetry: _load) : const LoadingView(kind: SkeletonKind.detail))
            : _body(_order!),
        bottomNavigationBar: _order == null ? null : _actions(_order!),
      ),
    );
  }

  Widget _body(AdminOrder o) {
    final admin = context.read<AdminState>();
    Widget sum(String l, double v, {bool bold = false}) => Padding(
          padding: const EdgeInsets.symmetric(vertical: 3),
          child: Row(children: [
            Expanded(child: Text(l, style: TextStyle(fontWeight: bold ? FontWeight.bold : null))),
            Text(money(v), style: TextStyle(fontWeight: bold ? FontWeight.bold : null, fontSize: bold ? 16 : null)),
          ]),
        );
    return ListView(padding: const EdgeInsets.all(12), children: [
      if (o.overdue)
        Card(
          color: Colors.orange.shade50,
          child: const ListTile(
            leading: Icon(Icons.warning_amber, color: Colors.orange),
            title: Text('Удаан хугацаанд төлөгдөөгүй захиалга'),
            subtitle: Text('Шаардлагатай бол цуцалж болно.'),
          ),
        ),
      Card(
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              StatusChip(orderStatusLabel[o.status] ?? o.status, orderStatusColor(o.status)),
              const SizedBox(width: 8),
              if (o.paidAt != null) StatusChip('Төлөгдсөн ${formatDate(o.paidAt)}', Colors.green),
            ]),
            const SizedBox(height: 12),
            for (final s in orderStatusLabel.keys)
              if (o.timeline[s] != null)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 2),
                  child: Row(children: [
                    Icon(Icons.check_circle, size: 16, color: orderStatusColor(s)),
                    const SizedBox(width: 6),
                    Text(orderStatusLabel[s]!),
                    const Spacer(),
                    Text(formatDate(o.timeline[s]), style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
                  ]),
                ),
          ]),
        ),
      ),
      const SizedBox(height: 8),
      Card(
        child: ListTile(
          leading: const Icon(Icons.person_outline),
          title: Text(o.customerName.isEmpty ? 'Нэргүй' : o.customerName),
          subtitle: Text('${o.phone}\n${o.address}'),
          isThreeLine: true,
        ),
      ),
      const SizedBox(height: 8),
      Card(
        child: Column(children: [
          for (final i in o.items)
            ListTile(
              leading: NetImage(fileUrl(i.imageId, 'icon'), width: 48, height: 48, radius: BorderRadius.circular(6)),
              title: Text(i.name, maxLines: 2, overflow: TextOverflow.ellipsis),
              subtitle: Text('${money(i.price)} × ${i.qty}${i.returnedQty > 0 ? ' (буцаасан ${i.returnedQty})' : ''}'),
              trailing: o.canReturn && i.keptQty > 0 && admin.user?.isAdmin == true
                  ? IconButton(tooltip: 'Буцаах', icon: const Icon(Icons.undo), onPressed: _busy ? null : () => _returnItem(i))
                  : Text(money(i.price * i.keptQty)),
            ),
        ]),
      ),
      const SizedBox(height: 8),
      Card(
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(children: [
            sum('Барааны дүн', o.subtotal),
            if (o.returnedAmount > 0) sum('Буцаасан', -o.returnedAmount),
            sum('Хүргэлт', o.deliveryFee),
            sum('Нийт', o.total, bold: true),
          ]),
        ),
      ),
      const SizedBox(height: 24),
    ]);
  }

  Widget? _actions(AdminOrder o) {
    final admin = context.read<AdminState>();
    final next = nextOrderAction[o.status];
    if (next == null && !o.canReturn && !o.overdue) return null;
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(children: [
          if (o.overdue && o.status == 'pending')
            Expanded(
              child: OutlinedButton(
                style: OutlinedButton.styleFrom(foregroundColor: Colors.red, minimumSize: const Size.fromHeight(48)),
                onPressed: _busy
                    ? null
                    : () async {
                        if (await _confirm('Захиалгыг цуцлах уу? Бараа агуулахад буцна.')) {
                          await _run(() => admin.cancelOrder(o.id), 'Цуцаллаа');
                        }
                      },
                child: const Text('Цуцлах'),
              ),
            )
          else if (o.canReturn)
            Expanded(
              child: OutlinedButton(
                style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(48)),
                onPressed: _busy
                    ? null
                    : () async {
                        if (await _confirm('Захиалгыг бүхэлд нь буцаах уу?')) {
                          await _run(() => admin.setOrderStatus(o.id, 'returned'), 'Буцаалаа');
                        }
                      },
                child: const Text('Бүгдийг буцаах'),
              ),
            ),
          if (next != null) ...[
            const SizedBox(width: 12),
            Expanded(
              child: FilledButton(
                style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
                onPressed: _busy
                    ? null
                    : () async {
                        if (await _confirm('${next.$1}?')) {
                          await _run(() => admin.setOrderStatus(o.id, next.$2), orderStatusLabel[next.$2]!);
                        }
                      },
                child: Text(next.$1),
              ),
            ),
          ],
        ]),
      ),
    );
  }
}
