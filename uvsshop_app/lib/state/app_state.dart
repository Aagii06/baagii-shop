import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'admin_state.dart';
import 'shop_state.dart';

enum AppMode { loading, shop, admin }

/// Нэг апп, хоёр хэсэг: дэлгүүр ба админ. Апп сүүлд байсан хэсгээрээ нээгдэнэ:
/// админд байсан (мөн сесс нь хүчинтэй) бол админ, үгүй бол дэлгүүрийн нүүр.
class AppState extends ChangeNotifier {
  final ShopState shop;
  final AdminState admin;
  AppMode mode = AppMode.loading;
  static const _modeKey = 'uvs_last_mode';

  AppState(this.shop, this.admin) {
    admin.addListener(_onAdminChanged);
  }

  Future<void> init() async {
    final results = await Future.wait([admin.restore(), shop.init().then((_) => true), SharedPreferences.getInstance()]);
    final signedIn = results[0] as bool;
    final lastAdmin = (results[2] as SharedPreferences).getString(_modeKey) == 'admin';
    mode = signedIn && lastAdmin ? AppMode.admin : AppMode.shop;
    notifyListeners();
  }

  void openAdmin() => _setMode(AppMode.admin);

  void openShop() => _setMode(AppMode.shop);

  void _setMode(AppMode m) {
    mode = m;
    notifyListeners();
    // Дараа нээхэд энэ хэсгээрээ нээгдэнэ.
    SharedPreferences.getInstance().then((p) => p.setString(_modeKey, m == AppMode.admin ? 'admin' : 'shop'));
  }

  void _onAdminChanged() {
    // Сесс дууссан бол дэлгүүр рүү буцаана.
    if (!admin.signedIn && mode == AppMode.admin) _setMode(AppMode.shop);
  }

  @override
  void dispose() {
    admin.removeListener(_onAdminChanged);
    super.dispose();
  }
}
