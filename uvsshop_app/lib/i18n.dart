/// Translations for the whole app (shop and admin), the same idea as the web's i18n: keys are the
/// Mongolian text itself, so Mongolian needs no dictionary and a missing translation falls back to
/// Mongolian. `{name}` marks a variable. Changing the language remounts the screens (main.dart),
/// so every `tr()` runs again.
library;

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uvsshop_app/i18n_en.dart';
import 'package:uvsshop_app/i18n_ru.dart';

class AppLang extends ChangeNotifier {
  static const _key = 'uvs_lang';
  static const codes = ['mn', 'en', 'ru'];
  static const labels = {'mn': 'Монгол', 'en': 'English', 'ru': 'Русский'};
  SharedPreferences? _prefs;
  String _code = 'mn';

  String get code => _code;

  void load(SharedPreferences prefs) {
    _prefs = prefs;
    // Одоогоор зөвхөн монгол хэл: хадгалсан сонголтыг уншихгүй. Хэл солих товчийг буцааж нээхдээ сэргээнэ.
    // final saved = prefs.getString(_key);
    // if (saved != null && codes.contains(saved) && saved != _code) {
    //   _code = saved;
    //   notifyListeners();
    // }
  }

  void set(String code) {
    if (!codes.contains(code) || code == _code) return;
    _code = code;
    _prefs?.setString(_key, code);
    notifyListeners();
  }
}

final appLang = AppLang();

const _dictionaries = <String, Map<String, String>>{'en': appEn, 'ru': appRu};

/// The text in the chosen language. Translating an already translated text returns it unchanged.
String tr(String key, [Map<String, Object?>? vars]) {
  var s = _dictionaries[appLang.code]?[key] ?? key;
  if (vars != null) {
    vars.forEach((k, v) => s = s.replaceAll('{$k}', '${v ?? ''}'));
  }
  return s;
}

/// A stored Mongolian value (status label, colour…) shown in the chosen language.
String trValue(String? value) => value == null ? '' : tr(value);
