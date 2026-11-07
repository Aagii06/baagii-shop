import 'package:flutter/foundation.dart';

import 'admin_state.dart';
import 'shop_state.dart';

enum AppMode { loading, shop, admin }

/// Нэг апп, хоёр хэсэг: дэлгүүр ба админ. Админ нэвтэрсэн бол апп нээгдэхэд
/// шууд админ хэсэг рүү орно; админ хүссэн үедээ дэлгүүр рүү зочилж болно.
class AppState extends ChangeNotifier {
  final ShopState shop;
  final AdminState admin;
  AppMode mode = AppMode.loading;

  AppState(this.shop, this.admin) {
    admin.addListener(_onAdminChanged);
  }

  Future<void> init() async {
    final results = await Future.wait([admin.restore(), shop.init().then((_) => true)]);
    mode = results.first ? AppMode.admin : AppMode.shop;
    notifyListeners();
  }

  void openAdmin() {
    mode = AppMode.admin;
    notifyListeners();
  }

  void openShop() {
    mode = AppMode.shop;
    notifyListeners();
  }

  void _onAdminChanged() {
    // Сесс дууссан бол дэлгүүр рүү буцаана.
    if (!admin.signedIn && mode == AppMode.admin) {
      mode = AppMode.shop;
      notifyListeners();
    }
  }

  @override
  void dispose() {
    admin.removeListener(_onAdminChanged);
    super.dispose();
  }
}
