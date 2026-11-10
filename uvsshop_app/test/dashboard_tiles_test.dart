import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uvsshop_app/api/admin_models.dart';
import 'package:uvsshop_app/state/admin_state.dart';
import 'package:uvsshop_app/ui/admin/admin_design.dart';
import 'package:uvsshop_app/ui/admin/dashboard_page.dart';

/// Сүлжээгүй, тогтмол өгөгдөлтэй AdminState.
class _FakeAdmin extends AdminState {
  @override
  Future<SalesData> sales(String range) async => SalesData('hour', 12, 2500000, 9, 2500000, []);
  @override
  Future<({List<AdminOrder> rows, int count, int pending})> orders(
          {int skip = 0, int take = 30, String? status, String? phone}) async =>
      (rows: <AdminOrder>[], count: 0, pending: 3);
  @override
  Future<List<AdminProduct>> allProducts() async => [];
  @override
  Future<void> refreshUnread() async {}
}

void main() {
  for (final width in [320.0, 412.0]) {
    testWidgets('4 stat tiles share one size at width $width', (t) async {
      SharedPreferences.setMockInitialValues({});
      t.view.physicalSize = Size(width, 900);
      t.view.devicePixelRatio = 1;
      addTearDown(t.view.reset);
      final admin = _FakeAdmin()..user = AdminUser(1, 'A', '8011', null, 'admin', null);
      await t.pumpWidget(ChangeNotifierProvider<AdminState>.value(
        value: admin,
        child: MaterialApp(theme: adminTheme, home: const DashboardPage()),
      ));
      await t.pumpAndSettle();
      expect(t.takeException(), isNull);
      // Орлогын өөрчлөлт 0 тул "Борлуулалт"-д % гарахгүй; "Захиалга"-д +3 гарна.
      final sizes = [
        for (final label in ['Захиалга', 'Борлуулалт', 'Дундаж дүн', 'Батлахыг хүлээж'])
          t.getSize(find.ancestor(of: find.text(label), matching: find.byType(InkWell)).first),
      ];
      for (final s in sizes) {
        expect(s, sizes.first, reason: 'sizes: $sizes');
      }
    });
  }
}
