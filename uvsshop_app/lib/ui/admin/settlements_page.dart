import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../api/settlement_models.dart';
import '../../state/admin_state.dart';
import '../common.dart';
import 'admin_design.dart';
import 'admin_widgets.dart';
import 'orders_page.dart';
import 'package:uvsshop_app/i18n.dart';

/// web-ийн /store-sales: дэлгүүр бүрийн борлуулалт (сонгосон хугацаанд) ба олгох үлдэгдэл.
/// Дэлгүүр дээр дарвал тооцоо хийгдээгүй бараа, тооцоо шилжүүлэх. Долоо хоногт нэг удаа.
class SettlementsPage extends StatefulWidget {
  const SettlementsPage({super.key});
  @override
  State<SettlementsPage> createState() => _SettlementsPageState();
}

String _day(DateTime d) => '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

/// Хугацааны сонголт → (from, to); 'all' бол null.
(String?, String?) _period(String key) {
  final now = DateTime.now();
  switch (key) {
    case 'month':
      return (_day(DateTime(now.year, now.month, 1)), _day(now));
    case 'lastMonth':
      return (_day(DateTime(now.year, now.month - 1, 1)), _day(DateTime(now.year, now.month, 0)));
    case 'days30':
      return (_day(DateTime(now.year, now.month, now.day - 29)), _day(now));
    default:
      return (null, null);
  }
}

class _SettlementsPageState extends State<SettlementsPage> {
  String _periodKey = 'month';
  // Дэлгүүрийн нэрээр шүүнэ (жагсаалтыг л); нийт дүн бүх дэлгүүрийнх хэвээр.
  String _q = '';
  ({List<StoreSales> rows, double delivered, double pending, double balance})? _data;
  Object? _error;
  int _version = 0;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final version = ++_version;
    setState(() => _error = null);
    try {
      final (from, to) = _period(_periodKey);
      final d = await context.read<AdminState>().storeSales(from: from, to: to);
      if (mounted && version == _version) setState(() => _data = d);
    } catch (e) {
      if (mounted && version == _version) setState(() => _error = e);
    }
  }

  Future<void> _open(StoreSales s) async {
    await Navigator.of(context).push(MaterialPageRoute(builder: (_) => StoreAccountPage(storeId: s.storeId, storeName: s.storeName)));
    _load();
  }

  @override
  Widget build(BuildContext context) {
    final d = _data;
    return AdminTabScaffold(
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(padding: EdgeInsets.zero, physics: const AlwaysScrollableScrollPhysics(), children: [
          AdminPageHeader(children: [
            PillTabs<String>(
              value: _periodKey,
              onChanged: (v) {
                setState(() {
                  _periodKey = v;
                  _data = null;
                });
                _load();
              },
              options: [
                PillOption('month', tr('Энэ сар')),
                PillOption('lastMonth', tr('Өмнөх сар')),
                PillOption('days30', tr('Сүүлийн 30 хоног')),
                PillOption('all', tr('Бүх хугацаа')),
              ],
            ),
            TextField(
              onChanged: (v) => setState(() => _q = v),
              textInputAction: TextInputAction.search,
              decoration: adminSearchDecoration(tr('Дэлгүүрийн нэрээр хайх'), icon: Icons.search),
            ),
          ]),
          if (_error != null && d == null)
            Padding(padding: const EdgeInsets.only(top: 16), child: ErrorView(_error!, onRetry: _load))
          else if (d == null)
            const LoadingView(count: 6)
          else if (d.rows.isEmpty)
            Padding(padding: const EdgeInsets.only(top: 40), child: EmptyView(icon: Icons.storefront_outlined, text: tr('Худалдагч дэлгүүр алга')))
          else ...[
            Padding(
              padding: const EdgeInsets.all(16),
              child: AdminCard(
                child: IntrinsicHeight(
                  child: Row(children: [
                    _Stat(tr('Хүргэгдсэн'), money(d.delivered)),
                    const VerticalDivider(width: 1, color: AdminColors.border),
                    _Stat(tr('Хүргэгдээгүй'), money(d.pending), muted: true),
                    const VerticalDivider(width: 1, color: AdminColors.border),
                    _Stat(tr('Олгох үлдэгдэл'), money(d.balance), primary: true),
                  ]),
                ),
              ),
            ),
            AdminList(children: [
              for (final s in d.rows.where((r) => _q.trim().isEmpty || r.storeName.toLowerCase().contains(_q.trim().toLowerCase())))
                InkWell(
                  onTap: () => _open(s),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    child: Row(children: [
                      StoreLogoBox(fileId: s.logo, name: s.storeName, size: 44),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(s.storeName, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                          const SizedBox(height: 2),
                          Text(
                            '${tr('{orders} захиалга · {delivered}', {'orders': s.orders, 'delivered': money(s.delivered)})}'
                            '${s.pending > 0 ? ' · ${tr('хүлээгдэж буй {amount}', {'amount': money(s.pending)})}' : ''}',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontFamily: mono, fontSize: 12, color: AdminColors.mutedForeground),
                          ),
                        ]),
                      ),
                      const SizedBox(width: 8),
                      Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                        Text(money(s.balance),
                            style: TextStyle(
                                fontFamily: mono,
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: s.balance > 0 ? AdminColors.primaryInk : AdminColors.mutedForeground)),
                        Text(tr('Олгох үлдэгдэл'), style: const TextStyle(fontSize: 11, color: AdminColors.mutedForeground)),
                      ]),
                      const Icon(Icons.chevron_right, color: AdminColors.mutedForeground),
                    ]),
                  ),
                ),
            ]),
            const SizedBox(height: 24),
          ],
        ]),
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  final String label;
  final String value;
  final bool muted;
  final bool primary;
  const _Stat(this.label, this.value, {this.muted = false, this.primary = false});

  @override
  Widget build(BuildContext context) => Expanded(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
          child: Column(children: [
            FittedBox(
              child: Text(value,
                  style: TextStyle(
                      fontFamily: mono,
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: primary ? AdminColors.primaryInk : (muted ? AdminColors.mutedForeground : AdminColors.foreground))),
            ),
            const SizedBox(height: 2),
            Text(label, textAlign: TextAlign.center, style: const TextStyle(fontSize: 12, color: AdminColors.mutedForeground)),
          ]),
        ),
      );
}

/// Нэг дэлгүүрийн нийт тооцоо (web-ийн /store-sales/detail).
class StoreAccountPage extends StatefulWidget {
  final int storeId;
  final String storeName;
  const StoreAccountPage({super.key, required this.storeId, required this.storeName});
  @override
  State<StoreAccountPage> createState() => _StoreAccountPageState();
}

class _StoreAccountPageState extends State<StoreAccountPage> {
  StoreAccount? _a;
  Object? _error;
  bool _byOrder = false;
  bool _saving = false;
  final _note = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _note.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _error = null);
    try {
      final a = await context.read<AdminState>().storeAccount(widget.storeId);
      if (mounted) setState(() => _a = a);
    } catch (e) {
      if (mounted) setState(() => _error = e);
    }
  }

  Future<void> _settle() async {
    final a = _a;
    if (a == null || a.summary.balance <= 0) return;
    final ok = await confirmAction(
      context,
      title: tr('Тооцоо хийснээ бүртгэх үү?'),
      description: tr('{store}-д {amount} шилжүүлснээр бүртгэнэ. Жагсаалтын бүх бараа тооцоо хийгдсэн болно.',
          {'store': a.summary.storeName, 'amount': money(a.summary.balance)}),
      confirmLabel: tr('Тооцоо хийсэн'),
    );
    if (!ok || !mounted) return;
    setState(() => _saving = true);
    final done = await runAction(
        context, () => context.read<AdminState>().settleStore(a.summary.storeId, a.summary.balance, _note.text), tr('Тооцоог бүртгэлээ'));
    if (!mounted) return;
    if (done) _note.clear();
    setState(() => _saving = false);
    _load(); // Татгалзсан ч (дүн өөрчлөгдсөн) шинэ тооцоог харуулна
  }

  Widget _itemRow(SoldItem i) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        child: Row(children: [
          ImageBox(fileId: i.image, size: 44, placeholder: Icons.image_outlined),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(i.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
              Text(i.qty < 0 ? tr('Тооцооны дараа буцаагдсан — хасагдана') : tr('{orders} захиалгад', {'orders': i.orders}),
                  style: const TextStyle(fontSize: 12, color: AdminColors.mutedForeground)),
            ]),
          ),
          Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
            Text(tr('{qty} ш', {'qty': i.qty}),
                style: TextStyle(fontFamily: mono, fontWeight: FontWeight.bold, color: i.qty < 0 ? AdminColors.destructive : null)),
            Text(money(i.amount),
                style: TextStyle(fontFamily: mono, fontSize: 12, color: i.qty < 0 ? AdminColors.destructive : AdminColors.mutedForeground)),
          ]),
        ]),
      );

  Widget _line(String label, String value, {bool bold = false, Color? color}) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 3),
        child: Row(children: [
          Expanded(child: Text(label, style: TextStyle(color: bold ? null : AdminColors.mutedForeground, fontWeight: bold ? FontWeight.bold : null))),
          Text(value, style: TextStyle(fontFamily: mono, fontWeight: bold ? FontWeight.w800 : FontWeight.w600, fontSize: bold ? 19 : 14, color: color)),
        ]),
      );

  /// Дэлгүүрийн данс, хуулах товчтой — шилжүүлгийг банкны апп-аар хийнэ (эндээс мөнгө явахгүй).
  Widget _payTo(StoreAccount a) {
    Widget row(String label, String value, {bool mono = false}) => ListTile(
          dense: true,
          contentPadding: EdgeInsets.zero,
          title: Text(label, style: const TextStyle(fontSize: 12, color: AdminColors.mutedForeground)),
          subtitle: Text(value,
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: Colors.black87, fontFamily: mono ? 'monospace' : null)),
          trailing: IconButton(
            tooltip: tr('Хуулах'),
            icon: const Icon(Icons.copy, size: 20),
            onPressed: () {
              Clipboard.setData(ClipboardData(text: value));
              showMessage(context, tr('Хуулагдлаа'));
            },
          ),
        );
    final b = a.bank;
    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 4, 4),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(tr('Шилжүүлэх данс'), style: const TextStyle(fontWeight: FontWeight.bold)),
          if (b.account == null || b.account!.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Text(tr('Энэ дэлгүүрт данс бүртгээгүй байна'), style: const TextStyle(color: AdminColors.mutedForeground)),
            )
          else ...[
            if (b.name != null) row(tr('Банк'), b.name!),
            row(tr('Дансны дугаар'), b.account!, mono: true),
            if (b.holder != null) row(tr('Данс эзэмшигчийн нэр'), b.holder!),
            row(tr('Шилжүүлэх дүн'), a.summary.balance.round().toString(), mono: true),
          ],
        ]),
      ),
    );
  }

  /// Захиалга бараатайгаа — дарвал захиалгын дэлгэрэнгүй.
  Widget _orderTile(UnsettledOrder o) => InkWell(
      onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => AdminOrderPage(orderId: o.id))),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Expanded(child: Text(o.orderNumber, style: const TextStyle(fontFamily: mono, fontWeight: FontWeight.w600))),
            Text(money(o.amount), style: const TextStyle(fontFamily: mono, fontWeight: FontWeight.bold)),
          ]),
          if (o.deliveredAt != null)
            Text(tr('{date}-нд хүргэгдсэн', {'date': formatDate(o.deliveredAt, time: false)}),
                style: const TextStyle(fontSize: 12, color: AdminColors.mutedForeground)),
          for (final i in o.items)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Row(children: [
                ImageBox(fileId: i.image, size: 28, placeholder: Icons.image_outlined),
                const SizedBox(width: 8),
                Expanded(child: Text(i.name, maxLines: 1, overflow: TextOverflow.ellipsis)),
                Text('${i.qty} × ${money(i.price)}',
                    style: TextStyle(
                        fontFamily: mono, fontSize: 12, color: i.qty < 0 ? AdminColors.destructive : AdminColors.mutedForeground)),
              ]),
            ),
        ]),
      ),
    );

  @override
  Widget build(BuildContext context) {
    final a = _a;
    const h2 = TextStyle(fontSize: 16, fontWeight: FontWeight.bold);
    return AdminTabScaffold(
      pushedTitle: widget.storeName,
      body: a == null
          ? (_error != null ? ErrorView(_error!, onRetry: _load) : const LoadingView(kind: SkeletonKind.detail))
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(padding: const EdgeInsets.only(bottom: 32), children: [
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: AdminCard(
                    padding: const EdgeInsets.all(16),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                      Text(tr('Нийт тооцоо'), style: const TextStyle(fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      _line(tr('Нийт борлуулалт (хүргэгдсэн)'), money(a.allTimeDelivered)),
                      _line(tr('Шилжүүлсэн'), '− ${money(a.summary.settled)}'),
                      const Divider(color: AdminColors.border),
                      _line(tr('Олгох үлдэгдэл'), money(a.summary.balance),
                          bold: true, color: a.summary.balance > 0 ? AdminColors.primaryInk : null),
                      if (a.allTimePending > 0)
                        Text('${tr('Хүргэгдээгүй — хүргэгдвэл нэмэгдэнэ')}: ${money(a.allTimePending)}',
                            style: const TextStyle(fontSize: 12, color: AdminColors.mutedForeground)),
                    ]),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
                  child: Row(children: [
                    Expanded(child: Text(tr('Тооцоо хийгдээгүй бараа'), style: h2)),
                    if (a.unsettledItems.isNotEmpty)
                      SegmentedButton<bool>(
                        showSelectedIcon: false,
                        style: const ButtonStyle(visualDensity: VisualDensity.compact),
                        segments: [
                          ButtonSegment(value: false, label: Text(tr('Бараагаар'))),
                          ButtonSegment(value: true, label: Text(tr('Захиалгаар'))),
                        ],
                        selected: {_byOrder},
                        onSelectionChanged: (v) => setState(() => _byOrder = v.first),
                      ),
                  ]),
                ),
                if (a.unsettledItems.isEmpty)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 24),
                    child: EmptyView(icon: Icons.check_circle_outline, text: tr('Тооцоо бүгд хийгдсэн')),
                  )
                else ...[
                  AdminList(children: [
                    if (!_byOrder)
                      for (final i in a.unsettledItems) _itemRow(i)
                    else
                      for (final o in a.unsettledOrders)
                        _orderTile(o),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      child: Row(children: [
                        Expanded(child: Text(tr('Нийт'), style: const TextStyle(fontWeight: FontWeight.bold))),
                        Text(money(a.summary.balance), style: const TextStyle(fontFamily: mono, fontWeight: FontWeight.bold)),
                      ]),
                    ),
                  ]),
                  // Шилжүүлэх нь админых; худалдагч зөвхөн авах үлдэгдлээ харна.
                  if (a.summary.balance > 0 && (context.read<AdminState>().user?.isAdmin ?? false))
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                        _payTo(a),
                        const SizedBox(height: 12),
                        TextField(
                          controller: _note,
                          maxLength: 500,
                          decoration: adminSearchDecoration(tr('Тэмдэглэл (заавал биш) — ж: гүйлгээний утга')).copyWith(counterText: ''),
                        ),
                        const SizedBox(height: 12),
                        FilledButton.icon(
                          style: FilledButton.styleFrom(
                              backgroundColor: AdminColors.primary, minimumSize: const Size.fromHeight(50), shape: const StadiumBorder()),
                          onPressed: _saving ? null : _settle,
                          icon: _saving
                              ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                              : const Icon(Icons.payments_outlined),
                          label: Text(tr('{amount} шилжүүлсэн гэж тэмдэглэх', {'amount': money(a.summary.balance)})),
                        ),
                      ]),
                    ),
                ],
                if (a.pendingItems.isNotEmpty) ...[
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 24, 16, 0),
                    child: Text(tr('Хүргэгдээгүй'), style: h2),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 2, 16, 8),
                    child: Text(tr('Хүргэгдсэний дараа тооцоонд орно'), style: const TextStyle(fontSize: 12, color: AdminColors.mutedForeground)),
                  ),
                  Opacity(opacity: 0.8, child: AdminList(children: [for (final i in a.pendingItems) _itemRow(i)])),
                ],
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
                  child: Text(tr('Тооцооны түүх'), style: h2),
                ),
                if (a.settlements.isEmpty)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Text(tr('Одоогоор тооцоо хийгээгүй'), style: const TextStyle(color: AdminColors.mutedForeground)),
                  )
                else
                  AdminList(children: [
                    // Дарвал тухайн тооцооны дэлгэрэнгүй хуудас нээгдэнэ
                    for (final s in a.settlements)
                      ListTile(
                        onTap: () => Navigator.of(context).push(MaterialPageRoute(
                            builder: (_) => _SettlementPage(settlement: s, storeName: a.summary.storeName, orderTile: _orderTile))),
                        leading: const CircleAvatar(
                            backgroundColor: AdminColors.tintMint, child: Icon(Icons.payments_outlined, color: AdminColors.tintMintInk)),
                        title: Text(formatDate(s.createdAt), style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                        subtitle: Text(
                          '${tr('{orders} захиалга · {qty} ш', {'orders': s.orders, 'qty': s.qty})}${s.note != null ? ' · ${s.note}' : ''}',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        trailing: Row(mainAxisSize: MainAxisSize.min, children: [
                          Text(money(s.amount), style: const TextStyle(fontFamily: mono, fontWeight: FontWeight.bold)),
                          const SizedBox(width: 4),
                          const Icon(Icons.chevron_right, color: AdminColors.mutedForeground),
                        ]),
                      ),
                  ]),
              ]),
            ),
    );
  }
}

/// Нэг тооцооны дэлгэрэнгүй: огноо, дүн, тэмдэглэл, орсон захиалгууд бараатайгаа (админы /store-sales/settlement).
class _SettlementPage extends StatelessWidget {
  final Settlement settlement;
  final String storeName;
  final Widget Function(UnsettledOrder) orderTile;
  const _SettlementPage({required this.settlement, required this.storeName, required this.orderTile});

  @override
  Widget build(BuildContext context) {
    final s = settlement;
    const muted = TextStyle(color: AdminColors.mutedForeground);
    Widget line(String label, Widget value) => Padding(
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(label, style: muted),
            const SizedBox(width: 12),
            Expanded(child: Align(alignment: Alignment.centerRight, child: value)),
          ]),
        );
    return Scaffold(
      appBar: AppBar(
        title: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(tr('Тооцооны дэлгэрэнгүй')),
          Text(storeName, style: const TextStyle(fontSize: 13, color: AdminColors.mutedForeground)),
        ]),
      ),
      body: ListView(padding: const EdgeInsets.only(bottom: 24), children: [
        Card(
          margin: const EdgeInsets.all(16),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(children: [
              line(tr('Шилжүүлсэн огноо'), Text(formatDate(s.createdAt), style: const TextStyle(fontWeight: FontWeight.w600))),
              line(tr('Захиалгууд'),
                  Text(tr('{orders} захиалга · {qty} ш', {'orders': s.orders, 'qty': s.qty}), style: const TextStyle(fontWeight: FontWeight.w600))),
              if (s.note != null)
                line(tr('Тэмдэглэл'), Text(s.note!, textAlign: TextAlign.right, style: const TextStyle(fontWeight: FontWeight.w600))),
              const Divider(),
              line(tr('Шилжүүлсэн дүн'),
                  Text(money(s.amount), style: const TextStyle(fontFamily: mono, fontSize: 20, fontWeight: FontWeight.w800))),
            ]),
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
          child: Text(tr('Захиалгууд'), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        ),
        AdminList(children: [
          for (final o in s.orderList) orderTile(o),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(children: [
              Expanded(child: Text(tr('Нийт'), style: const TextStyle(fontWeight: FontWeight.bold))),
              Text(money(s.amount), style: const TextStyle(fontFamily: mono, fontWeight: FontWeight.bold)),
            ]),
          ),
        ]),
      ]),
    );
  }
}
