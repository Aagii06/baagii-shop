import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../api/admin_manage_models.dart' show AdminNotification;
import '../../state/shop_state.dart';
import '../admin/admin_widgets.dart' show formatWhen;
import '../common.dart';
import 'orders_page.dart';

const _icons = {
  'order_paid': Icons.paid_outlined,
  'order_confirmed': Icons.check_circle_outline,
  'order_delivered': Icons.local_shipping_outlined,
  'order_cancelled': Icons.cancel_outlined,
  'order_returned': Icons.undo,
  'partner_approved': Icons.handshake_outlined,
  'partner_rejected': Icons.handshake_outlined,
};

/// web-ийн /notifications: худалдан авагчийн мэдэгдэл (захиалгын төлөв, хамтран
/// ажиллах хүсэлтийн хариу). Дарахад уншсан болж, захиалга руу орно.
class ShopNotificationsPage extends StatefulWidget {
  const ShopNotificationsPage({super.key});
  @override
  State<ShopNotificationsPage> createState() => _ShopNotificationsPageState();
}

class _ShopNotificationsPageState extends State<ShopNotificationsPage> {
  List<AdminNotification>? _rows;
  int _count = 0;
  bool _error = false;
  bool _loadingMore = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _error = false);
    try {
      final r = await context.read<ShopState>().notifications();
      if (mounted) {
        setState(() {
          _rows = r.rows;
          _count = r.count;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _error = true);
    }
  }

  Future<void> _more() async {
    if (_rows == null || _loadingMore) return;
    setState(() => _loadingMore = true);
    try {
      final r = await context.read<ShopState>().notifications(skip: _rows!.length);
      if (mounted) {
        setState(() {
          _rows = [..._rows!, ...r.rows.where((n) => !_rows!.any((o) => o.id == n.id))];
          _count = r.count;
        });
      }
    } catch (_) {
    } finally {
      if (mounted) setState(() => _loadingMore = false);
    }
  }

  Future<void> _open(AdminNotification n) async {
    final shop = context.read<ShopState>();
    if (!n.read) {
      setState(() => _rows = [for (final r in _rows!) r.id == n.id ? r.asRead() : r]);
      shop.markNotificationRead(n.id);
    }
    final m = RegExp(r'^/orders/(\d+)').firstMatch(n.link ?? '');
    if (m == null) return;
    final nav = Navigator.of(context);
    try {
      final order = await shop.getOrder(m.group(1)!);
      if (!mounted) return;
      nav.push(MaterialPageRoute(builder: (_) => OrderDetailPage(order: order)));
    } catch (_) {
      if (mounted) nav.push(MaterialPageRoute(builder: (_) => const OrdersPage()));
    }
  }

  @override
  Widget build(BuildContext context) {
    final shop = context.watch<ShopState>();
    final rows = _rows;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Мэдэгдэл'),
        actions: [
          if (shop.unreadNotifications > 0)
            TextButton(
              onPressed: () {
                setState(() => _rows = [for (final r in _rows ?? <AdminNotification>[]) r.asRead()]);
                shop.markAllNotificationsRead();
              },
              child: const Text('Бүгдийг уншсан'),
            ),
        ],
      ),
      body: !shop.signedIn
          ? const EmptyView(icon: Icons.notifications_none, text: 'Мэдэгдлээ харахын тулд нэвтэрнэ үү')
          : rows == null && _error
              ? Center(
                  child: Column(mainAxisSize: MainAxisSize.min, children: [
                    const Text('Мэдэгдлийг ачаалж чадсангүй'),
                    TextButton(onPressed: _load, child: const Text('Дахин оролдох')),
                  ]),
                )
              : rows == null
                  ? const Center(child: CircularProgressIndicator())
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: rows.isEmpty
                          ? ListView(children: const [
                              SizedBox(height: 120),
                              EmptyView(
                                icon: Icons.notifications_none,
                                text: 'Мэдэгдэл алга. Захиалгын төлөв өөрчлөгдөхөд энд харагдана.',
                              ),
                            ])
                          : ListView(padding: const EdgeInsets.all(16), children: [
                              Container(
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: borderColor),
                                ),
                                clipBehavior: Clip.antiAlias,
                                child: Column(children: [
                                  for (var i = 0; i < rows.length; i++) ...[
                                    if (i > 0) const Divider(height: 1, color: borderColor),
                                    _item(rows[i]),
                                  ],
                                ]),
                              ),
                              if (rows.length < _count)
                                Padding(
                                  padding: const EdgeInsets.only(top: 16),
                                  child: OutlinedButton(
                                    onPressed: _loadingMore ? null : _more,
                                    child: _loadingMore
                                        ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                                        : const Text('Цааш үзэх'),
                                  ),
                                ),
                            ]),
                    ),
    );
  }

  Widget _item(AdminNotification n) {
    final bad = n.type == 'order_cancelled' || n.type == 'partner_rejected';
    return Material(
      color: n.read ? Colors.white : accentColor.withValues(alpha: 0.4),
      child: InkWell(
        onTap: () => _open(n),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(color: bad ? Colors.red.shade50 : accentColor, shape: BoxShape.circle),
              child: Icon(_icons[n.type] ?? Icons.notifications_none, size: 20, color: bad ? Colors.red.shade600 : brandColor),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(n.title, style: TextStyle(fontSize: 15, height: 1.3, fontWeight: n.read ? FontWeight.w500 : FontWeight.bold)),
                if (n.body != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Text(n.body!, style: TextStyle(fontSize: 13, color: Colors.grey.shade600)),
                  ),
                const SizedBox(height: 4),
                Text(formatWhen(n.createdAt), style: TextStyle(fontSize: 12, color: Colors.grey.shade500)),
              ]),
            ),
            if (!n.read)
              Container(
                margin: const EdgeInsets.only(top: 8, left: 8),
                width: 10,
                height: 10,
                decoration: const BoxDecoration(color: brandColor, shape: BoxShape.circle),
              ),
          ]),
        ),
      ),
    );
  }
}
