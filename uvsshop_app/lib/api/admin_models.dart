import '../config.dart';
import 'api_client.dart';

class AdminUser {
  final int id;
  final String name;
  final String userName;
  final String? phone;
  final String? email;
  final String? logo;
  final String? roleNames;
  final int? storeId;
  final String? storeName;
  AdminUser(this.id, this.name, this.userName, this.email, this.roleNames, this.storeName,
      {this.phone, this.logo, this.storeId});

  /// roleNames-д "admin" байвал админ; бусад нь өөрийн дэлгүүрийн бараатай ажилладаг худалдагч.
  bool get isAdmin => RegExp('admin', caseSensitive: false).hasMatch(roleNames ?? '');

  factory AdminUser.fromJson(Map<String, dynamic> j, {Map<String, dynamic>? store}) {
    final s = (store ?? j['store']) as Map?;
    String? str(dynamic v) => v == null || v.toString().isEmpty ? null : v.toString();
    return AdminUser(
      toInt(j['id']),
      j['name']?.toString() ?? '',
      j['userName']?.toString() ?? '',
      str(j['email']),
      str(j['roleNames']),
      str(s?['name']),
      phone: str(j['phone']),
      logo: str(j['logo']),
      storeId: s?['id'] == null ? null : toInt(s!['id']),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'userName': userName,
        'phone': phone,
        'email': email,
        'logo': logo,
        'roleNames': roleNames,
        'store': storeName == null ? null : {'id': storeId, 'name': storeName},
      };
}

const orderStatusLabel = {
  'pending': 'Хүлээгдэж буй',
  'confirmed': 'Баталгаажсан',
  'delivered': 'Хүргэгдсэн',
  'returned': 'Буцаагдсан',
  'cancelled': 'Цуцлагдсан',
};

/// Захиалгыг урагшлуулах ганц үйлдэл.
const nextOrderAction = {
  'pending': ('Баталгаажуулах', 'confirmed'),
  'confirmed': ('Хүргэгдсэн болгох', 'delivered'),
};

class AdminOrderItem {
  final int id;
  final String name;
  final String? imageId;
  final int qty;
  final double price;
  final int returnedQty;
  AdminOrderItem(this.id, this.name, this.imageId, this.qty, this.price, this.returnedQty);
  int get keptQty => qty - returnedQty;
}

class AdminOrder {
  final int id;
  final String status;
  final String createdAt;
  final String customerName;
  final String phone;
  final String address;
  final List<AdminOrderItem> items;
  final double deliveryFee;
  final Map<String, String> timeline;
  final String? paidAt;
  final bool overdue;

  AdminOrder({
    required this.id,
    required this.status,
    required this.createdAt,
    required this.customerName,
    required this.phone,
    required this.address,
    required this.items,
    required this.deliveryFee,
    required this.timeline,
    this.paidAt,
    required this.overdue,
  });

  double get subtotal => items.fold(0, (s, i) => s + i.qty * i.price);
  double get returnedAmount => items.fold(0, (s, i) => s + i.returnedQty * i.price);
  double get total => subtotal - returnedAmount + deliveryFee;
  bool get canReturn => status == 'pending' || status == 'confirmed' || status == 'delivered';

  factory AdminOrder.fromJson(Map<String, dynamic> j) {
    final c = (j['customer'] as Map?) ?? {};
    final t = (j['timeline'] as Map?) ?? {};
    return AdminOrder(
      id: toInt(j['id']),
      status: j['status']?.toString() ?? 'pending',
      createdAt: j['createdAt']?.toString() ?? '',
      customerName: c['name']?.toString() ?? '',
      phone: c['phone']?.toString() ?? '',
      address: c['address']?.toString() ?? '',
      items: ((j['items'] as List?) ?? [])
          .map((i) => AdminOrderItem(toInt(i['id']), i['name']?.toString() ?? '', i['image']?.toString(), toInt(i['qty']),
              toNum(i['price']), toInt(i['returnedQty'])))
          .toList(),
      deliveryFee: toNum(j['deliveryFee']),
      timeline: {for (final e in t.entries) if (e.value != null) e.key.toString(): e.value.toString()},
      paidAt: j['paidAt']?.toString(),
      overdue: j['overdue'] == true,
    );
  }
}

class AdminVariant {
  final int id;
  final String name;
  final double price;
  final int remain;
  AdminVariant(this.id, this.name, this.price, this.remain);
}

class AdminProduct {
  final int id;
  final String name;
  final String? storeName;
  final int? categoryId;
  final double price;
  final double mainPrice;
  final List<String> images;
  final String status;
  final List<AdminVariant> variants;
  final int remain;
  final String? createdAt;

  AdminProduct({
    required this.id,
    required this.name,
    this.storeName,
    this.categoryId,
    required this.price,
    required this.mainPrice,
    required this.images,
    required this.status,
    required this.variants,
    required this.remain,
    this.createdAt,
  });

  String? get image => images.isEmpty ? null : fileUrl(images.first, 'thumbnail');
  bool get isActive => status == 'active';

  factory AdminProduct.fromJson(Map<String, dynamic> j) {
    final variants = ((j['variants'] as List?) ?? [])
        .map((v) => AdminVariant(toInt(v['id']), v['name']?.toString() ?? '', toNum(v['price']), toInt(v['remain'])))
        .toList();
    final status = j['statusId']?.toString() ?? (j['isActive'] == false ? 'inactive' : 'active');
    return AdminProduct(
      id: toInt(j['id']),
      name: (j['name'] ?? j['title'] ?? '').toString(),
      storeName: (j['store']?['name'] ?? j['storeName'])?.toString(),
      categoryId: j['categoryId'] == null ? null : toInt(j['categoryId']),
      price: toNum(j['price']),
      mainPrice: toNum(j['mainPrice']),
      images: ((j['images'] as List?) ?? []).map((e) => e.toString()).toList(),
      status: status,
      variants: variants,
      remain: variants.isEmpty ? toInt(j['qty']) : variants.fold(0, (s, v) => s + v.remain),
      createdAt: j['createdAt']?.toString(),
    );
  }
}

class SalesData {
  final String unit;
  final int orders;
  final double revenue;
  final int prevOrders;
  final double prevRevenue;
  final List<(DateTime, double)> series;
  SalesData(this.unit, this.orders, this.revenue, this.prevOrders, this.prevRevenue, this.series);

  factory SalesData.fromJson(Map<String, dynamic> j) => SalesData(
        j['unit']?.toString() ?? 'day',
        toInt(j['orders']),
        toNum(j['revenue']),
        toInt(j['previous']?['orders']),
        toNum(j['previous']?['revenue']),
        ((j['series'] as List?) ?? [])
            .map((p) => (DateTime.tryParse(p['start'].toString())?.toLocal() ?? DateTime.now(), toNum(p['value'])))
            .toList(),
      );
}
