import '../config.dart';
import 'api_client.dart';

class Category {
  final int id;
  final String name;
  final String? image;
  final List<Category> children;
  Category({required this.id, required this.name, this.image, this.children = const []});

  factory Category.fromJson(Map<String, dynamic> j) => Category(
        id: toInt(j['id']),
        name: j['name']?.toString() ?? '',
        image: fileUrl(j['image']?.toString(), 'thumbnail'),
        children: ((j['children'] as List?) ?? []).map((c) => Category.fromJson(c as Map<String, dynamic>)).toList(),
      );

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
  final int? stock;

  Product({
    required this.id,
    required this.name,
    required this.price,
    this.originalPrice,
    this.imageIds = const [],
    this.description,
    this.categoryId,
    this.storeName,
    this.stock,
  });

  String? image([String variant = 'grid']) => imageIds.isEmpty ? null : fileUrl(imageIds.first, variant);

  int? get discountPercent =>
      originalPrice == null || originalPrice! <= 0 ? null : (((originalPrice! - price) / originalPrice!) * 100).round();

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
      stock: j['remain'] == null ? null : toInt(j['remain']),
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
