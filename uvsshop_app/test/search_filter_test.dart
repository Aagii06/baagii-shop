import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uvsshop_app/api/shop_models.dart';
import 'package:uvsshop_app/state/admin_state.dart';
import 'package:uvsshop_app/state/app_state.dart';
import 'package:uvsshop_app/state/shop_nav.dart';
import 'package:uvsshop_app/state/shop_state.dart';
import 'package:uvsshop_app/ui/shop/search_page.dart';

/// Сервергүй: 2 ангилал, 2 дэлгүүр, 4 бараа.
class _FakeShop extends ShopState {
  final _all = [
    Product(id: 1, name: 'A1', price: 1000, categoryId: 10, storeName: 'Alpha', storeId: 1),
    Product(id: 2, name: 'A2', price: 5000, categoryId: 10, storeName: 'Beta', storeId: 2),
    Product(id: 3, name: 'B1', price: 20000, categoryId: 20, storeName: 'Alpha', storeId: 1),
    Product(id: 4, name: 'B2', price: 90000, categoryId: 20, storeName: 'Beta', storeId: 2),
  ];

  _FakeShop() {
    categories = [Category(id: 10, name: 'Хувцас'), Category(id: 20, name: 'Гутал')];
  }

  @override
  Future<List<Product>> getAllProducts({Set<int>? categoryIds, String? search}) async =>
      _all.where((p) => categoryIds == null || categoryIds.isEmpty || categoryIds.contains(p.categoryId)).toList();

  @override
  Future<List<Store>> getStores({bool refresh = false}) async => [Store(1, 'Alpha', null, 'gold', 2), Store(2, 'Beta', null, 'normal', 2)];
}

Future<void> _pump(WidgetTester t) async {
  SharedPreferences.setMockInitialValues({});
  t.view.physicalSize = const Size(1080, 2400);
  t.view.devicePixelRatio = 3;
  addTearDown(t.view.reset);
  final shop = _FakeShop();
  final admin = AdminState();
  await t.pumpWidget(MultiProvider(
    providers: [
      ChangeNotifierProvider<ShopState>.value(value: shop),
      ChangeNotifierProvider.value(value: admin),
      ChangeNotifierProvider.value(value: AppState(shop, admin)),
      ChangeNotifierProvider(create: (_) => ShopNav()),
    ],
    child: const MaterialApp(home: SearchPage()),
  ));
  await t.pumpAndSettle();
}

Future<void> _openSheet(WidgetTester t) async {
  await t.tap(find.text('Шүүлтүүр').first);
  await t.pumpAndSettle();
}

Future<void> _apply(WidgetTester t) async {
  await t.tap(find.text('Илэрц харах'));
  await t.pumpAndSettle();
}

void main() {
  testWidgets('category filter', (t) async {
    await _pump(t);
    expect(find.textContaining('4 бараа олдлоо'), findsOneWidget);
    await _openSheet(t);
    await t.tap(find.text('Гутал').last);
    await t.pumpAndSettle();
    await _apply(t);
    expect(find.textContaining('2 бараа олдлоо'), findsOneWidget);
  });

  testWidgets('store filter', (t) async {
    await _pump(t);
    await _openSheet(t);
    await t.scrollUntilVisible(find.text('Beta').last, 100, scrollable: find.byType(Scrollable).last);
    await t.tap(find.text('Beta').last);
    await t.pumpAndSettle();
    await _apply(t);
    expect(find.textContaining('2 бараа олдлоо'), findsOneWidget);
  });

  testWidgets('price filter', (t) async {
    await _pump(t);
    await _openSheet(t);
    final slider = find.byType(RangeSlider);
    await t.scrollUntilVisible(slider, 100, scrollable: find.byType(Scrollable).last);
    final box = t.getRect(slider);
    // Дээд утгыг баруун захаас дунд руу чирнэ.
    await t.dragFrom(Offset(box.right - 24, box.center.dy), Offset(-box.width * 0.6, 0));
    await t.pumpAndSettle();
    await _apply(t);
    expect(find.textContaining('4 бараа олдлоо'), findsNothing);
  });
}
