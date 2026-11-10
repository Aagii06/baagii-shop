import 'dart:convert';

import 'package:flutter/foundation.dart';

import '../api/admin_manage_models.dart';
import '../api/api_client.dart';
import '../ui/common.dart' show stripHtml;

// web-ийн admin/src/components/products/ProductEditor.tsx-ийн Dart хувилбар:
// барааны засаж буй ноорог (маягт ба "Сонголт, тоо" хуудас хоёулаа ашиглана).

/// Нэг сонголтын утга (өнгө бол swatch hex-тэй).
class PAttrValue {
  final String value;
  final String? color;

  /// Каталогийн утга; энд гараар бичсэн бол null.
  final int? attrValueId;
  const PAttrValue(this.value, this.color, this.attrValueId);
}

/// Бараа юугаараа ялгаатай вэ (өнгө, хэмжээ…), сонгосон утгуудтай нь.
class PAttr {
  final String key;
  final int? attrId;
  final String name;
  final bool isColor;
  final List<PAttrValue> values;
  const PAttr({required this.key, required this.attrId, required this.name, required this.isColor, required this.values});

  PAttr withValues(List<PAttrValue> v) => PAttr(key: key, attrId: attrId, name: name, isColor: isColor, values: v);
}

/// Утгуудын нэг хослол ("Хар · 42")-ийн тоо, үнэ.
class VariantRow {
  final String key;
  final int? id;
  final Map<String, String> values;
  final String qty;
  final String price;
  final String salePrice;

  /// Зарахгүй — дугаараа хадгална, хадгалагдахгүй.
  final bool off;
  const VariantRow(this.key, this.id, this.values, this.qty, this.price, this.salePrice, this.off);

  VariantRow copyWith({String? qty, String? price, String? salePrice, bool? off}) =>
      VariantRow(key, id, values, qty ?? this.qty, price ?? this.price, salePrice ?? this.salePrice, off ?? this.off);

  /// Хямдралын үнэ үндсэн үнээс их.
  bool get overPrice => salePrice.isNotEmpty && (int.tryParse(salePrice) ?? 0) > (int.tryParse(price) ?? 0);
}

/// Каталогийн үзүүлэлт өнгө маягийнх уу (swatch, утга бүрт зураг).
bool attrIsColor(AttrRecord a) => RegExp('өнгө', caseSensitive: false).hasMatch(a.name) || a.values.any((v) => v.color != null);

/// Утга каталогид хэддүгээрт байх; байхгүй бол хамгийн сүүлд.
int valueRank(AttrRecord? def, String value) {
  final values = def?.values ?? [];
  final i = values.indexWhere((v) => valueKey(v.name) == valueKey(value));
  return i == -1 ? values.length : i;
}

/// Үзүүлэлтийн дарааллаас үл хамаарах түлхүүр.
String comboKey(Map<String, String> values) {
  final keys = values.keys.toList()..sort();
  return keys.map((k) => '$k=${valueKey(values[k]!)}').join('|');
}

/// Зургийн бүлэг: "" — барааных, эс бөгөөс тухайн өнгөнийх ("12=ХАР").
String imageKey([String attrKey = '', String value = '']) => attrKey.isEmpty ? '' : '$attrKey=${valueKey(value)}';

String _date(DateTime d) => '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
String localDate([int days = 0]) => _date(DateTime.now().add(Duration(days: days)));

/// Шинэ хямдрал анхдагчаар хэдэн өдөр үргэлжлэх.
const defaultSaleDays = 14;

/// Хуучин бараанд зөвхөн нэрээрээ ялгаатай хувилбарууд — тэдгээрийн нэр энэ үзүүлэлтийн утга болно.
const variantNameAttr = 'variant-name';

/// Шинээр сонгосон зураг (хуулахаас өмнө).
class LocalImage {
  final Uint8List bytes;
  final String name;
  LocalImage(this.bytes, this.name);
}

class ProductDraft extends ChangeNotifier {
  /// `GET /product/{id}`-ийн хариу; шинэ бараанд null.
  final Map<String, dynamic>? product;
  final List<AdminCategory> categories;
  final List<AttrRecord> catalogue;

  int? get id => product == null ? null : toInt(product!['id']);

  // ---------- маягтын талбарууд ----------
  String name = '';
  String price = '';
  String salePrice = '';
  String saleStart = localDate();
  String saleEnd = localDate(defaultSaleDays);
  int? storeId;
  int? categoryId;

  /// Тайлбар энгийн текстээр. Өөрчлөөгүй бол анхны HTML-ээрээ хадгалагдана.
  String note = '';
  String _noteHtml = '';
  bool isActive = true;

  /// Өмнөх категорийн үлдсэн үзүүлэлтүүд ч энд байна — буцаж сонгоход дахин олдоно.
  List<PAttr> _allAttrs = [];
  Map<String, VariantRow> _rows = {};

  /// Зургийн бүлэг тус бүрийн file id эсвэл `local:N` (шинээр сонгосон).
  Map<String, List<String>> images = {'': []};
  final Map<String, LocalImage> files = {};
  int _nextLocal = 0;

  late String _saved;

  ProductDraft({required this.product, required this.categories, required this.catalogue}) {
    final p = product;
    final sale = toNum(p?['price']);
    if (p != null) {
      name = (p['name'] ?? p['title'] ?? '').toString();
      price = '${(toNum(p['mainPrice']) == 0 ? sale : toNum(p['mainPrice'])).round()}';
      salePrice = '${sale.round()}';
      saleStart = _str(p['saleStart']) ?? localDate();
      saleEnd = _str(p['saleEnd']) ?? localDate(defaultSaleDays);
      storeId = p['storeId'] == null ? null : toInt(p['storeId']);
      categoryId = p['categoryId'] == null ? null : toInt(p['categoryId']);
      _noteHtml = p['description']?.toString() ?? '';
      note = stripHtml(_noteHtml);
      isActive = p['statusId'] != null ? p['statusId'] == 'active' : p['isActive'] != false;
    }
    _allAttrs = _initialAttrs();
    _rows = _initialRows();
    images = _initialImages();
    _saved = _snapshot();
  }

  static String? _str(dynamic v) => v == null || v.toString().isEmpty ? null : v.toString();

  List<Map<String, dynamic>> get _variants => ((product?['variants'] as List?) ?? []).cast<Map<String, dynamic>>();

  /// Хувилбарын attrId → утга.
  static Map<String, String> _variantAttr(Map<String, dynamic> v) => {
        for (final a in (v['attr'] as List?) ?? [])
          if (a['value'] != null && a['value'].toString().isNotEmpty) a['attrId'].toString(): a['value'].toString(),
      };

  /// Барааны үзүүлэлтүүд (attrs, эсвэл хувилбаруудаас цуглуулсан).
  List<Map<String, dynamic>> get _postAttrs {
    final attrs = ((product?['attrs'] as List?) ?? []).cast<Map<String, dynamic>>();
    if (attrs.isNotEmpty) {
      return [...attrs]..sort((a, b) => toInt(a['orderNumber']).compareTo(toInt(b['orderNumber'])));
    }
    // Хадгалагдаагүй хуучин бараа — хувилбаруудын attr-аас.
    final byId = <int, Map<String, dynamic>>{};
    for (final v in _variants) {
      for (final a in (v['attr'] as List?) ?? []) {
        if (a['value'] == null || a['value'].toString().isEmpty) continue;
        final id = toInt(a['attrId']);
        final attr = byId.putIfAbsent(id, () => {'attrId': id, 'attrName': a['attrName'] ?? '', 'values': <Map<String, dynamic>>[]});
        final values = attr['values'] as List<Map<String, dynamic>>;
        if (values.any((x) => x['value'] == a['value'])) continue;
        values.add({'attrValueId': null, 'value': a['value'], 'color': a['color'], 'image': a['image'], 'images': [], 'orderNumber': values.length});
      }
    }
    return byId.values.toList();
  }

  List<PAttr> _initialAttrs() {
    final postAttrs = _postAttrs;
    if (postAttrs.isEmpty) {
      final vs = _variants;
      return vs.length > 1
          ? [
              PAttr(
                key: variantNameAttr,
                attrId: null,
                name: 'Хувилбар',
                isColor: false,
                values: [for (final v in vs) PAttrValue(v['name']?.toString() ?? '', null, null)],
              ),
            ]
          : [];
    }
    return [
      for (final attr in postAttrs)
        () {
          final attrId = toInt(attr['attrId']);
          final known = catalogue.where((a) => a.id == attrId).firstOrNull;
          final values = [
            for (final v in [...((attr['values'] as List?) ?? [])]..sort((a, b) => toInt(a['orderNumber']).compareTo(toInt(b['orderNumber']))))
              PAttrValue(v['value']?.toString() ?? '', _str(v['color']), v['attrValueId'] == null ? null : toInt(v['attrValueId'])),
          ];
          // Хувилбар ашигласан ч үзүүлэлтэд жагсаагүй утгууд.
          for (final v in _variants) {
            final value = _variantAttr(v)['$attrId'];
            if (value != null && !values.any((x) => valueKey(x.value) == valueKey(value))) values.add(PAttrValue(value, null, null));
          }
          return PAttr(
            key: '$attrId',
            attrId: attrId,
            name: known?.name ?? attr['attrName']?.toString() ?? '',
            isColor: known != null ? attrIsColor(known) : (attr['viewType'] == 'image' || values.any((v) => v.color != null)),
            values: values,
          );
        }(),
    ];
  }

  Map<String, VariantRow> _initialRows() {
    final rows = <String, VariantRow>{};
    for (final v in _variants) {
      final attrMap = _variantAttr(v);
      final values = <String, String>{};
      for (final attr in _allAttrs) {
        final value = attr.attrId != null ? attrMap['${attr.attrId}'] : v['name']?.toString();
        if (value != null && value.isNotEmpty) values[attr.key] = value;
      }
      final key = comboKey(values);
      final main = toNum(v['mainPrice']);
      final p = toNum(v['price']);
      rows[key] = VariantRow(key, toInt(v['id']), values, '${toNum(v['qty']).round()}', '${(main == 0 ? p : main).round()}',
          '${p.round()}', false);
    }
    // Бараа зарагддаггүй хослолууд 0-ээр биш, "зарахгүй"-гээр харагдана.
    if (product != null) {
      for (final values in _combinations(_allAttrs)) {
        final key = comboKey(values);
        rows.putIfAbsent(key, () => _newRow(values).copyWith(off: true));
      }
    }
    return rows;
  }

  Map<String, List<String>> _initialImages() {
    final result = <String, List<String>>{'': ((product?['images'] as List?) ?? []).map((e) => e.toString()).toList()};
    for (final attr in _allAttrs) {
      final postAttr = _postAttrs.where((a) => attr.attrId != null && toInt(a['attrId']) == attr.attrId).firstOrNull;
      for (final v in (postAttr?['values'] as List?) ?? []) {
        // Нүүр зураг эхэндээ; API ихэвчлэн images-д давтдаг.
        final list = <String>{
          if (_str(v['image']) != null) v['image'].toString(),
          for (final i in (v['images'] as List?) ?? []) if (_str(i) != null) i.toString(),
        }.toList();
        if (list.isNotEmpty) result[imageKey(attr.key, v['value'].toString())] = list;
      }
    }
    return result;
  }

  // ---------- гаргаж авах ----------

  static List<Map<String, String>> _combinations(List<PAttr> attrs) => attrs
      .where((a) => a.values.isNotEmpty)
      .fold<List<Map<String, String>>>([{}], (combos, attr) => [
            for (final c in combos)
              for (final v in attr.values) {...c, attr.key: v.value},
          ]);

  VariantRow _newRow(Map<String, String> values) => VariantRow(comboKey(values), null, values, '0', price, salePrice, false);

  /// Категорийн үзүүлэлтүүд (утга сонгоогүй ч), хамгийн сүүлийн түвшний категорид л.
  List<PAttr> get _fromCategory {
    final c = categoryId == null ? null : categories.where((x) => x.id == categoryId).firstOrNull;
    if (c == null || !c.isLeaf) return [];
    return [
      for (final ca in c.attrs)
        if (catalogue.where((a) => a.id == ca.id).firstOrNull case final AttrRecord a)
          PAttr(key: '${a.id}', attrId: a.id, name: a.name, isColor: attrIsColor(a), values: const []),
    ];
  }

  /// Категорийн үзүүлэлтүүд, дараа нь утгатай бусад нь.
  List<PAttr> get attrs {
    final from = _fromCategory;
    final byKey = {for (final a in _allAttrs) a.key: a};
    return [
      for (final a in from) byKey[a.key] ?? a,
      ..._allAttrs.where((a) => !from.any((f) => f.key == a.key) && a.values.isNotEmpty),
    ];
  }

  bool inCategory(String key) => _fromCategory.any((a) => a.key == key);

  /// Сонгосон утгуудын бүх хослол; юу ч сонгоогүй бол нэг мөр.
  List<VariantRow> get variants => [for (final values in _combinations(attrs)) _rows[comboKey(values)] ?? _newRow(values)];

  bool get picked => attrs.any((a) => a.values.isNotEmpty);

  // ---------- шалгалт ----------

  String? get nameError => name.trim().isEmpty ? 'Барааны нэр оруулна уу' : null;
  String? get priceError => price.isEmpty ? 'Үнэ оруулна уу' : null;
  bool get hasBasics => nameError == null && priceError == null;

  static bool _discounted(String p, String s) => s.isNotEmpty && (int.tryParse(s) ?? 0) < (int.tryParse(p) ?? 0);
  static bool _over(String p, String s) => s.isNotEmpty && (int.tryParse(s) ?? 0) > (int.tryParse(p) ?? 0);

  List<(String, String)> get _pricedRows =>
      picked ? [for (final r in variants.where((r) => !r.off)) (r.price, r.salePrice)] : [(price, salePrice)];

  /// Бараа эсвэл аль нэг хувилбар нь хямдралтай — тэр үед хугацаа асууна.
  bool get onSale => [(price, salePrice), ..._pricedRows].any((r) => _discounted(r.$1, r.$2));

  String? get salePriceError => _over(price, salePrice) ? 'Хямдралын үнэ үндсэн үнээс их байж болохгүй' : null;
  String? get variantsError =>
      picked && variants.any((r) => !r.off && r.overPrice) ? 'Зарим хувилбарын хямдралын үнэ үндсэн үнээсээ их байна' : null;
  String? get salePeriodError {
    if (!onSale) return null;
    if (saleStart.isEmpty || saleEnd.isEmpty) return 'Хямдралын эхлэх, дуусах өдрийг сонгоно уу';
    if (saleStart.compareTo(saleEnd) > 0) return 'Дуусах өдөр эхлэх өдрөөс өмнө байж болохгүй';
    return null;
  }

  // ---------- засах ----------

  void update(void Function() fn) {
    fn();
    notifyListeners();
  }

  /// Үнэ солигдоход хуучин үнээрээ байсан хувилбарууд дагаж өөрчлөгдөнө.
  void setPrice(String v) {
    final prev = price;
    price = v;
    _rows = {for (final e in _rows.entries) e.key: e.value.price == prev ? e.value.copyWith(price: v) : e.value};
    notifyListeners();
  }

  void setSalePrice(String v) {
    final prev = salePrice;
    salePrice = v;
    _rows = {for (final e in _rows.entries) e.key: e.value.salePrice == prev ? e.value.copyWith(salePrice: v) : e.value};
    notifyListeners();
  }

  void setAttrValues(String key, List<PAttrValue> values) {
    final attr = attrs.where((a) => a.key == key).firstOrNull;
    if (attr == null) return;
    _allAttrs = _allAttrs.any((a) => a.key == key)
        ? [for (final a in _allAttrs) a.key == key ? a.withValues(values) : a]
        : [..._allAttrs, attr.withValues(values)];
    notifyListeners();
  }

  void updateVariant(VariantRow row, {String? qty, String? price, String? salePrice, bool? off}) {
    _rows = {..._rows, row.key: (_rows[row.key] ?? row).copyWith(qty: qty, price: price, salePrice: salePrice, off: off)};
    notifyListeners();
  }

  void addImages(String key, List<LocalImage> picked) {
    final refs = List.generate(picked.length, (_) => 'local:${_nextLocal++}');
    for (var i = 0; i < refs.length; i++) {
      files[refs[i]] = picked[i];
    }
    images = {...images, key: [...(images[key] ?? []), ...refs]};
    notifyListeners();
  }

  void removeImage(String key, String ref) {
    images = {...images, key: (images[key] ?? []).where((r) => r != ref).toList()};
    files.remove(ref);
    notifyListeners();
  }

  // ---------- хадгалах ----------

  /// Тайлбарыг HTML-ээр: өөрчлөөгүй бол анхных нь, эс бөгөөс мөр бүр <p>.
  String get _noteOut {
    if (note.trim() == stripHtml(_noteHtml).trim()) return _noteHtml;
    String esc(String s) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
    return note.trim().split('\n').where((l) => l.trim().isNotEmpty).map((l) => '<p>${esc(l.trim())}</p>').join();
  }

  ({int mainPrice, int price}) _prices(String p, String s) {
    final main = int.tryParse(p) ?? 0;
    return (mainPrice: main, price: s.isEmpty ? main : (int.tryParse(s) ?? 0));
  }

  /// `POST/PUT /product`-ийн бие. [swap] нь `local:N`-ийг хуулсан file id болгоно.
  Map<String, dynamic> body([String Function(String ref)? swap]) {
    String s(String r) => swap == null ? r : swap(r);
    final used = attrs.where((a) => a.values.isNotEmpty).toList();
    List<String> valueImages(String attrKey, String value) => images[imageKey(attrKey, value)] ?? [];
    final sale = onSale;
    final own = _prices(price, salePrice);
    final rows = variants.where((r) => !r.off).toList();
    final attrsOut = [
      for (final a in used)
        {
          'attrId': a.attrId,
          'name': a.name,
          'values': [
            for (final v in a.values)
              () {
                final imgs = valueImages(a.key, v.value).map(s).toList();
                return {
                  'attrValueId': v.attrValueId,
                  'value': v.value,
                  'color': v.color,
                  'image': imgs.isEmpty ? null : imgs.first,
                  'images': imgs.skip(1).toList(),
                };
              }(),
          ],
        },
    ];
    return {
      'date': localDate(),
      'categoryId': categoryId,
      // Худалдагчийн өөрийн дэлгүүрийг backend өөрөө тавина.
      'storeId': storeId,
      'name': name.trim(),
      'description': note.trim().isEmpty ? null : _noteOut,
      'isActive': isActive,
      'statusId': isActive ? 'active' : 'inactive',
      'images': (images[''] ?? []).map(s).toList(),
      'qty': rows.fold<int>(0, (sum, r) => sum + (int.tryParse(r.qty) ?? 0)),
      'mainPrice': own.mainPrice,
      'price': own.price,
      'saleStart': sale ? saleStart : null,
      'saleEnd': sale ? saleEnd : null,
      'attrs': attrsOut,
      'variants': [
        for (final r in rows)
          () {
            final vals = [for (final a in used) r.values[a.key] ?? ''];
            final pr = used.isNotEmpty ? _prices(r.price, r.salePrice) : own;
            return {
              'id': r.id,
              'name': vals.join(' / ').isNotEmpty ? vals.join(' / ') : (name.trim().isNotEmpty ? name.trim() : 'Нэргүй'),
              'price': pr.price,
              'mainPrice': pr.mainPrice,
              'qty': int.tryParse(r.qty) ?? 0,
              'attr': [
                for (final (i, a) in used.indexed)
                  if (a.attrId != null)
                    if (a.values.where((v) => v.value == vals[i]).firstOrNull case final PAttrValue v)
                      {'attrId': a.attrId, 'attrName': a.name, 'value': v.value, 'color': v.color, 'image': () {
                        final imgs = valueImages(a.key, v.value).map(s).toList();
                        return imgs.isEmpty ? null : imgs.first;
                      }()},
              ],
            };
          }(),
      ],
    };
  }

  /// Ашиглагдаж буй шинэ зургууд (хадгалахад хуулна).
  Iterable<String> get pendingUploads sync* {
    final used = attrs.where((a) => a.values.isNotEmpty);
    final refs = [
      ...images[''] ?? <String>[],
      for (final a in used)
        for (final v in a.values) ...images[imageKey(a.key, v.value)] ?? <String>[],
    ];
    for (final r in refs) {
      if (files.containsKey(r)) yield r;
    }
  }

  String _snapshot() => jsonEncode({...body(), 'date': null});
  bool get dirty => _snapshot() != _saved;
  void markSaved() {
    _saved = _snapshot();
    notifyListeners();
  }
}
