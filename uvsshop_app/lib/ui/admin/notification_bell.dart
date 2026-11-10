import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../api/admin_manage_models.dart';
import '../../state/admin_state.dart';
import 'admin_design.dart';
import 'admin_shell.dart';
import 'admin_widgets.dart';
import 'feedbacks_page.dart';
import 'orders_page.dart';
import 'partner_requests_page.dart';

/// web-ийн NotificationBell: толгойн баруун талын 🔔, уншаагүйн тоо улаан badge-аар.
class NotificationBell extends StatelessWidget {
  const NotificationBell({super.key});

  @override
  Widget build(BuildContext context) {
    final unread = context.select<AdminState, int>((a) => a.unreadNotifications);
    return Tooltip(
      message: unread > 0 ? 'Мэдэгдэл ($unread уншаагүй)' : 'Мэдэгдэл',
      child: Stack(clipBehavior: Clip.none, children: [
        Material(
          color: Colors.white,
          shape: const CircleBorder(side: BorderSide(color: AdminColors.border)),
          child: InkWell(
            customBorder: const CircleBorder(),
            onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const NotificationsPage())),
            child: const SizedBox(width: 40, height: 40, child: Icon(Icons.notifications_none_rounded, size: 22)),
          ),
        ),
        if (unread > 0)
          Positioned(
            right: -4,
            top: -4,
            child: Container(
              constraints: const BoxConstraints(minWidth: 20),
              height: 20,
              padding: const EdgeInsets.symmetric(horizontal: 4),
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: AdminColors.destructive,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AdminColors.background, width: 2),
              ),
              child: Text(unread > 99 ? '99+' : '$unread',
                  style: const TextStyle(fontFamily: mono, color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold, height: 1)),
            ),
          ),
      ]),
    );
  }
}

const _icons = {
  'order': (Icons.receipt_long_outlined, AdminColors.tintBlue, AdminColors.tintBlueInk),
  'order_paid': (Icons.paid_outlined, AdminColors.tintMint, AdminColors.tintMintInk),
  'partner': (Icons.handshake_outlined, AdminColors.tintPeach, AdminColors.tintPeachInk),
  'feedback': (Icons.chat_outlined, AdminColors.primarySoft, AdminColors.primaryInk),
  'low_stock': (Icons.inventory_2_outlined, Color(0x1ADC2626), AdminColors.destructive),
};

/// web-ийн /notifications: бүтэн дэлгэц, дээрээ буцах товчтой. Мөр дээр дарахад
/// уншсан болж, тухайн захиалга / хүсэлт / санал хүсэлт рүү орно.
class NotificationsPage extends StatefulWidget {
  const NotificationsPage({super.key});
  @override
  State<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends State<NotificationsPage> {
  List<AdminNotification>? _rows;
  int _count = 0;
  Object? _error;
  bool _loadingMore = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _error = null);
    try {
      final r = await context.read<AdminState>().notifications();
      if (mounted) {
        setState(() {
          _rows = r.rows;
          _count = r.count;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _error = e);
    }
  }

  Future<void> _more() async {
    if (_rows == null || _loadingMore) return;
    setState(() => _loadingMore = true);
    try {
      final r = await context.read<AdminState>().notifications(skip: _rows!.length);
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

  /// Уншсан болгоод холбогдох хуудсыг нээнэ (web-ийн link → аппын хуудас).
  void _open(AdminNotification n) {
    final admin = context.read<AdminState>();
    if (!n.read) {
      setState(() => _rows = [for (final r in _rows!) r.id == n.id ? r.asRead() : r]);
      admin.markNotificationRead(n.id);
    }
    final link = n.link ?? '';
    final nav = Navigator.of(context);
    Widget? page;
    final order = RegExp(r'^/orders/(\d+)').firstMatch(link);
    if (order != null) {
      page = AdminOrderPage(orderId: int.parse(order.group(1)!));
    } else if (link.startsWith('/partner-requests')) {
      page = const PartnerRequestsPage();
    } else if (link.startsWith('/feedbacks')) {
      page = const FeedbacksPage();
    } else if (link.startsWith('/products')) {
      // Барааны tab руу буцна.
      nav.pop();
      adminTab.value = 'products';
      return;
    }
    if (page == null) return;
    // Буцахад мэдэгдлийн жагсаалт руу эргэж ирнэ.
    nav.push(MaterialPageRoute(builder: (_) => page!));
  }

  @override
  Widget build(BuildContext context) {
    final unread = context.select<AdminState, int>((a) => a.unreadNotifications);
    final rows = _rows;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Мэдэгдэл'),
        actions: [
          if (unread > 0)
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: TextButton(
                onPressed: () {
                  setState(() => _rows = [for (final r in _rows ?? <AdminNotification>[]) r.asRead()]);
                  context.read<AdminState>().markAllNotificationsRead();
                },
                child: const Text('Бүгдийг уншсан'),
              ),
            ),
        ],
      ),
      body: rows == null && _error != null
          ? Center(child: Padding(padding: const EdgeInsets.all(24), child: ErrorText(_error!, onRetry: _load)))
          : rows == null
              ? const Center(child: CircularProgressIndicator())
              : RefreshIndicator(
                  onRefresh: _load,
                  child: rows.isEmpty
                      ? ListView(children: const [
                          Padding(
                            padding: EdgeInsets.symmetric(horizontal: 24, vertical: 80),
                            child: Column(children: [
                              Icon(Icons.notifications_none_rounded, size: 40, color: AdminColors.mutedForeground),
                              SizedBox(height: 12),
                              Text('Мэдэгдэл алга', style: TextStyle(fontWeight: FontWeight.w600)),
                              SizedBox(height: 4),
                              Text('Шинэ захиалга, хүсэлт, санал хүсэлт ирэхэд энд харагдана.',
                                  textAlign: TextAlign.center, style: TextStyle(fontSize: 13, color: AdminColors.mutedForeground)),
                            ]),
                          ),
                        ])
                      : ListView(padding: const EdgeInsets.only(bottom: 24), children: [
                          AdminList(children: [for (final n in rows) _item(n)]),
                          if (rows.length < _count)
                            Padding(
                              padding: const EdgeInsets.all(16),
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
    final (icon, bg, fg) = _icons[n.type] ?? _icons['order']!;
    return Material(
      color: n.read ? Colors.white : AdminColors.primarySoft.withValues(alpha: 0.4),
      child: InkWell(
        onTap: () => _open(n),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(color: bg, shape: BoxShape.circle),
              child: Icon(icon, size: 20, color: fg),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(n.title, style: TextStyle(fontSize: 15, height: 1.3, fontWeight: n.read ? FontWeight.w500 : FontWeight.bold)),
                if (n.body != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Text(n.body!,
                        maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13, color: AdminColors.mutedForeground)),
                  ),
                const SizedBox(height: 4),
                Text(formatWhen(n.createdAt), style: const TextStyle(fontFamily: mono, fontSize: 12, color: AdminColors.mutedForeground)),
              ]),
            ),
            if (!n.read)
              Container(
                margin: const EdgeInsets.only(top: 8, left: 8),
                width: 10,
                height: 10,
                decoration: const BoxDecoration(color: AdminColors.primary, shape: BoxShape.circle),
              ),
          ]),
        ),
      ),
    );
  }
}

/// Алдааны мессеж + "Дахин оролдох".
class ErrorText extends StatelessWidget {
  final Object error;
  final VoidCallback onRetry;
  const ErrorText(this.error, {super.key, required this.onRetry});

  @override
  Widget build(BuildContext context) => Column(mainAxisSize: MainAxisSize.min, children: [
        Text(errorText(error), textAlign: TextAlign.center, style: const TextStyle(color: AdminColors.destructive)),
        TextButton(onPressed: onRetry, child: const Text('Дахин оролдох')),
      ]);
}
