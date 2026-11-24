import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';

import 'api/shop_models.dart';

/// Firebase (Google) Analytics — вэбийн src/lib/analytics.ts-тэй ижил худалдааны event-үүд:
/// view_item → add_to_cart → begin_checkout → purchase. Хэрэглэгч, сесс, first_open-ийг
/// Firebase өөрөө тоолно. Firebase PushService.init-д эхэлдэг; эхлээгүй бол чимээгүй алгасна.
class Analytics {
  static FirebaseAnalytics? get _ga =>
      Firebase.apps.isEmpty ? null : FirebaseAnalytics.instance;

  static Future<void> _run(
    Future<void> Function(FirebaseAnalytics ga) fn,
  ) async {
    final ga = _ga;
    if (ga == null) return;
    try {
      await fn(ga);
    } catch (e) {
      debugPrint('Analytics: $e');
    }
  }

  static AnalyticsEventItem _item(
    Object id,
    String name,
    double price,
    int qty, {
    String? variant,
  }) => AnalyticsEventItem(
    itemId: '$id',
    itemName: name,
    price: price,
    quantity: qty,
    itemVariant: variant,
  );

  static Future<void> screen(String name) =>
      _run((ga) => ga.logScreenView(screenName: name));

  static Future<void> viewItem(Product p) => _run(
    (ga) => ga.logViewItem(
      currency: 'MNT',
      value: p.price,
      items: [_item(p.id, p.name, p.price, 1)],
    ),
  );

  static Future<void> addToCart(Product p, ProductVariant v, int qty) => _run(
    (ga) => ga.logAddToCart(
      currency: 'MNT',
      value: v.price * qty,
      items: [
        _item(
          p.id,
          p.name,
          v.price,
          qty,
          variant: v.name.isEmpty ? null : v.name,
        ),
      ],
    ),
  );

  static Future<void> beginCheckout(List<CartLine> lines) => _run(
    (ga) => ga.logBeginCheckout(
      currency: 'MNT',
      value: lines.fold<double>(0, (s, l) => s + l.price * l.qty),
      items: [
        for (final l in lines)
          _item(l.postId ?? l.id, l.productName, l.price, l.qty),
      ],
    ),
  );

  /// transactionId = захиалгын дугаар (UVS-261124-K7M3QX)
  static Future<void> purchase(ShopOrder o) => _run(
    (ga) => ga.logPurchase(
      transactionId: o.id,
      currency: 'MNT',
      value: o.total,
      shipping: o.shipping,
      items: [
        for (final i in o.items) _item(i.name, i.name, i.price, i.quantity),
      ],
    ),
  );
}
