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

  /// Хадгалсан хүргэлтийн хаягууд (дугаар тус бүрээр, хамгийн ихдээ [maxAddresses]).
  List<SavedAddress> addresses = [];
  static const maxAddresses = 3;
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

  // ---------- борлуулагч болох (web-ийн /seller) ----------

  Future<void> sendSellerOtp(String phone) =>
      _publicApi.post('/auth/register/sendOtp', body: {'phone': phone}, auth: false);

  /// Утсыг баталсан 30 минутын токен.
  Future<String> verifySellerOtp(String phone, String code) async {
    final res = await _publicApi.post('/auth/register/verifyOtp', body: {'phone': phone, 'code': code}, auth: false);
    return res['data']['phoneToken'].toString();
  }

  /// Хамтран ажиллах хүсэлт илгээнэ; админ батлахад дэлгүүр нээгдэнэ.
  Future<void> registerSeller({
    required String phone,
    required String phoneToken,
    required String storeName,
    required String name,
    String? email,
    String? address,
  }) =>
      call(() => api.post('/auth/register', body: {
            'userName': phone,
            'phoneToken': phoneToken,
            'storeName': storeName,
            'name': name,
            'email': ?email,
            'address': ?address,
          }));

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

  // ---------- хаягууд ----------

  String get _addressKey => 'delivery_addresses:${customer?.phone ?? 'guest'}';

  void _loadAddresses() {
    try {
      final raw = _prefs?.getString(_addressKey);
      addresses = raw == null
          ? []
          : (jsonDecode(raw) as List).map((a) => SavedAddress.fromJson(a as Map<String, dynamic>)).toList();
    } catch (_) {
      addresses = [];
    }
  }

  Future<void> _storeAddresses() async {
    notifyListeners();
    await _prefs?.setString(_addressKey, jsonEncode(addresses.map((a) => a.toJson()).toList()));
  }

  /// Эхнийх нь үндсэн болно.
  Future<void> addAddress(SavedAddress a) async {
    if (addresses.length >= maxAddresses) return;
    addresses = [
      ...addresses,
      SavedAddress(
        id: 'addr-${DateTime.now().microsecondsSinceEpoch.toRadixString(36)}',
        label: a.label,
        address: a.address,
        area: a.area,
        detail: a.detail,
        isDefault: addresses.isEmpty,
      ),
    ];
    await _storeAddresses();
  }

  Future<void> updateAddress(String id, SavedAddress a) async {
    addresses = [
      for (final x in addresses)
        x.id == id ? SavedAddress(id: id, label: a.label, address: a.address, area: a.area, detail: a.detail, isDefault: x.isDefault) : x,
    ];
    await _storeAddresses();
  }

  Future<void> removeAddress(String id) async {
    final next = addresses.where((a) => a.id != id).toList();
    // Үндсэн нь устсан бол эхнийхийг үндсэн болгоно.
    if (next.isNotEmpty && !next.any((a) => a.isDefault)) next[0] = next[0].copyWith(isDefault: true);
    addresses = next;
    await _storeAddresses();
  }

  Future<void> setDefaultAddress(String id) async {
    addresses = [for (final a in addresses) a.copyWith(isDefault: a.id == id)];
    await _storeAddresses();
  }

  List<AddressType>? _addressTypes;

  Future<List<AddressType>> addressTypes() async {
    if (_addressTypes != null) return _addressTypes!;
    final res = await call(() => api.get('/customerAddress/addressTypes'));
    return _addressTypes =
        ((res['data']?['rows'] as List?) ?? []).map((t) => AddressType.fromJson(t as Map<String, dynamic>)).toList();
  }

  Future<void> _loadSaved() async {
    final prefs = _prefs ??= await SharedPreferences.getInstance();
    _loadAddresses();
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

  /// Бүх бараа (web-тэй адил нэг дор татаж, шүүлт/эрэмбийг утсан дээр хийнэ).
  /// Ангилал өгвөл тэр ангилал болон бүх дэд ангиллынх.
  Future<List<Product>> getAllProducts({Set<int>? categoryIds, String? search}) async {
    if (categoryIds == null || categoryIds.isEmpty) {
      return getProducts(search: search, limit: 1000);
    }
    final lists = await Future.wait(categoryIds.map((id) => getProducts(categoryId: id, search: search, limit: 1000)));
    final seen = <int>{};
    return [for (final l in lists) ...l].where((p) => seen.add(p.id)).toList();
  }

  List<Store>? _stores;

  Future<List<Store>> getStores({bool refresh = false}) async {
    if (_stores != null && !refresh) return _stores!;
    final res = await call(() => api.get('/store'));
    return _stores = ((res['data'] as List?) ?? []).map((s) => Store.fromJson(s as Map<String, dynamic>)).toList();
  }

  /// Нэг дэлгүүр холбоо барих мэдээлэлтэй (`/store/{id}`). Хуучин backend-д
  /// энэ endpoint байхгүй бол жагсаалтаас (холбоо баригүй); олдохгүй бол null.
  Future<Store?> getStore(int id) async {
    try {
      final res = await call(() => api.get('/store/$id'));
      if (res['data'] != null) return Store.fromJson(res['data'] as Map<String, dynamic>);
    } catch (_) {}
    final list = await getStores();
    return list.where((s) => s.id == id).firstOrNull;
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
