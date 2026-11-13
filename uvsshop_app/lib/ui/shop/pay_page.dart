import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../api/shop_models.dart';
import '../../state/shop_state.dart';
import '../common.dart';

class PayPage extends StatefulWidget {
  final String orderId;
  const PayPage({super.key, required this.orderId});
  @override
  State<PayPage> createState() => _PayPageState();
}

class _PayPageState extends State<PayPage> {
  ShopOrder? _order;
  PaymentMethods? _methods;
  QpayInvoice? _invoice;
  Object? _error;
  String? _method;
  bool _busy = false;
  Timer? _poll;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _poll?.cancel();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _error = null);
    final shop = context.read<ShopState>();
    try {
      final results = await Future.wait([shop.getOrder(widget.orderId), shop.paymentMethods()]);
      if (!mounted) return;
      setState(() {
        _order = results[0] as ShopOrder;
        _methods = results[1] as PaymentMethods;
        _method ??= _methods!.qpay ? 'qpay' : (_methods!.bank != null ? 'bank' : null);
      });
      if (_method == 'qpay' && !_order!.isPaid && !_order!.isCancelled && !_order!.isReturned) _startQpay();
    } catch (e) {
      if (mounted) setState(() => _error = e);
    }
  }

  Future<void> _startQpay() async {
    if (_invoice != null) return;
    setState(() => _busy = true);
    try {
      final inv = await context.read<ShopState>().createQpay(widget.orderId);
      if (!mounted) return;
      setState(() => _invoice = inv);
      _poll?.cancel();
      _poll = Timer.periodic(const Duration(seconds: 5), (_) => _check(silent: true));
    } catch (e) {
      if (mounted) showMessage(context, e.toString(), error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  bool _checking = false;

  Future<void> _check({bool silent = false}) async {
    if (!silent) setState(() => _checking = true);
    try {
      final o = await context.read<ShopState>().checkQpay(widget.orderId);
      if (!mounted) return;
      setState(() => _order = o);
      if (o.isPaid) {
        _poll?.cancel();
      } else if (!silent) {
        showMessage(context, 'Төлбөр хараахан ороогүй байна');
      }
    } catch (e) {
      if (!silent && mounted) showMessage(context, e.toString(), error: true);
    } finally {
      if (!silent && mounted) setState(() => _checking = false);
    }
  }

  Future<void> _bankDone() async {
    setState(() => _busy = true);
    try {
      final o = await context.read<ShopState>().payByBank(widget.orderId);
      if (mounted) setState(() => _order = o);
    } catch (e) {
      if (mounted) showMessage(context, e.toString(), error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Захиалга #${widget.orderId}')),
      body: _order == null
          ? (_error != null ? ErrorView(_error!, onRetry: _load) : const LoadingView(kind: SkeletonKind.detail))
          : _body(_order!),
    );
  }

  Widget _body(ShopOrder o) {
    if (o.isReturned) {
      return const EmptyView(icon: Icons.undo, text: 'Энэ захиалга буцаагдсан байна.');
    }
    if (o.isPaid) {
      return EmptyView(
        icon: Icons.check_circle,
        text: 'Төлбөр амжилттай төлөгдлөө!\nТаны захиалгыг удахгүй хүргэнэ.',
        action: FilledButton(onPressed: () => Navigator.of(context).pop(), child: const Text('Буцах')),
      );
    }
    if (o.isCancelled) {
      return const EmptyView(icon: Icons.cancel_outlined, text: 'Энэ захиалга цуцлагдсан байна.');
    }
    final m = _methods!;
    return ListView(padding: const EdgeInsets.all(16), children: [
      Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(children: [
            const Expanded(child: Text('Төлөх дүн', style: TextStyle(fontSize: 16))),
            Text(money(o.total), style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: brandColor)),
          ]),
        ),
      ),
      const SizedBox(height: 16),
      if (m.qpay && m.bank != null)
        SegmentedButton<String>(
          segments: const [
            ButtonSegment(value: 'qpay', label: Text('QPay'), icon: Icon(Icons.qr_code_2)),
            ButtonSegment(value: 'bank', label: Text('Дансаар'), icon: Icon(Icons.account_balance_outlined)),
          ],
          selected: {_method ?? 'qpay'},
          onSelectionChanged: (s) {
            setState(() => _method = s.first);
            if (s.first == 'qpay') _startQpay();
          },
        ),
      const SizedBox(height: 16),
      if (_method == 'qpay') _qpay(),
      if (_method == 'bank' && m.bank != null) _bank(m.bank!, o),
      if (_method == null) const Text('Төлбөрийн хэлбэр тохируулагдаагүй байна. Дэлгүүртэй холбогдоно уу.'),
    ]);
  }

  Widget _qpay() {
    final inv = _invoice;
    if (inv == null) return const Pulse(child: Column(children: [Bone(height: 272, radius: 12), SizedBox(height: 16), Bone(height: 160, radius: 12)]));
    Widget? qr;
    try {
      final raw = inv.qrImage.contains(',') ? inv.qrImage.split(',').last : inv.qrImage;
      qr = Image.memory(base64Decode(raw), width: 240, height: 240, gaplessPlayback: true);
    } catch (_) {}
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      if (qr != null)
        Card(child: Padding(padding: const EdgeInsets.all(16), child: Center(child: qr))),
      const SizedBox(height: 12),
      const Text('Банкны аппаар QR уншуулах эсвэл доорх банкаа сонгон төлнө үү.', textAlign: TextAlign.center),
      const SizedBox(height: 12),
      GridView.count(
        crossAxisCount: 4,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        mainAxisSpacing: 8,
        crossAxisSpacing: 8,
        childAspectRatio: 0.8,
        children: [
          for (final b in inv.urls)
            InkWell(
              borderRadius: BorderRadius.circular(10),
              onTap: () async {
                final ok = await launchUrl(Uri.parse(b.link), mode: LaunchMode.externalApplication);
                if (!ok && mounted) showMessage(context, '${b.description} апп суусангүй байна', error: true);
              },
              child: Column(children: [
                NetImage(b.logo, width: 48, height: 48, radius: BorderRadius.circular(10)),
                const SizedBox(height: 4),
                Text(b.description, maxLines: 2, textAlign: TextAlign.center, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 11)),
              ]),
            ),
        ],
      ),
      const SizedBox(height: 16),
      OutlinedButton.icon(
        style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(48)),
        onPressed: _checking ? null : () => _check(),
        icon: _checking ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.refresh),
        label: const Text('Төлбөр шалгах'),
      ),
    ]);
  }

  Widget _bank(BankDetails b, ShopOrder o) {
    Widget row(String label, String value) => ListTile(
          dense: true,
          title: Text(label, style: TextStyle(color: Colors.grey.shade600)),
          subtitle: Text(value, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.black87)),
          trailing: IconButton(
            icon: const Icon(Icons.copy, size: 20),
            onPressed: () {
              Clipboard.setData(ClipboardData(text: value));
              showMessage(context, 'Хуулсан');
            },
          ),
        );
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      Card(
        child: Column(children: [
          row('Банк', b.bankName),
          row('Хүлээн авагч', b.accountName),
          row('Дансны дугаар', b.accountNumber),
          if (b.iban != null && b.iban!.isNotEmpty) row('IBAN', b.iban!),
          row('Гүйлгээний утга', o.id),
          row('Дүн', o.total.round().toString()),
        ]),
      ),
      const SizedBox(height: 12),
      if (o.paymentMethod == 'bank')
        const Text('Шилжүүлгийг шалгаж байна. Мөнгө орсны дараа захиалга баталгаажна.', textAlign: TextAlign.center)
      else
        FilledButton(
          style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
          onPressed: _busy ? null : _bankDone,
          child: _busy ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('Шилжүүлсэн'),
        ),
    ]);
  }
}
