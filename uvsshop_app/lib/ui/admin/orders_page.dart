import 'admin_shell.dart';
import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../api/admin_models.dart';
import '../../config.dart';
import '../../state/admin_state.dart';
import '../common.dart';
import 'admin_design.dart';
import 'admin_widgets.dart';
import 'package:uvsshop_app/i18n.dart';
import '../phone_input.dart';

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
  late final _phone = PhoneController(text: widget.phone ?? '');
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
    // Хэрэглэгчийн хуудаснаас (phone) нээсэн бол самбарын шүүлтийг ашиглахгүй
    if (widget.phone == null) {
      _status = adminOrdersStatus.value;
      adminOrdersStatus.addListener(_followStatus);
    }
    _scroll.addListener(() {
      if (_scroll.position.pixels > _scroll.position.maxScrollExtent - 400) _loadMore();
    });
    _reload();
  }

  @override
  void dispose() {
    adminOrdersStatus.removeListener(_followStatus);
    _scroll.dispose();
    _phone.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  // Самбарын хавтангаас (ж: "Батлахыг хүлээж") төлөв ирэхэд tab-ыг шүүнэ
  void _followStatus() {
    if (!mounted || adminOrdersStatus.value == _status) return;
    _status = adminOrdersStatus.value;
    _reload();
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

  /// Батлах / хүргэсэн — үйлдэл бүр эхлээд асууна (admin web-тэй адил).
  Future<void> _askStatus(AdminOrder o, String to, String success) async {
    final confirm = to == 'confirmed';
    final ok = await confirmAction(context,
        title: confirm
            ? tr('{id} захиалгыг баталгаажуулах уу?', {'id': o.orderNumber})
            : tr('{id} захиалгыг хүргэгдсэн гэж тэмдэглэх үү?', {'id': o.orderNumber}),
        description: confirm ? tr('Захиалагчид захиалга баталгаажсан тухай мэдэгдэл очно.') : tr('Захиалга хүргэгдсэн төлөвт шилжинэ.'),
        confirmLabel: confirm ? tr('Батлах') : tr('Хүргэсэн'));
    if (ok && mounted) await _changeStatus(o, to, success);
  }

  Future<void> _return(AdminOrder o) async {
    final ok = await confirmAction(context,
        title: tr('{id} захиалгыг буцаах уу?', {'id': o.orderNumber}),
        description: o.paidAt != null
            ? tr('Үлдсэн бүх бараа үлдэгдэлд буцна. Төлбөр төлөгдсөн тул мөнгийг нь харилцагчид буцаан олгоно уу.')
            : tr('Үлдсэн бүх бараа үлдэгдэлд буцна.'),
        confirmLabel: tr('Буцаалт'),
        danger: true);
    if (ok && mounted) await _changeStatus(o, 'returned', tr('Захиалгыг буцаалаа'));
  }

  Future<void> _cancel(AdminOrder o) async {
    final ok = await confirmAction(context,
        title: tr('{id} захиалгыг цуцлах уу?', {'id': o.orderNumber}), description: tr('Бараанууд үлдэгдэлд буцна.'), confirmLabel: tr('Цуцлах'), danger: true);
    if (!ok || !mounted) return;
    setState(() => _busy = (id: o.id, to: 'cancelled'));
    final done = await runAction(context, () => context.read<AdminState>().cancelOrder(o.id), tr('Захиалгыг цуцаллаа'));
    if (!mounted) return;
    setState(() => _busy = null);
    if (done) _reload();
  }

  @override
  Widget build(BuildContext context) {
    final ready = _count != null;
    final phone = digitsOnly(_phone.text);
    return AdminTabScaffold(
      pushedTitle: widget.phone != null ? tr('Захиалга') : null,
      body: RefreshIndicator(
        onRefresh: _reload,
        child: ListView(controller: _scroll, padding: EdgeInsets.zero, physics: const AlwaysScrollableScrollPhysics(), children: [
          AdminPageHeader(
            title: tr('Захиалга'),
            aside: ready && _error == null
                ? Text(tr('{_count} захиалга', {'_count': _count}), style: const TextStyle(fontFamily: mono, fontSize: 12, color: AdminColors.mutedForeground))
                : null,
            children: [
              PillTabs<String?>(
                value: _status,
                onChanged: (v) {
                  _status = v;
                  if (widget.phone == null) adminOrdersStatus.value = v;
                  _reload();
                },
                options: [
                  PillOption(null, tr('Бүгд')),
                  for (final e in orderStatusLabel.entries)
                    PillOption(e.key, e.value,
                        tone: orderTones[e.key], count: e.key == 'pending' ? _pending : null, badgeColor: AdminColors.warning),
                ],
              ),
              TextField(
                controller: _phone,
                keyboardType: TextInputType.phone,
                inputFormatters: phoneFormatters,
                maxLength: 8,
                style: const TextStyle(fontFamily: mono),
                onChanged: (_) {
                  _debounce?.cancel();
                  _debounce = Timer(const Duration(milliseconds: 300), _reload);
                },
                decoration: adminSearchDecoration(tr('Утасны дугаараар хайх'), icon: Icons.phone_outlined).copyWith(counterText: ''),
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
                    ? tr('{phone} дугаартай захиалга алга', {'phone': formatPhone(phone)})
                    : _status == null
                        ? tr('Захиалга алга')
                        : tr('“{_status}” захиалга алга', {'_status': orderStatusLabel[_status]}),
              ),
            )
          else ...[
            AdminList(children: [for (final o in _rows) _row(o)]),
            if (_rows.length < (_count ?? 0))
              _error != null && !_loading
                  ? Padding(padding: const EdgeInsets.all(16), child: Center(child: OutlinedButton(onPressed: _loadMore, child: Text(tr('Дахин оролдох')))))
                  : const LoadingView(count: 2),
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
        _actionButton(o, tr('Батлах'), orderTones['confirmed']!.solid, Colors.white, 'confirmed',
            () => _askStatus(o, 'confirmed', tr('Захиалгыг баталлаа'))),
      if (o.status == 'confirmed')
        _actionButton(o, tr('Хүргэсэн'), orderTones['delivered']!.solid, Colors.white, 'delivered',
            () => _askStatus(o, 'delivered', tr('Төлөв шинэчлэгдлээ'))),
      if (o.canReturn)
        _actionButton(o, tr('Буцаалт'), AdminColors.destructive.withValues(alpha: 0.1), AdminColors.destructive, 'returned', () => _return(o)),
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
                  Text(o.orderNumber, style: const TextStyle(fontFamily: mono, fontSize: 14, color: AdminColors.mutedForeground)),
                  const SizedBox(width: 8),
                  OrderStatusBadge(o.status, orderStatusLabel[o.status] ?? o.status),
                ]),
                const SizedBox(height: 6),
                // Нэр, худалдан авагчийн дугаар (нэр нь дугаар өөрөө биш бол)
                Row(children: [
                  Flexible(
                    child: Text(o.customerName.isEmpty ? tr('Нэргүй') : o.customerName,
                        maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                  ),
                  if (o.phone.isNotEmpty && o.phone != o.customerName) ...[
                    const SizedBox(width: 8),
                    const Icon(Icons.phone_outlined, size: 14, color: AdminColors.mutedForeground),
                    const SizedBox(width: 4),
                    Text(formatPhone(o.phone),
                        style: const TextStyle(fontFamily: mono, fontSize: 14, color: AdminColors.mutedForeground)),
                  ],
                ]),
                const SizedBox(height: 2),
                Text(tr('{createdAt} · {items} бараа', {'createdAt': formatWhen(o.createdAt), 'items': o.items.length}),
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
              Expanded(
                child: Text(tr('Удаан хугацаанд төлбөр төлөгдөөгүй байна'),
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AdminColors.warning)),
              ),
              if (isAdmin)
                SizedBox(
                  width: 90,
                  child: _actionButton(o, tr('Цуцлах'), AdminColors.destructive.withValues(alpha: 0.1), AdminColors.destructive, 'cancelled',
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
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(tr('Болих'))),
            FilledButton(onPressed: () => Navigator.pop(ctx, true), child: Text(tr('Тийм'))),
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
          title: Text(tr('Бараа буцаах')),
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
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(tr('Болих'))),
            FilledButton(onPressed: () => Navigator.pop(ctx, true), child: Text(tr('Буцаах'))),
          ],
        ),
      ),
    );
    if (ok == true) {
      await _run(() => context.read<AdminState>().returnItem(widget.orderId, item.id, qty), tr('Буцаалаа'), action: 'item-${item.id}');
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
        appBar: AppBar(title: Text(_order == null ? '' : tr('Захиалга {id}', {'id': _order!.orderNumber}))),
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
          child: ListTile(
            leading: Icon(Icons.warning_amber, color: Colors.orange),
            title: Text(tr('Удаан хугацаанд төлөгдөөгүй захиалга')),
            subtitle: Text(tr('Шаардлагатай бол цуцалж болно.')),
          ),
        ),
      Card(
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              StatusChip(orderStatusLabel[o.status] ?? o.status, orderStatusColor(o.status)),
              const SizedBox(width: 8),
              if (o.paidAt != null) StatusChip(tr('Төлөгдсөн {paidAt}', {'paidAt': formatDate(o.paidAt)}), Colors.green),
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
          title: Text(o.customerName.isEmpty ? tr('Нэргүй') : o.customerName),
          subtitle: Text('${o.phone}\n${o.address}'),
          isThreeLine: true,
        ),
      ),
      const SizedBox(height: 8),
      // Барааны мөр: зураг зүүн ирмэгт наалдсан, мөрийн бүтэн өндөртэй (барааны жагсаалттай адил).
      Card(
        clipBehavior: Clip.antiAlias,
        child: Column(children: [
          for (final (n, i) in o.items.indexed) ...[
            if (n > 0) const Divider(height: 1),
            IntrinsicHeight(
              child: Row(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                SizedBox(
                  width: 96,
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(minHeight: 84),
                    child: NetImage(fileUrl(i.imageId, 'thumbnail'), width: 96),
                  ),
                ),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(12, 10, 8, 10),
                    child: Column(mainAxisAlignment: MainAxisAlignment.center, crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(i.name, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 15)),
                      if (i.storeName != null)
                        Padding(
                          padding: const EdgeInsets.only(top: 2),
                          child: Row(children: [
                            const Icon(Icons.storefront_outlined, size: 14, color: AdminColors.primaryInk),
                            const SizedBox(width: 4),
                            Flexible(
                              child: Text(i.storeName!,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AdminColors.primaryInk)),
                            ),
                          ]),
                        ),
                      Padding(
                        padding: const EdgeInsets.only(top: 2),
                        child: Text('${money(i.price)} × ${i.qty}${i.returnedQty > 0 ? ' (${tr('буцаасан {n}', {'n': i.returnedQty})})' : ''}',
                            style: const TextStyle(fontSize: 13, color: AdminColors.mutedForeground)),
                      ),
                    ]),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: Center(
                    child: o.canReturn && i.keptQty > 0 && admin.user?.isAdmin == true
                        ? IconButton(
                            tooltip: tr('Буцаах'),
                            icon: _action == 'item-${i.id}'
                                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                                : const Icon(Icons.undo),
                            onPressed: _busy ? null : () => _returnItem(i),
                          )
                        : Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: Text(money(i.price * i.keptQty), style: const TextStyle(fontWeight: FontWeight.w600)),
                          ),
                  ),
                ),
              ]),
            ),
          ],
        ]),
      ),
      const SizedBox(height: 8),
      Card(
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(children: [
            sum(tr('Барааны дүн'), o.subtotal),
            if (o.returnedAmount > 0) sum(tr('Буцаасан'), -o.returnedAmount),
            sum(tr('Хүргэлт'), o.deliveryFee),
            sum(tr('Нийт'), o.total, bold: true),
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
                        if (await _confirm(tr('Захиалгыг цуцлах уу? Бараа агуулахад буцна.'))) {
                          await _run(() => admin.cancelOrder(o.id), tr('Цуцаллаа'), action: 'cancel');
                        }
                      },
                child: _action == 'cancel' ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.red)) : Text(tr('Цуцлах')),
              ),
            )
          else if (o.canReturn)
            Expanded(
              child: OutlinedButton(
                style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(48)),
                onPressed: _busy
                    ? null
                    : () async {
                        if (await _confirm(tr('Захиалгыг бүхэлд нь буцаах уу?'))) {
                          await _run(() => admin.setOrderStatus(o.id, 'returned'), tr('Буцаалаа'), action: 'return');
                        }
                      },
                child: _action == 'return' ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)) : Text(tr('Бүгдийг буцаах')),
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
                        if (await _confirm('${tr(next.$1)}?')) {
                          await _run(() => admin.setOrderStatus(o.id, next.$2), orderStatusLabel[next.$2]!, action: 'next');
                        }
                      },
                child: _action == 'next' ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : Text(tr(next.$1)),
              ),
            ),
          ],
        ]),
      ),
    );
  }
}
