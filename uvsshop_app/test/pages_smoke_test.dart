import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uvsshop_app/api/admin_models.dart';
import 'package:uvsshop_app/state/admin_state.dart';
import 'package:uvsshop_app/state/app_state.dart';
import 'package:uvsshop_app/state/shop_nav.dart';
import 'package:uvsshop_app/state/shop_state.dart';
import 'package:uvsshop_app/ui/admin/admin_design.dart';
import 'package:uvsshop_app/ui/admin/admin_shell.dart';
import 'package:uvsshop_app/ui/admin/attrs_page.dart';
import 'package:uvsshop_app/ui/admin/categories_page.dart';
import 'package:uvsshop_app/ui/admin/customers_page.dart';
import 'package:uvsshop_app/ui/admin/delivery_notes_page.dart';
import 'package:uvsshop_app/ui/admin/feedbacks_page.dart';
import 'package:uvsshop_app/ui/admin/notification_bell.dart';
import 'package:uvsshop_app/ui/admin/partner_requests_page.dart';
import 'package:uvsshop_app/ui/admin/password_page.dart';
import 'package:uvsshop_app/ui/admin/payment_page.dart';
import 'package:uvsshop_app/ui/admin/profile_edit_page.dart';
import 'package:uvsshop_app/ui/admin/settings_page.dart';
import 'package:uvsshop_app/ui/admin/stores_page.dart';
import 'package:uvsshop_app/ui/admin/users_page.dart';
import 'package:uvsshop_app/ui/shop/account_page.dart';
import 'package:uvsshop_app/ui/shop/addresses_page.dart';
import 'package:uvsshop_app/ui/shop/seller_page.dart';

Future<void> pumpPage(WidgetTester tester, Widget page, {ThemeData? theme}) async {
  SharedPreferences.setMockInitialValues({});
  final admin = AdminState()..user = AdminUser(1, 'Админ', '80113290', 'a@b.mn', 'admin', null);
  final shop = ShopState();
  final app = AppState(shop, admin);
  await tester.pumpWidget(MultiProvider(
    providers: [
      ChangeNotifierProvider.value(value: admin),
      ChangeNotifierProvider.value(value: shop),
      ChangeNotifierProvider.value(value: app),
      ChangeNotifierProvider(create: (_) => ShopNav()),
    ],
    child: MaterialApp(theme: theme ?? adminTheme, home: page),
  ));
  for (var i = 0; i < 5; i++) {
    await tester.pump(const Duration(milliseconds: 200));
  }
  expect(tester.takeException(), isNull);
}

void main() {
  for (final tab in ['dashboard', 'products', 'orders', 'profile']) {
    testWidgets('admin tab $tab', (t) async {
      adminTab.value = tab;
      await pumpPage(t, const AdminShell());
    });
  }
  final pages = <String, Widget>{
    'stores': const StoresPage(),
    'storeForm': const StoreFormPage(),
    'users': const UsersPage(),
    'userForm': const UserFormPage(),
    'customers': const CustomersPage(),
    'settings': const SettingsPage(),
    'categories': const CategoriesPage(),
    'categoryForm': const CategoryFormPage(categories: []),
    'attrs': const AttrsPage(),
    'attrForm': const AttrFormPage(),
    'payment': const PaymentPage(),
    'notes': const DeliveryNotesPage(),
    'feedbacks': const FeedbacksPage(),
    'partners': const PartnerRequestsPage(),
    'profileEdit': const ProfileEditPage(),
    'password': const PasswordPage(),
    'notifications': const NotificationsPage(),
  };
  pages.forEach((name, page) => testWidgets('admin page $name', (t) => pumpPage(t, page)));
  testWidgets('shop account', (t) => pumpPage(t, const AccountPage(), theme: ThemeData()));
  testWidgets('shop addresses', (t) => pumpPage(t, const AddressesPage(), theme: ThemeData()));
  testWidgets('shop seller', (t) => pumpPage(t, const SellerPage(), theme: ThemeData()));
}
