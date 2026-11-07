import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../api/shop_models.dart';
import '../../config.dart';
import '../../state/shop_state.dart';
import '../common.dart';

class ProductPage extends StatefulWidget {
  final int productId;
  final Product? preview;
  const ProductPage({super.key, required this.productId, this.preview});
  @override
  State<ProductPage> createState() => _ProductPageState();
}

class _ProductPageState extends State<ProductPage> {
  ProductDetail? _detail;
  Object? _error;
  final Map<int, String> _picked = {};
  int _qty = 1;
  int _imageIndex = 0;
  bool _adding = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _error = null);
    try {
      final d = await context.read<ShopState>().getProduct(widget.productId);
      if (!mounted) return;
      setState(() {
        _detail = d;
        // Эхний бэлэн хувилбарыг урьдчилан сонгоно.
        final first = d.variants.where((v) => v.stock > 0).firstOrNull ?? d.variants.firstOrNull;
        if (first != null) _picked.addAll(first.attrs);
      });
    } catch (e) {
      if (mounted) setState(() => _error = e);
    }
  }

  ProductVariant? get _variant {
    final d = _detail;
    if (d == null || d.variants.isEmpty) return null;
    if (d.attrs.isEmpty) return d.variants.first;
    return d.variants.where((v) => d.attrs.every((a) => v.attrs[a.id] == _picked[a.id])).firstOrNull;
  }

  bool _valueAvailable(ProductAttr attr, String value) {
    final d = _detail!;
    return d.variants.any((v) =>
        v.stock > 0 &&
        v.attrs[attr.id] == value &&
        d.attrs.where((a) => a.id != attr.id).every((a) => _picked[a.id] == null || v.attrs[a.id] == _picked[a.id]));
  }

  Future<void> _add() async {
    final v = _variant;
    if (v == null) return;
    setState(() => _adding = true);
    try {
      await context.read<ShopState>().addToCart(v, _qty);
      if (mounted) showMessage(context, 'Сагсанд нэмэгдлээ');
    } catch (e) {
      if (mounted) showMessage(context, e.toString(), error: true);
    } finally {
      if (mounted) setState(() => _adding = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = _detail?.product ?? widget.preview;
    return Scaffold(
      appBar: AppBar(
        title: Text(p?.name ?? '', maxLines: 1, overflow: TextOverflow.ellipsis),
        actions: [
          if (p != null)
            Builder(builder: (context) {
              final saved = context.select<ShopState, bool>((s) => s.isSaved(p.id));
              return IconButton(
                tooltip: saved ? 'Хадгалснаас хасах' : 'Хадгалах',
                onPressed: () => context.read<ShopState>().toggleSaved(p),
                icon: Icon(saved ? Icons.favorite : Icons.favorite_border, color: saved ? Colors.red : null),
              );
            }),
        ],
      ),
      body: _detail == null
          ? (_error != null ? ErrorView(_error!, onRetry: _load) : const LoadingView())
          : _buildBody(_detail!),
      bottomNavigationBar: _detail == null ? null : _buildBottom(),
    );
  }

  Widget _buildBody(ProductDetail d) {
    final p = d.product;
    final v = _variant;
    final images = [
      if (v?.imageId != null) fileUrl(v!.imageId),
      ...p.imageIds.map((id) => fileUrl(id)),
    ].whereType<String>().toSet().toList();
    final price = v?.price ?? p.price;
    final original = v == null ? p.originalPrice : v.originalPrice;
    final description = stripHtml(p.description);

    return ListView(children: [
      AspectRatio(
        aspectRatio: 1,
        child: Container(
          color: Colors.white,
          child: images.isEmpty
              ? const NetImage(null)
              : Stack(children: [
                  PageView.builder(
                    itemCount: images.length,
                    onPageChanged: (i) => setState(() => _imageIndex = i),
                    itemBuilder: (_, i) => NetImage(images[i], fit: BoxFit.contain),
                  ),
                  if (images.length > 1)
                    Positioned(
                      bottom: 10,
                      left: 0,
                      right: 0,
                      child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                        for (var i = 0; i < images.length; i++)
                          Container(
                            width: 7,
                            height: 7,
                            margin: const EdgeInsets.symmetric(horizontal: 3),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: i == _imageIndex ? brandColor : Colors.grey.shade300,
                            ),
                          ),
                      ]),
                    ),
                ]),
        ),
      ),
      Container(
        color: Colors.white,
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(p.name, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w600)),
          if (p.storeName != null) ...[
            const SizedBox(height: 4),
            Row(children: [
              const Icon(Icons.store_outlined, size: 16, color: Colors.grey),
              const SizedBox(width: 4),
              Text(p.storeName!, style: TextStyle(color: Colors.grey.shade700)),
            ]),
          ],
          const SizedBox(height: 12),
          Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
            Text(money(price), style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: brandColor)),
            if (original != null) ...[
              const SizedBox(width: 8),
              Text(money(original),
                  style: TextStyle(color: Colors.grey.shade500, decoration: TextDecoration.lineThrough)),
            ],
          ]),
          const SizedBox(height: 4),
          Text(
            v == null ? 'Сонголтоо хийнэ үү' : (v.stock > 0 ? 'Үлдэгдэл: ${v.stock}' : 'Дууссан'),
            style: TextStyle(color: v != null && v.stock > 0 ? Colors.green.shade700 : Colors.red.shade700),
          ),
        ]),
      ),
      for (final attr in d.attrs)
        Container(
          color: Colors.white,
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('${attr.name}: ${_picked[attr.id] ?? ''}', style: const TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            Wrap(spacing: 8, runSpacing: 8, children: [
              for (final val in attr.values)
                ChoiceChip(
                  showCheckmark: false,
                  avatar: val.imageId != null
                      ? CircleAvatar(backgroundImage: NetworkImage(fileUrl(val.imageId, 'icon')!))
                      : (val.color != null && val.color!.startsWith('#') ? CircleAvatar(backgroundColor: _hex(val.color!)) : null),
                  label: Text(val.value),
                  selected: _picked[attr.id] == val.value,
                  onSelected: _valueAvailable(attr, val.value) || _picked[attr.id] == val.value
                      ? (_) => setState(() {
                            _picked[attr.id] = val.value;
                            _imageIndex = 0;
                          })
                      : null,
                ),
            ]),
          ]),
        ),
      if (description.isNotEmpty)
        Container(
          margin: const EdgeInsets.only(top: 8),
          color: Colors.white,
          padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Тайлбар', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
            const SizedBox(height: 8),
            SelectableText(description),
          ]),
        ),
      const SizedBox(height: 24),
    ]);
  }

  Color? _hex(String hex) {
    final v = int.tryParse(hex.substring(1).padLeft(6, '0').substring(0, 6), radix: 16);
    return v == null ? null : Color(0xFF000000 | v);
  }

  Widget _buildBottom() {
    final v = _variant;
    final canAdd = v != null && v.stock > 0;
    return SafeArea(
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
        decoration: BoxDecoration(color: Colors.white, border: Border(top: BorderSide(color: Colors.grey.shade200))),
        child: Row(children: [
          Container(
            decoration: BoxDecoration(border: Border.all(color: Colors.grey.shade300), borderRadius: BorderRadius.circular(10)),
            child: Row(children: [
              IconButton(onPressed: _qty > 1 ? () => setState(() => _qty--) : null, icon: const Icon(Icons.remove)),
              Text('$_qty', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              IconButton(
                onPressed: canAdd && _qty < v.stock ? () => setState(() => _qty++) : null,
                icon: const Icon(Icons.add),
              ),
            ]),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: FilledButton.icon(
              style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
              onPressed: canAdd && !_adding ? _add : null,
              icon: _adding
                  ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Icon(Icons.add_shopping_cart),
              label: Text(canAdd ? 'Сагсанд нэмэх' : 'Дууссан'),
            ),
          ),
        ]),
      ),
    );
  }
}
