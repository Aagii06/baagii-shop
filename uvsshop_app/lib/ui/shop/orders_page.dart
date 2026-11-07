import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../api/shop_models.dart';
import '../../config.dart';
import '../../state/shop_state.dart';
import '../common.dart';
import 'pay_page.dart';
import 'sign_in_page.dart';

class OrdersPage extends StatefulWidget {
  const OrdersPage({super.key});
  @override
  State<OrdersPage> createState() => _OrdersPageState();
}

class _OrdersPageState extends State<OrdersPage> {
  Future<List<ShopOrder>>? _future;
  int? _customerId;

  void _reload() => setState(() => _future = context.read<ShopState>().myOrders());

  @override
  Widget build(BuildContext context) {
    final customer = context.watch<ShopState>().customer;
    if (customer?.id != _customerId) {
      _customerId = customer?.id;
      _future = customer == null ? null : context.read<ShopState>().myOrders();
    }
    return Scaffold(
      appBar: AppBar(title: const Text('Миний захиалгууд')),
      body: customer == null
          ? EmptyView(
              icon: Icons.receipt_long_outlined,
              text: 'Захиалгаа харахын тулд нэвтэрнэ үү',
              action: FilledButton(
                onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SignInPage())),
                child: const Text('Нэвтрэх'),
              ),
            )
          : RefreshIndicator(
              onRefresh: () async => _reload(),
              child: FutureBuilder<List<ShopOrder>>(
                future: _future,
                builder: (context, snap) {
                  if (snap.connectionState != ConnectionState.done) return const LoadingView();
                  if (snap.hasError) return ListView(children: [SizedBox(height: 400, child: ErrorView(snap.error!, onRetry: _reload))]);
                  final orders = snap.data ?? [];
                  if (orders.isEmpty) {
                    return ListView(children: const [SizedBox(height: 400, child: EmptyView(icon: Icons.receipt_long_outlined, text: 'Захиалга алга'))]);
                  }
                  return ListView.separated(
                    padding: const EdgeInsets.all(12),
                    itemCount: orders.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 8),
                    itemBuilder: (_, i) => _OrderCard(orders[i], onChanged: _reload),
                  );
                },
              ),
            ),
    );
  }
}

class _OrderCard extends StatelessWidget {
  final ShopOrder order;
  final VoidCallback onChanged;
  const _OrderCard(this.order, {required this.onChanged});

  @override
  Widget build(BuildContext context) {
    final o = order;
    final needsPay = !o.isPaid && o.status == 'pending' && o.paymentMethod != 'bank';
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => OrderDetailPage(order: o))),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Text('#${o.id}', style: const TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(width: 8),
              Text(formatDate(o.createdAt), style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
              const Spacer(),
              StatusChip(o.label, orderStatusColor(o.status, paid: o.isPaid)),
            ]),
            const SizedBox(height: 10),
            SizedBox(
              height: 48,
              child: ListView(scrollDirection: Axis.horizontal, children: [
                for (final i in o.items)
                  Padding(
                    padding: const EdgeInsets.only(right: 6),
                    child: NetImage(fileUrl(i.imageId, 'icon'), width: 48, height: 48, radius: BorderRadius.circular(6)),
                  ),
              ]),
            ),
            const SizedBox(height: 10),
            Row(children: [
              Text('${o.items.fold<int>(0, (s, i) => s + i.quantity)} бараа', style: TextStyle(color: Colors.grey.shade700)),
              const Spacer(),
              Text(money(o.total), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            ]),
            if (needsPay) ...[
              const SizedBox(height: 10),
              FilledButton(
                style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(40)),
                onPressed: () async {
                  await Navigator.of(context).push(MaterialPageRoute(builder: (_) => PayPage(orderId: o.id)));
                  onChanged();
                },
                child: const Text('Төлбөр төлөх'),
              ),
            ],
          ]),
        ),
      ),
    );
  }
}

class OrderDetailPage extends StatelessWidget {
  final ShopOrder order;
  const OrderDetailPage({super.key, required this.order});

  @override
  Widget build(BuildContext context) {
    final o = order;
    Widget sum(String l, double v, {bool bold = false}) => Padding(
          padding: const EdgeInsets.symmetric(vertical: 3),
          child: Row(children: [
            Expanded(child: Text(l, style: TextStyle(fontWeight: bold ? FontWeight.bold : null))),
            Text(money(v), style: TextStyle(fontWeight: bold ? FontWeight.bold : null, fontSize: bold ? 16 : null)),
          ]),
        );
    return Scaffold(
      appBar: AppBar(title: Text('Захиалга #${o.id}')),
      body: ListView(padding: const EdgeInsets.all(12), children: [
        Card(
          child: ListTile(
            title: Text(o.label),
            subtitle: Text(formatDate(o.createdAt)),
            trailing: Icon(Icons.circle, color: orderStatusColor(o.status, paid: o.isPaid), size: 14),
          ),
        ),
        const SizedBox(height: 8),
        Card(
          child: Column(children: [
            for (final i in o.items)
              ListTile(
                leading: NetImage(fileUrl(i.imageId, 'icon'), width: 48, height: 48, radius: BorderRadius.circular(6)),
                title: Text(i.name, maxLines: 2, overflow: TextOverflow.ellipsis),
                subtitle: Text('${money(i.price)} × ${i.quantity}'),
                trailing: Text(money(i.price * i.quantity)),
              ),
          ]),
        ),
        const SizedBox(height: 8),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('Хүргэлт', style: TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              Text('${o.fullName} · ${o.phone}'),
              Text(o.address),
              if (o.note != null && o.note!.isNotEmpty) Text('Тэмдэглэл: ${o.note}'),
              const Divider(height: 24),
              sum('Барааны дүн', o.subtotal),
              sum('Хүргэлт', o.shipping),
              if (o.coupon > 0) sum('Хөнгөлөлт', -o.coupon),
              sum('Нийт', o.total, bold: true),
            ]),
          ),
        ),
      ]),
    );
  }
}
