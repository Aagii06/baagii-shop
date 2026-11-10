import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../api/admin_models.dart';
import '../../config.dart';
import '../../state/admin_state.dart';
import '../common.dart';
import 'admin_design.dart';
import 'admin_widgets.dart';

class AdminOrdersPage extends StatefulWidget {
  /// Худалдан авагчийн хуудаснаас нээхэд энэ утсаар шүүнэ.
  final String? phone;
  const AdminOrdersPage({super.key, this.phone});
  @override
  State<AdminOrdersPage> createState() => _AdminOrdersPageState();
}

/// web-ийн /orders: төлвөөр шүүх, утсаар хайх, мөр бүрээс батлах / хүргэсэн / буцаах.
class _AdminOrdersPageState extends State<AdminOrdersPage> {
  static const _take = 20;
  final _scroll = ScrollController();
  late final _phone = TextEditingController(text: widget.phone ?? '');
  Timer? _debounce;
  String? _status;
  final List<AdminOrder> _rows = [];
  int? _count;
  int _pending = 0;
  bool _loading = false;
  Object? _error;
  int _version = 0;
  // Төлөв нь солигдож буй захиалга ба аль төлөв рүү — тэр товч эргэлдэнэ.
  ({int id, String to})? _busy;

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
          .orders(skip: _rows.length, take: _take, status: _status, phone: digitsOnly(_phone.text));
      if (!mounted || version != _version) return;
      setState(() {
        _rows.addAll(r.rows.where((n) => !_rows.any((o) => o.id == n.id)));
        _count = r.count;
        _pending = r.pending;
      });
    } catch (e) {
      if (mounted && version == _version) setState(() => _error = e);
    } finally {
      if (mounted && version == _version) setState(() => _loading = false);
    }
  }

  Future<void> _changeStatus(AdminOrder o, String to, String success) async {
    setState(() => _busy = (id: o.id, to: to));
    final done = await runAction(context, () => context.read<AdminState>().setOrderStatus(o.id, to), success);
    if (!mounted) return;
    setState(() => _busy = null);
    if (done) _reload();
  }

  Future<void> _return(AdminOrder o) async {
    final ok = await confirmAction(context,
        title: '#${o.id} захиалгыг буцаах уу?',
        description: o.paidAt != null
            ? 'Үлдсэн бүх бараа үлдэгдэлд буцна. Төлбөр төлөгдсөн тул мөнгийг нь харилцагчид буцаан олгоно уу.'
            : 'Үлдсэн бүх бараа үлдэгдэлд буцна.',
        confirmLabel: 'Буцаалт',
        danger: true);
    if (ok && mounted) await _changeStatus(o, 'returned', 'Захиалгыг буцаалаа');
  }

  Future<void> _cancel(AdminOrder o) async {
    final ok = await confirmAction(context,
        title: '#${o.id} захиалгыг цуцлах уу?', description: 'Бараанууд үлдэгдэлд буцна.', confirmLabel: 'Цуцлах', danger: true);
    if (!ok || !mounted) return;
    setState(() => _busy = (id: o.id, to: 'cancelled'));
    final done = await runAction(context, () => context.read<AdminState>().cancelOrder(o.id), 'Захиалгыг цуцаллаа');
    if (!mounted) return;
    setState(() => _busy = null);
    if (done) _reload();
  }

  @override
  Widget build(BuildContext context) {
    final ready = _count != null;
    final phone = digitsOnly(_phone.text);
    return AdminTabScaffold(
      pushedTitle: widget.phone != null ? 'Захиалга' : null,
      body: RefreshIndicator(
        onRefresh: _reload,
        child: ListView(controller: _scroll, padding: EdgeInsets.zero, physics: const AlwaysScrollableScrollPhysics(), children: [
          AdminPageHeader(
            title: 'Захиалга',
            aside: ready && _error == null
                ? Text('$_count захиалга', style: const TextStyle(fontFamily: mono, fontSize: 12, color: AdminColors.mutedForeground))
                : null,
            children: [
              PillTabs<String?>(
                value: _status,
                onChanged: (v) {
                  _status = v;
                  _reload();
                },
                options: [
                  const PillOption(null, 'Бүгд'),
                  for (final e in orderStatusLabel.entries)
                    PillOption(e.key, e.value,
                        tone: orderTones[e.key], count: e.key == 'pending' ? _pending : null, badgeColor: AdminColors.warning),
                ],
              ),
              TextField(
                controller: _phone,
                keyboardType: TextInputType.phone,
                maxLength: 8,
                style: const TextStyle(fontFamily: mono),
                onChanged: (_) {
                  _debounce?.cancel();
                  _debounce = Timer(const Duration(milliseconds: 300), _reload);
                },
                decoration: adminSearchDecoration('Утасны дугаараар хайх', icon: Icons.phone_outlined).copyWith(counterText: ''),
              ),
            ],
          ),
          if (!ready && _error == null)
            const LoadingView(count: 5)
          else if (_error != null && _rows.isEmpty)
            Padding(padding: const EdgeInsets.only(top: 16), child: ErrorView(_error!, onRetry: _reload))
          else if (_rows.isEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 40),
              child: EmptyView(
                icon: Icons.receipt_long_outlined,
                text: phone.isNotEmpty
                    ? '${formatPhone(phone)} дугаартай захиалга алга'
                    : _status == null
                        ? 'Захиалга алга'
                        : '“${orderStatusLabel[_status]}” захиалга алга',
              ),
            )
          else ...[
            AdminList(children: [for (final o in _rows) _row(o)]),
            if (_rows.length < (_count ?? 0))
              Padding(
                padding: const EdgeInsets.all(16),
                child: Center(
                  child: _error != null && !_loading
                      ? OutlinedButton(onPressed: _loadMore, child: const Text('Дахин оролдох'))
                      : const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2.5)),
                ),
              ),
          ],
        ]),
      ),
    );
  }

  Widget _actionButton(AdminOrder o, String label, Color bg, Color fg, String to, VoidCallback onTap) {
    final busy = _busy?.id == o.id;
    return FilledButton(
      style: FilledButton.styleFrom(
        backgroundColor: bg,
        foregroundColor: fg,
        minimumSize: const Size.fromHeight(40),
        shape: const StadiumBorder(),
        textStyle: const TextStyle(fontWeight: FontWeight.w600),
      ),
      onPressed: busy ? null : onTap,
      child: busy && _busy!.to == to
          ? SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: fg))
          : Text(label),
    );
  }

  Widget _row(AdminOrder o) {
    final isAdmin = context.read<AdminState>().user?.isAdmin ?? false;
    final buttons = <Widget>[
      if (o.status == 'pending')
        _actionButton(o, 'Батлах', orderTones['confirmed']!.solid, Colors.white, 'confirmed',
            () => _changeStatus(o, 'confirmed', 'Захиалгыг баталлаа')),
      if (o.status == 'confirmed')
        _actionButton(o, 'Хүргэсэн', orderTones['delivered']!.solid, Colors.white, 'delivered',
            () => _changeStatus(o, 'delivered', 'Төлөв шинэчлэгдлээ')),
      if (o.canReturn)
        _actionButton(o, 'Буцаалт', AdminColors.destructive.withValues(alpha: 0.1), AdminColors.destructive, 'returned', () => _return(o)),
    ];
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        InkWell(
          onTap: () async {
            final changed = await Navigator.of(context).push<bool>(MaterialPageRoute(builder: (_) => AdminOrderPage(orderId: o.id)));
            if (changed == true) _reload();
          },
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  Text('#${o.id}', style: const TextStyle(fontFamily: mono, fontSize: 14, color: AdminColors.mutedForeground)),
                  const SizedBox(width: 8),
                  OrderStatusBadge(o.status, orderStatusLabel[o.status] ?? o.status),
                ]),
                const SizedBox(height: 6),
                Text(o.customerName.isEmpty ? 'Нэргүй' : o.customerName,
                    maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                const SizedBox(height: 2),
                Text('${formatWhen(o.createdAt)} · ${o.items.length} бараа',
                    style: const TextStyle(fontSize: 14, color: AdminColors.mutedForeground)),
              ]),
            ),
            const SizedBox(width: 12),
            Text(mnt(o.total), style: const TextStyle(fontFamily: mono, fontSize: 15, fontWeight: FontWeight.bold)),
          ]),
        ),
        if (o.overdue) ...[
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: AdminColors.warningSoft, borderRadius: BorderRadius.circular(16)),
            child: Row(children: [
              const Icon(Icons.warning_amber_rounded, color: AdminColors.warning),
              const SizedBox(width: 12),
              const Expanded(
                child: Text('Удаан хугацаанд төлбөр төлөгдөөгүй байна',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AdminColors.warning)),
              ),
              if (isAdmin)
                SizedBox(
                  width: 90,
                  child: _actionButton(o, 'Цуцлах', AdminColors.destructive.withValues(alpha: 0.1), AdminColors.destructive, 'cancelled',
                      () => _cancel(o)),
                ),
            ]),
          ),
        ],
        if (buttons.isNotEmpty) ...[
          const SizedBox(height: 12),
          Row(children: [
            for (var i = 0; i < buttons.length; i++) ...[
              if (i > 0) const SizedBox(width: 12),
              Expanded(child: buttons[i]),
            ],
          ]),
        ],
      ]),
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

  /// Аль товчны үйлдэл явж байна — тэр товч эргэлдэнэ.
  String? _action;
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

  Future<void> _run(Future<void> Function() fn, String done, {String? action}) async {
    setState(() {
      _busy = true;
      _action = action;
    });
    try {
      await fn();
      _changed = true;
      await _load();
      if (mounted) showMessage(context, done);
    } catch (e) {
      if (mounted) showMessage(context, e.toString(), error: true);
    } finally {
      if (mounted) {
        setState(() {
          _busy = false;
          _action = null;
        });
      }
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
      await _run(() => context.read<AdminState>().returnItem(widget.orderId, item.id, qty), 'Буцаалаа', action: 'item-${item.id}');
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
                  ? IconButton(
                      tooltip: 'Буцаах',
                      icon: _action == 'item-${i.id}'
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                          : const Icon(Icons.undo),
                      onPressed: _busy ? null : () => _returnItem(i),
                    )
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
                          await _run(() => admin.cancelOrder(o.id), 'Цуцаллаа', action: 'cancel');
                        }
                      },
                child: _action == 'cancel' ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.red)) : const Text('Цуцлах'),
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
                          await _run(() => admin.setOrderStatus(o.id, 'returned'), 'Буцаалаа', action: 'return');
                        }
                      },
                child: _action == 'return' ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Бүгдийг буцаах'),
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
                          await _run(() => admin.setOrderStatus(o.id, next.$2), orderStatusLabel[next.$2]!, action: 'next');
                        }
                      },
                child: _action == 'next' ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : Text(next.$1),
              ),
            ),
          ],
        ]),
      ),
    );
  }
}
