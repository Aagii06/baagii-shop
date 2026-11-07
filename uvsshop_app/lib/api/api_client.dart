import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config.dart';

class ApiException implements Exception {
  final int status;
  final String message;
  final bool isAuth;
  ApiException(this.status, this.message, {this.isAuth = false});
  @override
  String toString() => message;
}

/// Backend нь амжилт/алдааг хоёуланг нь ихэвчлэн HTTP 200-аар буцааж
/// `success` талбараар ялгадаг тул хоёуланг шалгана.
class ApiClient {
  final String baseUrl;

  /// Хүсэлт бүрт токен өгнө (null бол токенгүй).
  final Future<String?> Function()? tokenProvider;

  ApiClient(this.baseUrl, {this.tokenProvider});

  Future<dynamic> get(String path, {bool auth = true}) => _send('GET', path, auth: auth);
  Future<dynamic> post(String path, {Object? body, bool auth = true}) => _send('POST', path, body: body, auth: auth);
  Future<dynamic> put(String path, {Object? body, bool auth = true}) => _send('PUT', path, body: body, auth: auth);
  Future<dynamic> delete(String path, {bool auth = true}) => _send('DELETE', path, auth: auth);

  Future<dynamic> _send(String method, String path, {Object? body, bool auth = true}) async {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Shop-Id': AppConfig.shopId,
    };
    if (auth && tokenProvider != null) {
      final token = await tokenProvider!();
      if (token != null) headers['Authorization'] = 'Bearer $token';
    }

    final request = http.Request(method, Uri.parse('$baseUrl$path'))..headers.addAll(headers);
    if (body != null) request.body = jsonEncode(body);

    http.Response response;
    try {
      response = await http.Response.fromStream(await request.send().timeout(const Duration(seconds: 30)));
    } on TimeoutException {
      throw ApiException(408, 'Сервер хариу өгсөнгүй. Дахин оролдоно уу.');
    } catch (_) {
      throw ApiException(0, 'Сүлжээний алдаа. Интернэт холболтоо шалгана уу.');
    }

    dynamic data;
    try {
      data = jsonDecode(utf8.decode(response.bodyBytes));
    } catch (_) {
      data = null;
    }

    final failed = response.statusCode >= 400 || (data is Map && data['success'] == false);
    if (failed) {
      final isAuth = response.statusCode == 401 || (data is Map && data['errorType'] == 'authentication');
      final msg = data is Map && data['message'] is String && (data['message'] as String).isNotEmpty
          ? data['message'] as String
          : _statusMessage(response.statusCode);
      throw ApiException(response.statusCode, msg, isAuth: isAuth);
    }
    return data;
  }

  static String _statusMessage(int status) {
    if (status == 401) return 'Нэвтрэх шаардлагатай';
    if (status == 403) return 'Хандах эрхгүй';
    if (status == 404) return 'Олдсонгүй';
    if (status >= 500) return 'Серверийн алдаа ($status)';
    return 'Алдаа гарлаа';
  }
}

double toNum(dynamic v) {
  if (v == null) return 0;
  if (v is num) return v.toDouble();
  return double.tryParse(v.toString()) ?? 0;
}

int toInt(dynamic v) => toNum(v).round();
