import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../api/shop_models.dart';
import '../../config.dart';
import '../../state/shop_state.dart';
import '../common.dart';
import 'checkout_page.dart';
import 'product_page.dart';
import 'package:uvsshop_app/i18n.dart';

class CartPage extends StatefulWidget {
  final VoidCallback onShop;
  const CartPage({super.key, required this.onShop});
  @override
  State<CartPage> createState() => _CartPageState();
}

class _CartPageState extends State<CartPage> {
  final Set<int> _busy = {};

  Future<void> _setQty(CartLine line, int qty) async {
    if (line.postProductId == null) return;
    setState(() => _busy.add(line.id));
    try {
      await context.read<ShopState>().setLineQty(
            postProductId: line.postProductId!,
            branchId: line.branchId,
            qty: qty,
            cartDetailId: line.id,
          );
    } catch (e) {
      if (mounted) showMessage(context, e.toString(), error: true);
    } finally {
      if (mounted) setState(() => _busy.remove(line.id));
    }
  }

  Future<void> _confirmClear(BuildContext context, ShopState shop, int count) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        icon: Icon(Icons.delete_outline, color: Colors.red.shade700),
        title: Text(tr('Сагсаа хоослох уу?')),
        content: Text(tr('Сагсанд байгаа {count} бараа бүгд хасагдана.', {'count': count})),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: Text(tr('Болих'))),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.red.shade700),
            onPressed: () => Navigator.pop(context, true),
            child: Text(tr('Сагс хоослох')),
          ),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await shop.clearCart();
    } catch (e) {
      if (context.mounted) showMessage(context, e.toString(), error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final shop = context.watch<ShopState>();
    final cart = shop.cart;
    return Scaffold(
      appBar: AppBar(
        title: Text(tr('Сагс')),
        actions: [
          // Баруун дээд буланд, улаан хүрээтэй — бүгдийг хасах үйлдэл гэдэг нь тод (вебтэй адил).
          if (cart.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.red.shade700,
                  side: BorderSide(color: Colors.red.shade200),
                  visualDensity: VisualDensity.compact,
                ),
                onPressed: () => _confirmClear(context, shop, cart.fold<int>(0, (n, l) => n + l.qty)),
                icon: const Icon(Icons.delete_outline, size: 18),
                label: Text(tr('Сагс хоослох')),
              ),
            ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: shop.refreshCart,
        child: cart.isEmpty
            ? ListView(children: [
                SizedBox(
                  height: 420,
                  child: EmptyView(
                    icon: Icons.shopping_bag_outlined,
                    text: tr('Сагс хоосон байна'),
                    action: FilledButton(onPressed: widget.onShop, child: Text(tr('Дэлгүүр хэсэх'))),
                  ),
                ),
              ])
            : ListView.separated(
                padding: const EdgeInsets.all(12),
                itemCount: cart.length + 1,
                separatorBuilder: (_, _) => const SizedBox(height: 8),
                itemBuilder: (context, i) {
                  if (i == cart.length) {
                    return Padding(
                      padding: const EdgeInsets.all(8),
                      child: Text(tr('Сагсанд нэмсэн бараа 1 цагийн дараа автоматаар хасагдана.'),
                          style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                    );
                  }
                  return _line(cart[i]);
                },
              ),
      ),
      bottomNavigationBar: cart.isEmpty
          ? null
          : SafeArea(
              child: Container(
                padding: const EdgeInsets.all(16),
                color: Colors.white,
                child: Row(children: [
                  Expanded(
                    child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(tr('Нийт ({cartCount} ширхэг)', {'cartCount': shop.cartCount}), style: TextStyle(color: Colors.grey.shade700)),
                      Text(money(shop.cartTotal), style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                    ]),
                  ),
                  FilledButton(
                    style: FilledButton.styleFrom(minimumSize: const Size(150, 48)),
                    onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const CheckoutPage())),
                    child: Text(tr('Захиалах')),
                  ),
                ]),
              ),
            ),
    );
  }

  Widget _line(CartLine l) {
    final busy = _busy.contains(l.id);
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: l.postId == null
            ? null
            : () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => ProductPage(productId: l.postId!))),
        child: Padding(
          padding: const EdgeInsets.all(10),
          child: Row(children: [
            NetImage(fileUrl(l.imageId, 'thumbnail'), width: 72, height: 72, radius: BorderRadius.circular(8)),
            const SizedBox(width: 12),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(l.productName, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w500)),
                if (l.variantName.isNotEmpty && l.variantName != l.productName)
                  Text(l.variantName, style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                const SizedBox(height: 4),
                Text(money(l.price), style: const TextStyle(fontWeight: FontWeight.bold, color: brandColor)),
              ]),
            ),
            if (busy)
              const Padding(padding: EdgeInsets.all(12), child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)))
            else
              Row(mainAxisSize: MainAxisSize.min, children: [
                IconButton(
                  visualDensity: VisualDensity.compact,
                  onPressed: () => _setQty(l, l.qty - 1),
                  icon: Icon(l.qty <= 1 ? Icons.delete_outline : Icons.remove),
                ),
                Text('${l.qty}', style: const TextStyle(fontWeight: FontWeight.w600)),
                IconButton(visualDensity: VisualDensity.compact, onPressed: () => _setQty(l, l.qty + 1), icon: const Icon(Icons.add)),
              ]),
          ]),
        ),
      ),
    );
  }
}
