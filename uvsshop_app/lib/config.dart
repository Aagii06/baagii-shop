/// Backend-ийн хаягууд. Production руу заасан; өөр сервер рүү
/// `flutter run --dart-define=API_ORIGIN=http://10.0.2.2:5021` гэж солино.
class AppConfig {
  static const String apiOrigin = String.fromEnvironment(
    'API_ORIGIN',
    defaultValue: 'https://uvsshop.com:8898',
  );

  /// Дэлгүүрийн (web) API.
  static const String shopApi = '$apiOrigin/web';

  /// Админы API.
  static const String adminApi = '$apiOrigin/api';

  /// Зургийн сервис.
  static const String fileBase = '$apiOrigin/file';

  /// backend `X-Shop-Id`: 1 — UVS SHOP, 2 — Ajrug.
  static const String shopId = String.fromEnvironment('SHOP_ID', defaultValue: '1');

  static const String appName = 'UVS SHOP';
}

/// Зургийн file id-г URL болгоно. Хэмжээ: icon 128, thumbnail 300, grid 600, original 1600.
String? fileUrl(String? id, [String variant = 'original']) {
  final value = id?.trim();
  if (value == null || value.isEmpty || value == 'null' || value == 'undefined') return null;
  if (RegExp(r'^(https?:|data:)', caseSensitive: false).hasMatch(value)) return value;
  final trimmed = value.replaceFirst(RegExp(r'^/'), '');
  return variant == 'original' ? '${AppConfig.fileBase}/$trimmed' : '${AppConfig.fileBase}/$variant/$trimmed';
}
