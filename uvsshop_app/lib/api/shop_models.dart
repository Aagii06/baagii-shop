import '../config.dart';
import 'api_client.dart';

class Category {
  final int id;

  /// API-ийн `code` (women, electronics, ...) — hero слайдыг ангилалтай холбоно.
  final String? code;
  final String name;
  final String? image;
  final List<Category> children;
  Category({required this.id, this.code, required this.name, this.image, this.children = const []});

  factory Category.fromJson(Map<String, dynamic> j) => Category(
        id: toInt(j['id']),
        code: j['code']?.toString(),
        name: j['name']?.toString() ?? '',
        image: fileUrl(j['image']?.toString(), 'thumbnail'),
        children: ((j['children'] as List?) ?? []).map((c) => Category.fromJson(c as Map<String, dynamic>)).toList(),
      );

  /// Мод дотроос id-гаар хайна.
  static Category? findById(List<Category> tree, int id) {
    for (final c in tree) {
      if (c.id == id) return c;
      final sub = findById(c.children, id);
      if (sub != null) return sub;
    }
    return null;
  }

  static Category? findByCode(List<Category> tree, String code) {
    for (final c in tree) {
      if (c.code == code) return c;
      final sub = findByCode(c.children, code);
      if (sub != null) return sub;
    }
    return null;
  }

  /// Өөрийн болон бүх дэд ангиллын id.
  Set<int> get allIds => {id, for (final c in children) ...c.allIds};
}

class Product {
  final int id;
  final String name;
  final double price;
  final double? originalPrice;
  final List<String> imageIds;
  final String? description;
  final int? categoryId;
  final String? storeName;

  /// Дэлгүүрийн логоны file id.
  final String? storeLogo;

  /// Дэлгүүрийн id (`company.id`) — дэлгүүрийн хуудас.
  final int? storeId;
  final int? stock;

  /// Сүүлд засварласан (эсвэл нэмсэн) цаг — "Шинэ" эрэмбэ.
  final DateTime? updatedAt;

  Product({
    required this.id,
    required this.name,
    required this.price,
    this.originalPrice,
    this.imageIds = const [],
    this.description,
    this.categoryId,
    this.storeName,
    this.storeLogo,
    this.storeId,
    this.stock,
    this.updatedAt,
  });

  bool get onSale => originalPrice != null && originalPrice! > price;

  String? image([String variant = 'grid']) => imageIds.isEmpty ? null : fileUrl(imageIds.first, variant);

  int? get discountPercent =>
      originalPrice == null || originalPrice! <= 0 ? null : (((originalPrice! - price) / originalPrice!) * 100).round();

  /// Хадгалсан бараанд (утсанд) — `fromJson`-оор буцааж уншина.
  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'price': price,
        'mainPrice': originalPrice ?? price,
        'images': imageIds,
        'categoryId': categoryId,
        'company': storeName == null ? null : {'id': storeId, 'name': storeName, 'logo': storeLogo},
        'remain': stock,
        'updatedAt': updatedAt?.toIso8601String(),
      };

  factory Product.fromJson(Map<String, dynamic> j) {
    final price = toNum(j['price']);
    final main = toNum(j['mainPrice']);
    return Product(
      id: toInt(j['id']),
      name: (j['productName'] ?? j['name'] ?? '').toString(),
      price: price,
      originalPrice: main > price ? main : null,
      imageIds: ((j['images'] as List?) ?? []).map((e) => e.toString()).toList(),
      description: j['note']?.toString(),
      categoryId: j['categoryId'] == null ? (j['category']?['id'] as int?) : toInt(j['categoryId']),
      storeName: j['company']?['name']?.toString(),
      storeLogo: j['company']?['logo']?.toString(),
      storeId: j['company']?['id'] == null ? null : toInt(j['company']['id']),
      stock: j['remain'] == null ? null : toInt(j['remain']),
      updatedAt: DateTime.tryParse((j['updatedAt'] ?? j['createdAt'] ?? '').toString()),
    );
  }
}

class ProductVariant {
  final int id;
  final String name;
  final String? imageId;
  final double price;
  final double? originalPrice;
  final int stock;
  final int branchId;

  /// attrId → утга
  final Map<int, String> attrs;

  ProductVariant({
    required this.id,
    required this.name,
    this.imageId,
    required this.price,
    this.originalPrice,
    required this.stock,
    required this.branchId,
    required this.attrs,
  });

  factory ProductVariant.fromJson(Map<String, dynamic> j, String fallbackName) {
    final price = toNum(j['price']);
    final main = toNum(j['mainPrice']);
    final branches = (j['postProductBranches'] as List?) ?? [];
    final b = branches.isNotEmpty ? branches.first as Map<String, dynamic> : null;
    final attr = (j['attr'] is Map) ? (j['attr'] as Map) : {};
    final imgs = (j['images'] as List?) ?? [];
    return ProductVariant(
      id: toInt(j['id']),
      name: (j['variantName'] ?? '').toString().isEmpty ? fallbackName : j['variantName'].toString(),
      imageId: j['image']?.toString() ?? (imgs.isNotEmpty ? imgs.first.toString() : null),
      price: price,
      originalPrice: main > price ? main : null,
      stock: toInt(j['remain']),
      branchId: b == null ? 1 : toInt(b['branch']?['id'] ?? b['branchId']),
      attrs: {for (final e in attr.entries) int.tryParse(e.key.toString()) ?? 0: e.value.toString()},
    );
  }
}

class AttrValue {
  final String value;
  final String? color;
  final String? imageId;
  AttrValue(this.value, this.color, this.imageId);
}

class ProductAttr {
  final int id;
  final String name;
  final List<AttrValue> values;
  ProductAttr(this.id, this.name, this.values);
}

class ProductDetail {
  final Product product;
  final List<ProductVariant> variants;
  final List<ProductAttr> attrs;
  ProductDetail(this.product, this.variants, this.attrs);

  factory ProductDetail.fromJson(Map<String, dynamic> j) {
    final p = Product.fromJson(j);
    int byOrder(dynamic a, dynamic b) => toInt(a['orderNumber']).compareTo(toInt(b['orderNumber']));
    final attrs = [...((j['postAttrs'] as List?) ?? [])]..sort(byOrder);
    return ProductDetail(
      p,
      ((j['postProducts'] as List?) ?? []).map((v) => ProductVariant.fromJson(v as Map<String, dynamic>, p.name)).toList(),
      attrs.map((a) {
        final values = [...((a['postAttrValues'] as List?) ?? [])]..sort(byOrder);
        return ProductAttr(
          toInt(a['attrId']),
          a['attrName']?.toString() ?? '',
          values.map((v) {
            final imgs = (v['images'] as List?) ?? [];
            return AttrValue(v['value'].toString(), v['color']?.toString(),
                v['image']?.toString() ?? (imgs.isNotEmpty ? imgs.first.toString() : null));
          }).toList(),
        );
      }).toList(),
    );
  }
}

class CartLine {
  final int id;
  final int cartId;
  final int branchId;
  final int? postId;
  final int? postProductId;
  final String productName;
  final String variantName;
  final String? imageId;
  final double price;
  final int qty;
  final int? expiresIn;

  CartLine({
    required this.id,
    required this.cartId,
    required this.branchId,
    this.postId,
    this.postProductId,
    required this.productName,
    required this.variantName,
    this.imageId,
    required this.price,
    required this.qty,
    this.expiresIn,
  });

  factory CartLine.fromJson(Map<String, dynamic> j) => CartLine(
        id: toInt(j['id']),
        cartId: toInt(j['cartId']),
        branchId: toInt(j['branchId']),
        postId: j['postId'] == null ? null : toInt(j['postId']),
        postProductId: j['postProductId'] == null ? null : toInt(j['postProductId']),
        productName: j['productName']?.toString() ?? '',
        variantName: j['variantName']?.toString() ?? '',
        imageId: j['image']?.toString(),
        price: toNum(j['price']),
        qty: toInt(j['qty']),
        expiresIn: j['expiresIn'] == null ? null : toInt(j['expiresIn']),
      );
}

class Customer {
  final int id;
  final String phone;
  final String? name;
  Customer(this.id, this.phone, this.name);
  factory Customer.fromJson(Map<String, dynamic> j) =>
      Customer(toInt(j['id']), j['phone']?.toString() ?? '', j['name']?.toString());
}

class OrderItem {
  final String name;
  final double price;
  final String? imageId;
  final int quantity;
  OrderItem(this.name, this.price, this.imageId, this.quantity);
}

class ShopOrder {
  final String id;
  final String status;
  final String? paymentMethod;
  final String? paidAt;
  final String createdAt;
  final List<OrderItem> items;
  final String fullName;
  final String phone;
  final String address;
  final String? note;
  final double subtotal;
  final double shipping;
  final double coupon;
  final double total;

  ShopOrder({
    required this.id,
    required this.status,
    this.paymentMethod,
    this.paidAt,
    required this.createdAt,
    required this.items,
    required this.fullName,
    required this.phone,
    required this.address,
    this.note,
    required this.subtotal,
    required this.shipping,
    required this.coupon,
    required this.total,
  });

  bool get isPaid => paidAt != null;
  bool get isCancelled => status == 'cancelled';
  bool get isReturned => status == 'returned';

  /// Худалдан авагчид харагдах төлөв.
  String get label {
    if (status == 'cancelled') return 'Цуцлагдсан';
    if (status == 'returned') return 'Буцаагдсан';
    if (status == 'delivered') return 'Хүргэгдсэн';
    if (paidAt != null) return 'Төлөгдсөн';
    if (paymentMethod == 'bank') return 'Шилжүүлэг шалгагдаж байна';
    return 'Төлбөр хүлээгдэж байна';
  }

  factory ShopOrder.fromJson(Map<String, dynamic> j) {
    final s = (j['shippingInfo'] as Map?) ?? {};
    return ShopOrder(
      id: j['id'].toString(),
      status: j['status']?.toString() ?? 'pending',
      paymentMethod: j['paymentMethod']?.toString(),
      paidAt: j['paidAt']?.toString(),
      createdAt: j['createdAt']?.toString() ?? '',
      items: ((j['items'] as List?) ?? [])
          .map((i) => OrderItem(i['name']?.toString() ?? '', toNum(i['price']), i['image']?.toString(), toInt(i['quantity'])))
          .toList(),
      fullName: s['fullName']?.toString() ?? '',
      phone: s['phone']?.toString() ?? '',
      address: s['address']?.toString() ?? '',
      note: s['note']?.toString(),
      subtotal: toNum(j['subtotal']),
      shipping: toNum(j['shipping']),
      coupon: toNum(j['coupon']),
      total: toNum(j['total']),
    );
  }
}

class BankDetails {
  final String bankName;
  final String accountName;
  final String accountNumber;
  final String? iban;
  BankDetails(this.bankName, this.accountName, this.accountNumber, this.iban);
}

class PaymentMethods {
  final BankDetails? bank;
  final bool qpay;
  PaymentMethods(this.bank, this.qpay);
  factory PaymentMethods.fromJson(Map<String, dynamic> j) {
    final b = j['bank'] as Map?;
    return PaymentMethods(
      b == null
          ? null
          : BankDetails(b['bankName']?.toString() ?? '', b['accountName']?.toString() ?? '',
              b['accountNumber']?.toString() ?? '', b['iban']?.toString()),
      j['qpay'] == true,
    );
  }
}

class QpayBankLink {
  final String name;
  final String description;
  final String logo;
  final String link;
  QpayBankLink(this.name, this.description, this.logo, this.link);
}

class QpayInvoice {
  final String invoiceId;
  final double amount;
  final String qrImage;
  final String? shortUrl;
  final List<QpayBankLink> urls;
  QpayInvoice(this.invoiceId, this.amount, this.qrImage, this.shortUrl, this.urls);

  factory QpayInvoice.fromJson(Map<String, dynamic> j) => QpayInvoice(
        j['invoiceId']?.toString() ?? '',
        toNum(j['amount']),
        j['qrImage']?.toString() ?? '',
        j['shortUrl']?.toString(),
        ((j['urls'] as List?) ?? [])
            .map((u) => QpayBankLink(u['name']?.toString() ?? '', u['description']?.toString() ?? '',
                u['logo']?.toString() ?? '', u['link']?.toString() ?? ''))
            .toList(),
      );
}

class AddressArea {
  final int id;
  final String? code;
  final String name;
  AddressArea(this.id, this.code, this.name);
  factory AddressArea.fromJson(Map<String, dynamic> j) => AddressArea(toInt(j['id']), j['code']?.toString(), j['name']?.toString() ?? '');
}

/// Хаягийн төрөл (Гэр, Ажил…), сонгоход харагдах өнгөтэй.
class AddressType {
  final int id;
  final String name;
  final String? bgColor;
  final String? txtColor;
  AddressType(this.id, this.name, this.bgColor, this.txtColor);
  factory AddressType.fromJson(Map<String, dynamic> j) => AddressType(toInt(j['id']), j['name']?.toString() ?? '',
      j['style']?['bgColor']?.toString(), j['style']?['txtColor']?.toString());
  Map<String, dynamic> toJson() => {'id': id, 'name': name, 'style': {'bgColor': bgColor, 'txtColor': txtColor}};
}

/// Хаягийн сонгосон хэсгүүд: төрөл + Аймаг/Сум/Баг.
class AddressAreaPick {
  final AddressType? type;
  final AddressArea? city;
  final AddressArea? district;
  final AddressArea? subDistrict;
  const AddressAreaPick({this.type, this.city, this.district, this.subDistrict});

  AddressAreaPick copyWith({AddressType? type}) => AddressAreaPick(type: type, city: city, district: district, subDistrict: subDistrict);

  /// "Улаанбаатар, Баянзүрх, 1-р хороо, 5-р байр".
  String format(String? detail) => [city?.name, district?.name, subDistrict?.name, detail]
      .map((p) => p?.trim())
      .whereType<String>()
      .where((p) => p.isNotEmpty)
      .join(', ');

  static Map<String, dynamic>? _area(AddressArea? a) => a == null ? null : {'id': a.id, 'code': a.code, 'name': a.name};
  static AddressArea? _readArea(dynamic j) => j is Map<String, dynamic> ? AddressArea.fromJson(j) : null;

  Map<String, dynamic> toJson() =>
      {'addressType': type?.toJson(), 'city': _area(city), 'district': _area(district), 'subDistrict': _area(subDistrict)};

  factory AddressAreaPick.fromJson(Map<String, dynamic> j) => AddressAreaPick(
        type: j['addressType'] is Map<String, dynamic> ? AddressType.fromJson(j['addressType'] as Map<String, dynamic>) : null,
        city: _readArea(j['city']),
        district: _readArea(j['district']),
        subDistrict: _readArea(j['subDistrict']),
      );
}

/// Хадгалсан хүргэлтийн хаяг (web-ийн addressStore-той ижил бүтэц, утсан дээр хадгална).
class SavedAddress {
  final String id;
  final String label;
  final String address;
  final AddressAreaPick? area;
  final String? detail;
  final bool isDefault;
  SavedAddress({required this.id, required this.label, required this.address, this.area, this.detail, this.isDefault = false});

  /// Төрлөөс нь (байхгүй бол хадгалсан нэрээс) нэр.
  String get displayLabel => area?.type?.name ?? (area != null ? 'Бусад хаяг' : label);

  SavedAddress copyWith({bool? isDefault}) =>
      SavedAddress(id: id, label: label, address: address, area: area, detail: detail, isDefault: isDefault ?? this.isDefault);

  Map<String, dynamic> toJson() =>
      {'id': id, 'label': label, 'address': address, 'area': area?.toJson(), 'detail': detail, 'isDefault': isDefault};

  factory SavedAddress.fromJson(Map<String, dynamic> j) => SavedAddress(
        id: j['id']?.toString() ?? '',
        label: j['label']?.toString() ?? 'Хаяг',
        address: j['address']?.toString() ?? '',
        area: j['area'] is Map<String, dynamic> ? AddressAreaPick.fromJson(j['area'] as Map<String, dynamic>) : null,
        detail: j['detail']?.toString(),
        isDefault: j['isDefault'] == true,
      );
}

/// Худалдагчийн дэлгүүр (`/store`): эхлээд түвшин, дараа нь бараа ихтэй нь.
/// Холбоо барих мэдээлэл зөвхөн `/store/{id}`-д ирнэ.
class Store {
  final int id;
  final String name;
  final String? logo;
  final String tier;
  final int productCount;
  final List<String> phones;
  final List<String> emails;
  final List<String> addresses;
  Store(this.id, this.name, this.logo, this.tier, this.productCount,
      {this.phones = const [], this.emails = const [], this.addresses = const []});

  static List<String> _list(dynamic v) => ((v as List?) ?? []).map((e) => e.toString()).where((e) => e.isNotEmpty).toList();

  factory Store.fromJson(Map<String, dynamic> j) => Store(
        toInt(j['id']),
        j['name']?.toString() ?? '',
        j['logo']?.toString(),
        j['tier']?.toString() ?? 'normal',
        toInt(j['productCount']),
        phones: _list(j['phones']),
        emails: _list(j['emails']),
        addresses: _list(j['addresses']),
      );
}
