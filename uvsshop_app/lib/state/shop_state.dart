import 'dart:convert';

import 'package:flutter/foundation.dart' show ChangeNotifier;
import 'package:shared_preferences/shared_preferences.dart';

import '../api/api_client.dart';
import '../api/shop_models.dart';
import '../config.dart';

/// Дэлгүүрийн тал: зочны/худалдан авагчийн токен, сагс, захиалга.
/// Сагс нь сервер дээр (`/cart`) хадгалагдана; утсаар нэвтрэхэд backend
/// зочны сагсыг худалдан авагч руу шилжүүлнэ.
class ShopState extends ChangeNotifier {
  static const _tokenKey = 'shop_token';
  static const _expiresKey = 'shop_token_expires';
  static const _guestTtl = Duration(hours: 24);

  late final ApiClient api = ApiClient(AppConfig.shopApi, tokenProvider: _ensureToken);
  late final ApiClient _publicApi = ApiClient(AppConfig.shopApi);

  SharedPreferences? _prefs;
  Future<String?>? _pendingLogin;

  Customer? customer;

  /// Хадгалсан бараа. Backend-гүй тул web-тэй адил утсан дээр, дугаар тус
  /// бүрээр (зочин бол "guest") хадгална.
  List<Product> saved = [];
  List<CartLine> cart = [];
  List<Category> categories = [];

  int get cartCount => cart.fold(0, (s, l) => s + l.qty);
  double get cartTotal => cart.fold(0, (s, l) => s + l.price * l.qty);
  bool get signedIn => customer != null;

  Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
    await Future.wait([refreshUser(), refreshCart(), loadCategories()]);
  }

  // ---------- токен ----------

  Future<String?> _ensureToken() async {
    final prefs = _prefs ??= await SharedPreferences.getInstance();
    final token = prefs.getString(_tokenKey);
    final expires = prefs.getInt(_expiresKey);
    if (token != null && (expires == null || DateTime.now().millisecondsSinceEpoch < expires)) return token;
    return _pendingLogin ??= _loginGuest().whenComplete(() => _pendingLogin = null);
  }

  Future<String?> _loginGuest() async {
    try {
      final res = await _publicApi.post('/auth/loginGuest', auth: false);
      final token = res['data']['token'] as String;
      await _prefs!.setString(_tokenKey, token);
      await _prefs!.setInt(_expiresKey, DateTime.now().add(_guestTtl).millisecondsSinceEpoch);
      cart = [];
      return token;
    } catch (_) {
      return null;
    }
  }

  Future<void> _clearToken() async {
    await _prefs?.remove(_tokenKey);
    await _prefs?.remove(_expiresKey);
  }

  /// Токен хүчингүй болсон бол нэг удаа шинэ зочин токеноор дахин оролдоно.
  Future<dynamic> call(Future<dynamic> Function() fn) async {
    try {
      return await fn();
    } on ApiException catch (e) {
      if (!e.isAuth) rethrow;
      await _clearToken();
      customer = null;
      notifyListeners();
      return await fn();
    }
  }

  // ---------- хэрэглэгч ----------

  Future<void> refreshUser() async {
    try {
      final res = await call(() => api.get('/auth/getUserData'));
      final c = res['data']?['customer'];
      customer = c == null ? null : Customer.fromJson(c as Map<String, dynamic>);
    } catch (_) {
      customer = null;
    }
    await _loadSaved();
    notifyListeners();
  }

  Future<void> sendOtp(String phone) async {
    await _publicApi.post('/auth/sendOtp', body: {'phone': phone}, auth: false);
  }

  /// Амжилттай бол true. Зочны сагс худалдан авагч руу шилжинэ.
  Future<bool> verifyOtp(String phone, String code) async {
    try {
      final res = await api.post('/auth/verifyOtp', body: {'phone': phone, 'code': code});
      await _prefs!.setString(_tokenKey, res['data']['token'] as String);
      await _prefs!.remove(_expiresKey);
      customer = Customer.fromJson(res['data']['customer'] as Map<String, dynamic>);
      await _loadSaved();
      notifyListeners();
      await refreshCart();
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<void> updateName(String name) async {
    await call(() => api.put('/auth/me', body: {'name': name}));
    await refreshUser();
  }

  Future<void> signOut() async {
    await _clearToken();
    customer = null;
    cart = [];
    await _loadSaved();
    notifyListeners();
    await _ensureToken();
  }

  // ---------- хадгалсан ----------

  String get _savedKey => 'saved_products:${customer?.phone ?? 'guest'}';

  Future<void> _loadSaved() async {
    final prefs = _prefs ??= await SharedPreferences.getInstance();
    try {
      final raw = prefs.getString(_savedKey);
      saved = raw == null
          ? []
          : (jsonDecode(raw) as List).map((p) => Product.fromJson(p as Map<String, dynamic>)).toList();
    } catch (_) {
      saved = [];
    }
  }

  bool isSaved(int id) => saved.any((p) => p.id == id);

  /// Байхгүй бол нэмнэ (эхэнд), байвал хасна.
  Future<void> toggleSaved(Product p) async {
    saved = isSaved(p.id) ? saved.where((s) => s.id != p.id).toList() : [p, ...saved];
    notifyListeners();
    await _prefs?.setString(_savedKey, jsonEncode(saved.map((s) => s.toJson()).toList()));
  }

  // ---------- каталог ----------

  Future<void> loadCategories() async {
    try {
      final res = await call(() => api.get('/category/getCategoryTree'));
      categories = ((res['data'] as List?) ?? []).map((c) => Category.fromJson(c as Map<String, dynamic>)).toList();
      notifyListeners();
    } catch (_) {}
  }

  Future<List<Product>> getProducts({int? categoryId, String? search, int page = 1, int limit = 20}) async {
    final q = <String, String>{'page': '$page', 'limit': '$limit'};
    if (categoryId != null) q['categoryId'] = '$categoryId';
    if (search != null && search.trim().isNotEmpty) q['search'] = search.trim();
    final res = await call(() => api.get('/post?${Uri(queryParameters: q).query}'));
    return ((res['data']['rows'] as List?) ?? [])
        .where((p) => p['isActive'] != false)
        .map((p) => Product.fromJson(p as Map<String, dynamic>))
        .toList();
  }

  Future<ProductDetail> getProduct(int id) async {
    final res = await call(() => api.get('/post/$id'));
    return ProductDetail.fromJson(res['data'] as Map<String, dynamic>);
  }

  // ---------- сагс ----------

  Future<void> refreshCart() async {
    try {
      final res = await call(() => api.get('/cart/getActiveCarts'));
      final rows = (res['data']['rows'] as List?) ?? [];
      cart = [
        for (final c in rows)
          for (final d in ((c['cartDetails'] as List?) ?? [])) CartLine.fromJson(d as Map<String, dynamic>),
      ];
    } catch (_) {}
    notifyListeners();
  }

  /// Хувилбарыг сагсанд нэмнэ (байгаа бол тоог нэмэгдүүлнэ).
  Future<void> addToCart(ProductVariant v, int qty) async {
    final existing = cart.where((l) => l.postProductId == v.id).firstOrNull;
    await setLineQty(
      postProductId: v.id,
      branchId: existing?.branchId ?? v.branchId,
      qty: (existing?.qty ?? 0) + qty,
      cartDetailId: existing?.id ?? 0,
    );
  }

  /// `qty` нь шинэ нийт тоо; 0 бол мөрийг устгана.
  Future<void> setLineQty({required int postProductId, required int branchId, required int qty, int cartDetailId = 0}) async {
    await call(() => api.post('/cart/addProduct', body: {
          'postProductId': postProductId,
          'qty': qty,
          'branchId': branchId,
          'cartDetailId': cartDetailId,
        }));
    await refreshCart();
  }

  // ---------- захиалга ----------

  Future<ShopOrder> placeOrder(Map<String, dynamic> shippingInfo, {String? couponCode}) async {
    final res = await call(() => api.post('/order', body: {
          'shippingInfo': shippingInfo,
          if (couponCode != null && couponCode.isNotEmpty) 'couponCode': couponCode,
        }));
    cart = [];
    notifyListeners();
    return ShopOrder.fromJson(res['data'] as Map<String, dynamic>);
  }

  Future<List<ShopOrder>> myOrders() async {
    final res = await call(() => api.get('/order'));
    return ((res['data']['rows'] as List?) ?? []).map((o) => ShopOrder.fromJson(o as Map<String, dynamic>)).toList();
  }

  Future<ShopOrder> getOrder(String id) async {
    final res = await call(() => api.get('/order/$id'));
    return ShopOrder.fromJson(res['data'] as Map<String, dynamic>);
  }

  Future<PaymentMethods> paymentMethods() async {
    final res = await call(() => api.get('/payment/methods'));
    return PaymentMethods.fromJson(res['data'] as Map<String, dynamic>);
  }

  Future<QpayInvoice> createQpay(String orderId) async {
    final res = await call(() => api.post('/order/$orderId/qpay'));
    return QpayInvoice.fromJson(res['data'] as Map<String, dynamic>);
  }

  Future<ShopOrder> checkQpay(String orderId) async {
    final res = await call(() => api.get('/order/$orderId/qpay'));
    return ShopOrder.fromJson(res['data'] as Map<String, dynamic>);
  }

  Future<ShopOrder> payByBank(String orderId) async {
    final res = await call(() => api.post('/order/$orderId/pay', body: {'paymentMethod': 'bank'}));
    return ShopOrder.fromJson(res['data'] as Map<String, dynamic>);
  }

  // ---------- хаяг ----------

  Future<List<AddressArea>> _areas(String path) async {
    final res = await call(() => api.get(path));
    return ((res['data']['rows'] as List?) ?? []).map((a) => AddressArea.fromJson(a as Map<String, dynamic>)).toList();
  }

  Future<List<AddressArea>> cities() => _areas('/customerAddress/cities');
  Future<List<AddressArea>> districts(int cityId) => _areas('/customerAddress/districts?cityId=$cityId');
  Future<List<AddressArea>> subDistricts(int districtId) => _areas('/customerAddress/subDistricts?districtId=$districtId');
}
