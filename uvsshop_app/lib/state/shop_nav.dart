import 'package:flutter/foundation.dart';

/// Худалдан авагчийн доод цэс — web-ийн MobileBottomNav-тай адил.
enum ShopTab { home, search, cart, saved, profile }

/// web-ийн SortTabs.
enum SearchSort { discount, newest, priceAsc, rating }

const searchSortLabel = {
  SearchSort.discount: 'Хямдралын хувиар',
  SearchSort.newest: 'Шинэ',
  SearchSort.priceAsc: 'Үнэ өсөхөөр',
  SearchSort.rating: 'Үнэлгээ',
};

/// "Хайх" табыг нээх хүсэлт — web-ийн `/search?category=&sale=1&store=&sort=`.
class SearchRequest {
  final int? categoryId;
  final bool sale;
  final String? store;
  final SearchSort? sort;
  final String? query;
  const SearchRequest({this.categoryId, this.sale = false, this.store, this.sort, this.query});
}

/// Таб солих, хайлтыг шүүлтүүртэй нээх (нүүр хуудаснаас гэх мэт).
class ShopNav extends ChangeNotifier {
  ShopTab tab = ShopTab.home;

  /// "Хайх" хуудас уншаад цэвэрлэнэ.
  SearchRequest? pendingSearch;

  void open(ShopTab t) {
    if (tab == t) return;
    tab = t;
    notifyListeners();
  }

  void openSearch([SearchRequest request = const SearchRequest()]) {
    pendingSearch = request;
    tab = ShopTab.search;
    notifyListeners();
  }

  SearchRequest? takeSearch() {
    final r = pendingSearch;
    pendingSearch = null;
    return r;
  }
}
