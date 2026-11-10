import 'api_client.dart';

// Админы профайл цэсний хуудсуудын өгөгдөл (admin/src/lib/api/*-тэй ижил).

String? _str(dynamic v) => v == null || v.toString().isEmpty ? null : v.toString();
List<String> _strings(dynamic v) => ((v as List?) ?? []).map((e) => e.toString()).where((e) => e.isNotEmpty).toList();

// ---------- дэлгүүр ----------

/// Дэлгүүр бүр хэдэн утас, имэйл, хаягтай байж болох.
const maxStoreContacts = 5;

/// Түвшин, өндрөөс нь эхлээд.
const storeTiers = ['gold', 'silver', 'bronze', 'normal'];
const storeTierLabel = {'gold': 'Gold', 'silver': 'Silver', 'bronze': 'Bronze', 'normal': 'Энгийн'};

class Store {
  final int id;
  final String name;
  final List<String> phones;
  final List<String> emails;
  final List<String> addresses;
  final String? logo;
  final String tier;
  final int productsCnt;
  final String createdAt;

  Store({
    required this.id,
    required this.name,
    required this.phones,
    required this.emails,
    required this.addresses,
    this.logo,
    required this.tier,
    required this.productsCnt,
    required this.createdAt,
  });

  String? get phone => phones.isEmpty ? null : phones.first;
  String? get email => emails.isEmpty ? null : emails.first;
  String? get address => addresses.isEmpty ? null : addresses.first;

  factory Store.fromJson(Map<String, dynamic> j) {
    List<String> list(String many, String one) {
      final l = _strings(j[many]);
      if (l.isEmpty && _str(j[one]) != null) l.add(j[one].toString());
      return l;
    }

    return Store(
      id: toInt(j['id']),
      name: j['name']?.toString() ?? '',
      phones: list('phones', 'phone'),
      emails: list('emails', 'email'),
      addresses: list('addresses', 'address'),
      logo: _str(j['logo']),
      tier: storeTiers.contains(j['tier']) ? j['tier'] as String : 'normal',
      productsCnt: toInt(j['productsCnt']),
      createdAt: j['createdAt']?.toString() ?? '',
    );
  }
}

// ---------- хэрэглэгч ----------

const userRoleLabel = {'admin': 'Админ', 'shopper': 'Дэлгүүр'};

class PanelUser {
  final int id;
  final String? name;
  final String phone;
  final String? email;
  final String role;
  final int? storeId;
  final String? storeName;
  PanelUser(this.id, this.name, this.phone, this.email, this.role, this.storeId, this.storeName);

  factory PanelUser.fromJson(Map<String, dynamic> j) {
    final s = j['store'] as Map?;
    return PanelUser(
      toInt(j['id']),
      _str(j['name']),
      j['phone']?.toString() ?? '',
      _str(j['email']),
      j['role'] == 'admin' ? 'admin' : 'shopper',
      s == null ? null : toInt(s['id']),
      _str(s?['name']),
    );
  }
}

// ---------- худалдан авагч ----------

class Customer {
  final int id;
  final String phone;
  final String? name;
  final int orderCount;
  final String? lastOrderAt;
  final String? createdAt;
  Customer(this.id, this.phone, this.name, this.orderCount, this.lastOrderAt, this.createdAt);

  factory Customer.fromJson(Map<String, dynamic> j) => Customer(
        toInt(j['id']),
        j['phone']?.toString() ?? '',
        _str(j['name']),
        toInt(j['orderCount']),
        _str(j['lastOrderAt']),
        _str(j['createdAt']),
      );
}

// ---------- санал хүсэлт ----------

const feedbackStatusLabel = {'new': 'Шинэ', 'read': 'Уншсан'};

class FeedbackMsg {
  final int id;
  final String name;
  final String email;
  final String? phone;
  final String? subject;
  final String message;
  final String status;
  final String createdAt;
  FeedbackMsg(this.id, this.name, this.email, this.phone, this.subject, this.message, this.status, this.createdAt);

  bool get isNew => status == 'new';

  factory FeedbackMsg.fromJson(Map<String, dynamic> j) => FeedbackMsg(
        toInt(j['id']),
        j['name']?.toString() ?? '',
        j['email']?.toString() ?? '',
        _str(j['phone']),
        _str(j['subject']),
        j['message']?.toString() ?? '',
        j['status'] == 'read' ? 'read' : 'new',
        j['createdAt']?.toString() ?? '',
      );
}

// ---------- хамтран ажиллах хүсэлт ----------

const partnerStatusLabel = {'pending': 'Хүлээгдэж буй', 'approved': 'Баталсан', 'rejected': 'Татгалзсан'};

class PartnerRequest {
  final int id;
  final String phone;
  final String? storeName;
  final String? name;
  final String? email;
  final String? address;
  final String status;
  final int? storeId;
  final String createdAt;
  PartnerRequest(this.id, this.phone, this.storeName, this.name, this.email, this.address, this.status, this.storeId,
      this.createdAt);

  factory PartnerRequest.fromJson(Map<String, dynamic> j) => PartnerRequest(
        toInt(j['id']),
        j['phone']?.toString() ?? '',
        _str(j['storeName']),
        _str(j['name']),
        _str(j['email']),
        _str(j['address']),
        partnerStatusLabel.containsKey(j['status']) ? j['status'] as String : 'pending',
        j['storeId'] == null ? null : toInt(j['storeId']),
        j['createdAt']?.toString() ?? '',
      );
}

// ---------- хүргэлтийн тэмдэглэл ----------

class DoNote {
  final int id;
  final String name;
  final String? description;
  final String createdAt;
  DoNote(this.id, this.name, this.description, this.createdAt);

  factory DoNote.fromJson(Map<String, dynamic> j) =>
      DoNote(toInt(j['id']), j['name']?.toString() ?? '', _str(j['description']), j['createdAt']?.toString() ?? '');
}

// ---------- төлбөрийн тохиргоо ----------

class PaymentSettings {
  bool deliveryEnabled;
  int deliveryFee;
  bool bankEnabled;
  String bankName;
  String accountName;
  String accountNumber;
  String iban;
  bool qpayEnabled;
  bool qpaySandbox;
  String qpayUsername;
  bool qpayHasPassword;
  String qpayInvoiceCode;

  PaymentSettings.fromJson(Map<String, dynamic> j)
      : deliveryEnabled = j['delivery']?['enabled'] == true,
        deliveryFee = toInt(j['delivery']?['fee']),
        bankEnabled = j['bank']?['enabled'] == true,
        bankName = j['bank']?['bankName']?.toString() ?? '',
        accountName = j['bank']?['accountName']?.toString() ?? '',
        accountNumber = j['bank']?['accountNumber']?.toString() ?? '',
        iban = j['bank']?['iban']?.toString() ?? '',
        qpayEnabled = j['qpay']?['enabled'] == true,
        qpaySandbox = j['qpay']?['sandbox'] == true,
        qpayUsername = j['qpay']?['username']?.toString() ?? '',
        qpayHasPassword = j['qpay']?['hasPassword'] == true,
        qpayInvoiceCode = j['qpay']?['invoiceCode']?.toString() ?? '';
}

// ---------- категори ----------

/// Категори хамгийн ихдээ хэдэн түвшин үүрлэх.
const maxCategoryDepth = 4;

/// Нэг категорид хамгийн ихдээ хэдэн үзүүлэлт.
const maxCategoryAttrs = 3;

class CategoryAttr {
  final int id;
  final String name;
  CategoryAttr(this.id, this.name);
}

class Category {
  final int id;
  final int? parentId;
  final String name;

  /// Хадгалахад өөрчлөлтгүй буцааж илгээдэг талбарууд.
  final Map<String, dynamic> raw;
  final List<CategoryAttr> attrs;
  final List<Category> children;
  int depth = 0;

  Category(this.id, this.parentId, this.name, this.raw, this.attrs, this.children);

  bool get isLeaf => children.isEmpty;

  factory Category.fromJson(Map<String, dynamic> j) => Category(
        toInt(j['id']),
        j['parentId'] == null ? null : toInt(j['parentId']),
        j['name']?.toString() ?? '',
        j,
        ((j['attrs'] as List?) ?? []).map((a) => CategoryAttr(toInt(a['id']), a['name']?.toString() ?? '')).toList(),
        ((j['children'] as List?) ?? []).map((c) => Category.fromJson(c as Map<String, dynamic>)).toList(),
      );

  /// Өөрийн дэд модны түвшин (навч бол 1).
  int get height => 1 + children.fold(0, (m, c) => c.height > m ? c.height : m);

  bool contains(int id) => this.id == id || children.any((c) => c.contains(id));
}

/// Модыг эцэг → хүүхэд дарааллаар нэг жагсаалт болгож, түвшинг нь тэмдэглэнэ.
List<Category> flattenCategories(List<Category> list, [int depth = 0]) => [
      for (final c in list) ...[
        c..depth = depth,
        ...flattenCategories(c.children, depth + 1),
      ],
    ];

String attrsSummary(List<String> names) {
  if (names.isEmpty) return 'Сонголтгүй';
  return [for (var i = 0; i < names.length; i++) i == 0 ? names[i] : names[i].toLowerCase()].join(', ');
}

// ---------- үзүүлэлт ----------

class AttrValue {
  final int? id;
  final String name;
  final int orderNumber;
  final String? color;
  final Map<String, dynamic> raw;
  AttrValue(this.id, this.name, this.orderNumber, this.color, this.raw);
}

class AttrRecord {
  final int id;
  final String name;
  final int valuesCnt;
  final List<AttrValue> values;
  final Map<String, dynamic> raw;
  AttrRecord(this.id, this.name, this.valuesCnt, this.values, this.raw);

  factory AttrRecord.fromJson(Map<String, dynamic> j) {
    final values = <AttrValue>[];
    final list = (j['attrValues'] as List?) ?? [];
    for (var i = 0; i < list.length; i++) {
      final v = list[i] as Map<String, dynamic>;
      values.add(AttrValue(v['id'] == null ? null : toInt(v['id']), v['name']?.toString() ?? '',
          v['orderNumber'] == null ? i : toInt(v['orderNumber']), _str(v['color']), v));
    }
    values.sort((a, b) => a.orderNumber.compareTo(b.orderNumber));
    return AttrRecord(toInt(j['id']), j['name']?.toString() ?? '',
        j['valuesCnt'] == null ? values.length : toInt(j['valuesCnt']), values, j);
  }

  String get preview => values.take(4).map((v) => v.name).join(', ') + (values.length > 4 ? '…' : '');
}

/// "xl " = "XL", "512ГБ" = "512 ГБ".
String valueKey(String v) => v.replaceAll(RegExp(r'\s+'), '').toUpperCase();

// ---------- байршил ----------

class Area {
  final int id;
  final String name;
  Area(this.id, this.name);
}
