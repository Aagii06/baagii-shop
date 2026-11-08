import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../api/shop_models.dart';
import '../../config.dart';
import '../../state/shop_nav.dart';
import '../../state/shop_state.dart';
import '../common.dart';
import 'product_page.dart';
import 'store_page.dart';

/// web-ийн components/home/ProductCard.tsx-тэй адил: зураг (хямдралын хувь,
/// ♡ товч), үнэ, нэр, доор нь дэлгүүрийн pill.
class ProductCard extends StatelessWidget {
  final Product product;

  /// Дэлгүүрийн өөрийн хуудсанд бүх карт тэр дэлгүүрийнх — нэр харуулахгүй.
  final bool hideStore;
  const ProductCard(this.product, {super.key, this.hideStore = false});

  void _open(BuildContext context) =>
      Navigator.of(context).push(MaterialPageRoute(builder: (_) => ProductPage(productId: product.id, preview: product)));

  @override
  Widget build(BuildContext context) {
    final p = product;
    final discount = p.onSale ? p.discountPercent ?? 0 : 0;
    final border = BorderSide(color: Colors.grey.shade200);
    return Container(
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8), border: Border.fromBorderSide(border)),
      clipBehavior: Clip.antiAlias,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => _open(context),
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            AspectRatio(
              aspectRatio: 1,
              child: DecoratedBox(
                decoration: BoxDecoration(border: Border(bottom: border)),
                child: Stack(fit: StackFit.expand, children: [
                  NetImage(p.image('grid')),
                  if (discount > 0)
                    Positioned(
                      left: 8,
                      top: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(color: Colors.red.shade600, borderRadius: BorderRadius.circular(6)),
                        child: Text('-$discount%', style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                      ),
                    ),
                  Positioned(right: 8, top: 8, child: SaveButton(p)),
                ]),
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(12, 10, 12, 0),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Wrap(crossAxisAlignment: WrapCrossAlignment.end, spacing: 6, children: [
                    Text(money(p.price), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                    if (discount > 0)
                      Text(money(p.originalPrice!),
                          style: TextStyle(fontSize: 13, color: Colors.grey.shade500, decoration: TextDecoration.lineThrough)),
                  ]),
                  const SizedBox(height: 4),
                  Text(p.name, maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 13, color: Colors.grey.shade700, height: 1.35)),
                ]),
              ),
            ),
            if (p.storeName != null && !hideStore)
              Padding(
                padding: const EdgeInsets.fromLTRB(10, 6, 10, 10),
                child: StorePill(name: p.storeName!, logo: p.storeLogo, storeId: p.storeId),
              )
            else
              const SizedBox(height: 10),
          ]),
        ),
      ),
    );
  }
}

/// Дэлгүүрийн нэр + лого — дарвал тэр дэлгүүрийн бараагаар хайна (web: /search?store=).
class StorePill extends StatelessWidget {
  final String name;
  final String? logo;
  final int? storeId;
  const StorePill({super.key, required this.name, this.logo, this.storeId});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.grey.shade50,
      shape: StadiumBorder(side: BorderSide(color: Colors.grey.shade200)),
      child: InkWell(
        customBorder: const StadiumBorder(),
        onTap: () {
          if (storeId != null) return openStore(context, storeId!);
          Navigator.of(context).popUntil((r) => r.isFirst);
          context.read<ShopNav>().openSearch(SearchRequest(store: name));
        },
        child: Padding(
          padding: const EdgeInsets.fromLTRB(3, 3, 8, 3),
          child: Row(children: [
            StoreAvatar(name: name, logo: logo, size: 22),
            const SizedBox(width: 6),
            Expanded(
              child: Text(name,
                  maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w500, color: Colors.grey.shade700)),
            ),
            Icon(Icons.chevron_right, size: 14, color: Colors.grey.shade400),
          ]),
        ),
      ),
    );
  }
}

/// Дэлгүүрийн лого; байхгүй бол нэрний эхний үсгүүд (web-ийн StoreAvatar).
class StoreAvatar extends StatelessWidget {
  final String name;
  final String? logo;
  final double size;
  final double radius;
  const StoreAvatar({super.key, required this.name, this.logo, this.size = 40, this.radius = 999});

  String get _initials {
    final words = name.trim().split(RegExp(r'\s+')).where((w) => w.isNotEmpty).toList();
    if (words.isEmpty) return '?';
    final s = words.length == 1 ? words.first.characters.take(2).toString() : words.take(2).map((w) => w.characters.first).join();
    return s.toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    final url = fileUrl(logo, size > 64 ? 'thumbnail' : 'icon');
    final initials = Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      color: brandColor.withValues(alpha: 0.1),
      child: Text(_initials, style: TextStyle(color: brandColor, fontWeight: FontWeight.bold, fontSize: size * 0.36)),
    );
    return ClipRRect(
      borderRadius: BorderRadius.circular(radius),
      child: Container(
        width: size,
        height: size,
        color: Colors.white,
        child: url == null ? initials : NetImage(url, fit: BoxFit.contain, width: size, height: size),
      ),
    );
  }
}

/// ♡ — барааг хадгалах / хасах (web-ийн хадгалсантай адил).
class SaveButton extends StatelessWidget {
  final Product product;
  const SaveButton(this.product, {super.key});

  @override
  Widget build(BuildContext context) {
    final saved = context.select<ShopState, bool>((s) => s.isSaved(product.id));
    return Material(
      color: Colors.white,
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6), side: BorderSide(color: Colors.grey.shade200)),
      child: InkWell(
        borderRadius: BorderRadius.circular(6),
        onTap: () => context.read<ShopState>().toggleSaved(product),
        child: SizedBox(
          width: 34,
          height: 34,
          child: Icon(saved ? Icons.favorite : Icons.favorite_border, size: 18, color: saved ? Colors.red : brandColor),
        ),
      ),
    );
  }
}

/// web-ийн ProductList — 2 баганатай grid (утсан дээр).
class ProductGrid extends StatelessWidget {
  final List<Product> products;
  final bool hideStore;
  const ProductGrid(this.products, {super.key, this.hideStore = false});

  @override
  Widget build(BuildContext context) => GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        padding: EdgeInsets.zero,
        gridDelegate: productGridDelegate,
        itemCount: products.length,
        itemBuilder: (_, i) => ProductCard(products[i], hideStore: hideStore),
      );
}

const productGridDelegate = SliverGridDelegateWithMaxCrossAxisExtent(
  maxCrossAxisExtent: 240,
  mainAxisSpacing: 12,
  crossAxisSpacing: 12,
  childAspectRatio: 0.56,
);
