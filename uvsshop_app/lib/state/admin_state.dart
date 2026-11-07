import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../api/admin_models.dart';
import '../api/api_client.dart';
import '../config.dart';

/// Админ/худалдагчийн сесс. Нэвтэрсэн хэрэглэгчийг апп нээгдэхэд таньж шууд
/// админ хэсэг рүү оруулна (`AppState.mode`).
class AdminState extends ChangeNotifier {
  static const _tokenKey = 'uvs_admin_token';
  static const _userKey = 'uvs_admin_user';

  SharedPreferences? _prefs;
  String? _token;
  AdminUser? user;

  late final ApiClient api = ApiClient(AppConfig.adminApi, tokenProvider: () async => _token);

  bool get signedIn => _token != null && user != null;

  /// Хадгалсан токеныг сэргээж серверээр шалгана. Хүчинтэй бол true.
  Future<bool> restore() async {
    _prefs = await SharedPreferences.getInstance();
    _token = _prefs!.getString(_tokenKey);
    final raw = _prefs!.getString(_userKey);
    if (_token == null) return false;
    if (raw != null) {
      try {
        user = AdminUser.fromJson(jsonDecode(raw) as Map<String, dynamic>);
      } catch (_) {}
    }
    try {
      await _loadUserData();
      return signedIn;
    } on ApiException catch (e) {
      if (e.isAuth) {
        await signOut();
        return false;
      }
      // Сүлжээгүй үед хадгалсан хэрэглэгчээр үргэлжлүүлнэ.
      return signedIn;
    }
  }

  Future<void> login(String phone, String password) async {
    final res = await api.post('/auth/login', body: {'phone': phone, 'password': password}, auth: false);
    final token = res['data']?['token'] as String?;
    if (token == null) throw ApiException(200, res['message']?.toString() ?? 'Нэвтэрч чадсангүй');
    _token = token;
    await _prefs?.setString(_tokenKey, token);
    final u = res['data']?['user'];
    if (u is Map<String, dynamic>) user = AdminUser.fromJson(u);
    await _loadUserData();
    notifyListeners();
  }

  Future<void> _loadUserData() async {
    final res = await guard(() => api.get('/auth/getUserData'));
    final u = res['data']?['user'];
    if (u is! Map<String, dynamic>) {
      // Зочны токен — админ биш.
      throw ApiException(401, 'Нэвтрэх шаардлагатай', isAuth: true);
    }
    user = AdminUser.fromJson(u, store: res['data']?['store'] as Map<String, dynamic>?);
    await _prefs?.setString(_userKey, jsonEncode(user!.toJson()));
    notifyListeners();
  }

  Future<void> signOut() async {
    _token = null;
    user = null;
    await _prefs?.remove(_tokenKey);
    await _prefs?.remove(_userKey);
    notifyListeners();
  }

  /// Токен хүчингүй болбол сессийг цэвэрлэнэ (нэвтрэх хуудас руу буцна).
  Future<dynamic> guard(Future<dynamic> Function() fn) async {
    try {
      return await fn();
    } on ApiException catch (e) {
      if (e.isAuth) await signOut();
      rethrow;
    }
  }

  // ---------- тайлан ----------

  Future<SalesData> sales(String range) async {
    final res = await guard(() => api.get('/order/sales?range=$range'));
    return SalesData.fromJson(res['data'] as Map<String, dynamic>);
  }

  // ---------- захиалга ----------

  Future<({List<AdminOrder> rows, int count, int pending})> orders({
    int skip = 0,
    int take = 30,
    String? status,
    String? phone,
  }) async {
    final q = {'skip': '$skip', 'take': '$take', 'status': ?status, if (phone != null && phone.isNotEmpty) 'phone': phone};
    final res = await guard(() => api.get('/order?${Uri(queryParameters: q).query}'));
    final d = res['data'] as Map<String, dynamic>? ?? {};
    return (
      rows: ((d['rows'] as List?) ?? []).map((o) => AdminOrder.fromJson(o as Map<String, dynamic>)).toList(),
      count: toInt(d['count']),
      pending: toInt(d['pending']),
    );
  }

  Future<AdminOrder?> order(int id) async {
    final res = await guard(() => api.get('/order/$id'));
    final d = res['data'];
    return d == null ? null : AdminOrder.fromJson(d as Map<String, dynamic>);
  }

  Future<void> setOrderStatus(int id, String status) => guard(() => api.put('/order/$id/status', body: {'status': status}));
  Future<void> cancelOrder(int id) => guard(() => api.post('/order/$id/cancel'));
  Future<void> returnItem(int orderId, int itemId, int qty) =>
      guard(() => api.post('/order/$orderId/return', body: {'itemId': itemId, 'qty': qty}));

  // ---------- бараа ----------

  Future<({List<AdminProduct> rows, int count})> products({int skip = 0, int take = 30}) async {
    final sort = jsonEncode([
      {'selector': 'id', 'desc': true}
    ]);
    final q = {'skip': '$skip', 'take': '$take', 'sort': sort};
    final res = await guard(() => api.get('/product?${Uri(queryParameters: q).query}'));
    final d = res['data'] as Map<String, dynamic>? ?? {};
    return (
      rows: ((d['rows'] as List?) ?? []).map((p) => AdminProduct.fromJson(p as Map<String, dynamic>)).toList(),
      count: toInt(d['count']),
    );
  }
}
