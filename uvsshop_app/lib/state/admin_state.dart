import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../api/admin_manage_models.dart';
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

  // ---------- өөрийн профайл ----------

  void _setUser(dynamic u) {
    if (u is! Map<String, dynamic>) return;
    // /auth/me хариунд дэлгүүр байхгүй байж болох тул хуучныг хадгална.
    final store = u['store'] ?? (user?.storeName == null ? null : {'id': user!.storeId, 'name': user!.storeName});
    user = AdminUser.fromJson({...u, 'store': store});
    _prefs?.setString(_userKey, jsonEncode(user!.toJson()));
    notifyListeners();
  }

  /// Зураг хуулж file id-г нь буцаана. [folder]: products, stores, users, blogs.
  Future<String> uploadImage(List<int> bytes, String filename, String folder) async {
    final res = await guard(() => api.upload('/file/upload', bytes: bytes, filename: filename, fields: {'folder': folder}));
    final id = res['data']?['id']?.toString();
    if (id == null || id.isEmpty) throw ApiException(200, res['message']?.toString() ?? 'Зураг хуулж чадсангүй');
    return id;
  }

  Future<void> sendPhoneOtp(String phone) => guard(() => api.post('/auth/me/sendOtp', body: {'phone': phone}));

  /// Нэр, утас, лого хадгална. Шинэ утсанд SMS [code] шаардана; [email]-д одоогийнх эсвэл "" (хасах).
  Future<void> updateMe({required String name, required String phone, required String email, String? logo, String? code}) async {
    final res = await guard(() => api.put('/auth/me', body: {
          'name': name,
          'phone': phone,
          'email': email,
          'logo': logo,
          'code': ?code,
        }));
    _setUser(res['data']);
  }

  Future<void> sendEmailOtp(String email) => guard(() => api.post('/auth/me/email/sendOtp', body: {'email': email}));

  Future<void> changeEmail(String email, String code) async {
    final res = await guard(() => api.put('/auth/me/email', body: {'email': email, 'code': code}));
    _setUser(res['data']);
  }

  /// Одоогийн нууц үгийг шалгаад имэйл рүү код илгээнэ. Нууцалсан имэйлийг буцаана.
  Future<String> sendPasswordOtp(String password, String newPassword) async {
    final res = await guard(() => api.post('/auth/me/password/sendOtp',
        body: {'password': password, 'newPassword': newPassword, 'confirmPassword': newPassword}));
    return res['data']?['email']?.toString() ?? '';
  }

  Future<void> changePassword(String password, String newPassword, String code) => guard(() => api.put('/auth/me/password',
      body: {'password': password, 'newPassword': newPassword, 'confirmPassword': newPassword, 'code': code}));

  // ---------- жагсаалтын туслах ----------

  List<Map<String, dynamic>> _rowsOf(dynamic res) =>
      ((res['data']?['rows'] as List?) ?? []).cast<Map<String, dynamic>>();

  /// take/skip-тэй жагсаалтын бүх мөр (id дарааллаар).
  Future<List<Map<String, dynamic>>> _allRows(String path) async {
    final rows = <Map<String, dynamic>>[];
    final sort = jsonEncode([
      {'selector': 'id', 'desc': false}
    ]);
    while (true) {
      final q = Uri(queryParameters: {'take': '100', 'skip': '${rows.length}', 'sort': sort}).query;
      final res = await guard(() => api.get('$path?$q'));
      final page = _rowsOf(res);
      rows.addAll(page);
      if (page.isEmpty || rows.length >= toInt(res['data']?['count'])) return rows;
    }
  }

  // ---------- дэлгүүр ----------

  /// Түвшнээр (gold эхэнд), дараа нь хуучин нь эхэндээ.
  Future<List<Store>> stores() async {
    final res = await guard(() => api.get('/store'));
    final rows = _rowsOf(res).map(Store.fromJson).toList();
    int rank(Store s) => storeTiers.indexOf(s.tier);
    rows.sort((a, b) {
      final r = rank(a) - rank(b);
      if (r != 0) return r;
      final c = a.createdAt.compareTo(b.createdAt);
      return c != 0 ? c : a.id - b.id;
    });
    return rows;
  }

  Future<Store?> store(int id) async {
    final res = await guard(() => api.get('/store/$id'));
    final d = res['data'];
    return d is Map<String, dynamic> ? Store.fromJson(d) : null;
  }

  Future<void> saveStore(int? id, Map<String, dynamic> input) =>
      guard(() => id == null ? api.post('/store', body: input) : api.put('/store/$id', body: input));
  Future<void> deleteStore(int id) => guard(() => api.delete('/store/$id'));

  // ---------- байршил ----------

  final Map<String, Future<List<Area>>> _areas = {};

  Future<List<Area>> _areaList(String path) => _areas.putIfAbsent(path, () async {
        try {
          final res = await guard(() => api.get(path));
          return _rowsOf(res).map((a) => Area(toInt(a['id']), a['name']?.toString() ?? '')).toList();
        } catch (_) {
          _areas.remove(path);
          rethrow;
        }
      });

  Future<List<Area>> cities() => _areaList('/location/cities');
  Future<List<Area>> districts(int cityId) => _areaList('/location/districts?cityId=$cityId');
  Future<List<Area>> subDistricts(int districtId) => _areaList('/location/subDistricts?districtId=$districtId');

  // ---------- хэрэглэгч ----------

  Future<List<PanelUser>> users() async => _rowsOf(await guard(() => api.get('/user'))).map(PanelUser.fromJson).toList();
  Future<void> saveUser(int? id, Map<String, dynamic> input) =>
      guard(() => id == null ? api.post('/user', body: input) : api.put('/user/$id', body: input));
  Future<void> deleteUser(int id) => guard(() => api.delete('/user/$id'));

  // ---------- худалдан авагч ----------

  Future<List<Customer>> customers() async =>
      _rowsOf(await guard(() => api.get('/customer'))).map(Customer.fromJson).toList();
  Future<void> deleteCustomer(int id, String password) =>
      guard(() => api.delete('/customer/$id', body: {'password': password}));

  // ---------- санал хүсэлт ----------

  Future<List<FeedbackMsg>> feedbacks() async =>
      _rowsOf(await guard(() => api.get('/feedback'))).map(FeedbackMsg.fromJson).toList();
  Future<void> setFeedbackRead(int id, bool read) => guard(() => api.post('/feedback/$id/${read ? 'read' : 'unread'}'));
  Future<void> deleteFeedback(int id) => guard(() => api.delete('/feedback/$id'));

  // ---------- хамтран ажиллах хүсэлт ----------

  Future<({List<PartnerRequest> rows, int count, Map<String, int> stats})> partnerRequests(
      {int skip = 0, int take = 20, String? status}) async {
    final q = Uri(queryParameters: {'skip': '$skip', 'take': '$take', 'status': ?status}).query;
    final res = await guard(() => api.get('/partnerRequest?$q'));
    final d = res['data'] as Map<String, dynamic>? ?? {};
    final st = d['stats'] as Map? ?? {};
    return (
      rows: _rowsOf(res).map(PartnerRequest.fromJson).toList(),
      count: toInt(d['count']),
      stats: {for (final k in partnerStatusLabel.keys) k: toInt(st[k])},
    );
  }

  Future<void> approvePartner(int id, String password, String storeName) =>
      guard(() => api.post('/partnerRequest/$id/approve', body: {'password': password, 'storeName': storeName}));
  Future<void> rejectPartner(int id) => guard(() => api.post('/partnerRequest/$id/reject'));
  Future<void> revertPartner(int id) => guard(() => api.post('/partnerRequest/$id/revert'));

  // ---------- хүргэлтийн тэмдэглэл ----------

  Future<List<DoNote>> doNotes() async => _rowsOf(await guard(() => api.get('/doNote'))).map(DoNote.fromJson).toList();

  // ---------- төлбөр ----------

  Future<PaymentSettings> paymentSettings() async =>
      PaymentSettings.fromJson((await guard(() => api.get('/paymentSetting')))['data'] as Map<String, dynamic>);

  Future<PaymentSettings> savePaymentSettings(Map<String, dynamic> input) async =>
      PaymentSettings.fromJson((await guard(() => api.put('/paymentSetting', body: input)))['data'] as Map<String, dynamic>);

  // ---------- категори ----------

  Future<List<Category>> categoryTree() async {
    final res = await guard(() => api.get('/category/tree'));
    return ((res['data'] as List?) ?? []).map((c) => Category.fromJson(c as Map<String, dynamic>)).toList();
  }

  Future<void> createCategory(String name, int? parentId, List<int> attrIds) =>
      guard(() => api.post('/category', body: {'name': name, 'parentId': parentId, 'attrIds': attrIds}));

  /// Маягтын талбаруудыг хадгална; бусад нь хэвээр буцна.
  Future<void> updateCategory(Category c, {required String name, required int? parentId, required List<int> attrIds}) =>
      guard(() => api.put('/category/${c.id}', body: {
            'name': name,
            'parentId': parentId,
            'code': c.raw['code'],
            'image': c.raw['image'],
            'childs': c.raw['childs'],
            'style': c.raw['style'],
            'attrIds': attrIds,
          }));

  /// Навч категори анхны дэд категоритой болбол өөрийн үзүүлэлтээ алдана.
  Future<void> releaseParentAttrs(Category? parent) async {
    if (parent != null && parent.isLeaf && parent.attrs.isNotEmpty) {
      await updateCategory(parent, name: parent.name, parentId: parent.parentId, attrIds: []);
    }
  }

  Future<void> moveCategory(int id, int? parentId, int index) =>
      guard(() => api.put('/category/$id/move', body: {'parentId': parentId, 'index': index}));
  Future<void> deleteCategory(int id) => guard(() => api.delete('/category/$id'));

  // ---------- үзүүлэлт ----------

  Future<List<AttrRecord>> attrRecords() async => (await _allRows('/attr')).map(AttrRecord.fromJson).toList();

  Future<AttrRecord?> attr(int id) async {
    final d = (await guard(() => api.get('/attr/$id')))['data'];
    return d is Map<String, dynamic> ? AttrRecord.fromJson(d) : null;
  }

  /// Утгуудтай нь (жагсаалт дутуу илгээсэн бол тус бүрээр нь уншина).
  Future<List<AttrRecord>> attrsFull() async {
    final rows = await attrRecords();
    return Future.wait(rows.map((r) async => r.values.length < r.valuesCnt ? (await attr(r.id)) ?? r : r));
  }

  /// [values]: (id, name) жагсаалтын дарааллаар. id-тай нь шинэчлэгдэж, id-гүй нь шинээр үүснэ.
  Future<void> saveAttr(AttrRecord? attr, String name, List<(int?, String)> values) {
    final body = [
      for (var i = 0; i < values.length; i++)
        {
          ...?attr?.values.where((v) => v.id != null && v.id == values[i].$1).firstOrNull?.raw,
          'id': values[i].$1,
          'name': values[i].$2,
          'orderNumber': i,
        }
    ];
    if (attr == null) {
      return guard(() => api.post('/attr', body: {'name': name, 'attrValueTypeId': 'select', 'attrValues': body}));
    }
    return guard(() => api.put('/attr/${attr.id}', body: {
          'name': name,
          'code': attr.raw['code'],
          'shortName': attr.raw['shortName'],
          'attrValueTypeId': attr.raw['attrValueTypeId'],
          'description': attr.raw['description'],
          'image': attr.raw['image'],
          'attrValues': body,
        }));
  }

  Future<void> deleteAttr(int id) => guard(() => api.delete('/attr/$id'));
}
