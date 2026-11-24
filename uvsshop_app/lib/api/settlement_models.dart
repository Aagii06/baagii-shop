import 'api_client.dart';

/// Дэлгүүрийн (худалдагчийн) борлуулалт ба тооцоо — backend `/storeReport` (зөвхөн админ).
/// web-ийн admin/src/lib/api/storeReport.ts-тэй ижил.
class StoreSales {
  final int storeId;
  final String storeName;
  final String? logo;
  final int orders;
  final double delivered;
  final double pending;
  final double settled;

  /// Олгох үлдэгдэл — хүргэгдсэн, тооцоо хийгдээгүй бараа (бүх хугацаа).
  final double balance;
  StoreSales(this.storeId, this.storeName, this.logo, this.orders, this.delivered, this.pending, this.settled, this.balance);

  factory StoreSales.fromJson(Map<String, dynamic> j) => StoreSales(
        toInt(j['storeId']),
        j['storeName']?.toString() ?? '',
        j['logo']?.toString(),
        toInt(j['orders']),
        toNum(j['delivered']),
        toNum(j['pending']),
        toNum(j['settled']),
        toNum(j['balance']),
      );
}

/// Бараа (хувилбар) бүрээр нэгтгэсэн мөр. qty сөрөг — тооцооны дараа буцаасан (хасагдана).
class SoldItem {
  final String name;
  final String? image;
  final int orders;
  final int qty;
  final double amount;
  SoldItem(this.name, this.image, this.orders, this.qty, this.amount);

  factory SoldItem.fromJson(Map<String, dynamic> j) =>
      SoldItem(j['name']?.toString() ?? '', j['image']?.toString(), toInt(j['orders']), toInt(j['qty']), toNum(j['amount']));
}

class UnsettledOrder {
  final int id;
  final String orderNumber;
  final String? deliveredAt;
  final double amount;
  final List<({String name, String? image, int qty, double price})> items;
  UnsettledOrder(this.id, this.orderNumber, this.deliveredAt, this.amount, this.items);

  factory UnsettledOrder.fromJson(Map<String, dynamic> j) => UnsettledOrder(
        toInt(j['id']),
        j['orderNumber']?.toString() ?? '#${j['id']}',
        j['deliveredAt']?.toString(),
        toNum(j['amount']),
        [
          for (final i in (j['items'] as List?) ?? [])
            (name: i['name']?.toString() ?? '', image: i['image']?.toString(), qty: toInt(i['qty']), price: toNum(i['price'])),
        ],
      );
}

class Settlement {
  final int id;
  final double amount;
  final String? note;
  final String createdAt;
  final int orders;
  final int qty;
  Settlement(this.id, this.amount, this.note, this.createdAt, this.orders, this.qty);

  factory Settlement.fromJson(Map<String, dynamic> j) => Settlement(
        toInt(j['id']),
        toNum(j['amount']),
        j['note']?.toString(),
        j['createdAt']?.toString() ?? '',
        toInt(j['orders']),
        toInt(j['qty']),
      );
}

/// Нэг дэлгүүрийн нийт тооцоо: тооцоо хийгдээгүй бараа, хүргэгдээгүй бараа, тооцооны түүх.
class StoreAccount {
  final StoreSales summary;
  final double allTimeDelivered;
  final double allTimePending;
  final List<SoldItem> unsettledItems;
  final List<UnsettledOrder> unsettledOrders;
  final List<SoldItem> pendingItems;
  final List<Settlement> settlements;
  StoreAccount(this.summary, this.allTimeDelivered, this.allTimePending, this.unsettledItems, this.unsettledOrders, this.pendingItems,
      this.settlements);

  factory StoreAccount.fromJson(Map<String, dynamic> j) {
    final all = (j['allTime'] as Map?) ?? {};
    final un = (j['unsettled'] as Map?) ?? {};
    List<T> list<T>(Object? v, T Function(Map<String, dynamic>) f) =>
        [for (final x in (v as List?) ?? []) f(Map<String, dynamic>.from(x as Map))];
    return StoreAccount(
      StoreSales.fromJson(j),
      toNum(all['delivered']),
      toNum(all['pending']),
      list(un['items'], SoldItem.fromJson),
      list(un['orders'], UnsettledOrder.fromJson),
      list(j['pendingItems'], SoldItem.fromJson),
      list(j['settlements'], Settlement.fromJson),
    );
  }
}
