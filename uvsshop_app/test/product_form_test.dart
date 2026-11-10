import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uvsshop_app/api/admin_manage_models.dart';
import 'package:uvsshop_app/api/admin_models.dart';
import 'package:uvsshop_app/state/admin_state.dart';
import 'package:uvsshop_app/state/product_draft.dart';
import 'package:uvsshop_app/ui/admin/admin_design.dart';
import 'package:uvsshop_app/ui/admin/product_form_page.dart';

// Каталог: Өнгө (Хар, Цагаан), Хэмжээ (S, M, L)
final catalogue = [
  AttrRecord.fromJson({
    'id': 1,
    'name': 'Өнгө',
    'attrValues': [
      {'id': 11, 'name': 'Хар', 'color': '#000000', 'orderNumber': 0},
      {'id': 12, 'name': 'Цагаан', 'color': '#ffffff', 'orderNumber': 1},
    ],
  }),
  AttrRecord.fromJson({
    'id': 2,
    'name': 'Хэмжээ',
    'attrValues': [
      {'id': 21, 'name': 'S', 'orderNumber': 0},
      {'id': 22, 'name': 'M', 'orderNumber': 1},
      {'id': 23, 'name': 'L', 'orderNumber': 2},
    ],
  }),
];

// Хувцас → Цамц (навч, Өнгө + Хэмжээ)
List<AdminCategory> categories() => flattenCategories([
      AdminCategory.fromJson({
        'id': 5,
        'parentId': null,
        'name': 'Хувцас',
        'children': [
          {
            'id': 6,
            'parentId': 5,
            'name': 'Цамц',
            'attrs': [
              {'id': 1, 'name': 'Өнгө'},
              {'id': 2, 'name': 'Хэмжээ'},
            ],
            'children': [],
          },
        ],
      }),
    ]);

// backend toAdminProduct-ийн хэлбэр
final product = <String, dynamic>{
  'id': 63,
  'storeId': null,
  'categoryId': 6,
  'name': 'Цамц',
  'description': '<p>Сайн цамц</p>',
  'images': ['img-main'],
  'qty': '5',
  'mainPrice': '50000',
  'price': '50000',
  'saleStart': null,
  'saleEnd': null,
  'isActive': true,
  'statusId': 'active',
  'attrs': [
    {
      'attrId': 1,
      'attrName': 'Өнгө',
      'viewType': 'image',
      'orderNumber': 0,
      'values': [
        {'attrValueId': 11, 'value': 'Хар', 'color': '#000000', 'image': 'img-black', 'images': ['img-black-2'], 'orderNumber': 0},
      ],
    },
    {
      'attrId': 2,
      'attrName': 'Хэмжээ',
      'viewType': 'text',
      'orderNumber': 1,
      'values': [
        {'attrValueId': 21, 'value': 'S', 'color': null, 'image': null, 'images': [], 'orderNumber': 0},
        {'attrValueId': 22, 'value': 'M', 'color': null, 'image': null, 'images': [], 'orderNumber': 1},
      ],
    },
  ],
  'variants': [
    {
      'id': 101,
      'name': 'Хар / S',
      'price': '50000',
      'mainPrice': '50000',
      'qty': '2',
      'remain': '2',
      'attr': [
        {'attrId': 1, 'attrName': 'Өнгө', 'value': 'Хар', 'color': '#000000', 'image': 'img-black'},
        {'attrId': 2, 'attrName': 'Хэмжээ', 'value': 'S', 'color': null, 'image': null},
      ],
    },
    {
      'id': 102,
      'name': 'Хар / M',
      'price': '50000',
      'mainPrice': '50000',
      'qty': '3',
      'remain': '3',
      'attr': [
        {'attrId': 1, 'attrName': 'Өнгө', 'value': 'Хар', 'color': '#000000', 'image': 'img-black'},
        {'attrId': 2, 'attrName': 'Хэмжээ', 'value': 'M', 'color': null, 'image': null},
      ],
    },
  ],
};

class _FakeAdmin extends AdminState {
  @override
  Future<Map<String, dynamic>?> productRaw(int id) async => product;
  @override
  Future<List<AdminCategory>> categoryTree() async => [
        AdminCategory.fromJson({
          'id': 5,
          'parentId': null,
          'name': 'Хувцас',
          'children': [
            {
              'id': 6,
              'parentId': 5,
              'name': 'Цамц',
              'attrs': [
                {'id': 1, 'name': 'Өнгө'},
                {'id': 2, 'name': 'Хэмжээ'},
              ],
              'children': [],
            },
          ],
        }),
      ];
  @override
  Future<List<AttrRecord>> attrsFull() async => catalogue;
  @override
  Future<List<Store>> stores() async => [];
  @override
  Future<void> refreshUnread() async {}
}

void main() {
  test('loads a saved product like the web editor', () {
    final d = ProductDraft(product: product, categories: categories(), catalogue: catalogue);
    expect(d.name, 'Цамц');
    expect(d.price, '50000');
    expect(d.note, 'Сайн цамц');
    expect(d.attrs.map((a) => a.name), ['Өнгө', 'Хэмжээ']);
    expect(d.attrs.first.isColor, isTrue);
    // Хар×S, Хар×M зарагддаг; хослол бүр мөр болно.
    expect(d.variants.map((r) => '${r.values.values.join('/')}=${r.qty}${r.off ? ' off' : ''}'), ['Хар/S=2', 'Хар/M=3']);
    expect(d.images['1=ХАР'], ['img-black', 'img-black-2']);
    expect(d.dirty, isFalse);
  });

  test('body matches the web toProductBody', () {
    final d = ProductDraft(product: product, categories: categories(), catalogue: catalogue);
    // Цагаан нэмэхэд шинэ хослолууд (Цагаан×S, Цагаан×M) 0-ээр нэмэгдэнэ.
    final color = d.attrs.first;
    d.setAttrValues(color.key, [...color.values, const PAttrValue('Цагаан', '#ffffff', 12)]);
    expect(d.variants.length, 4);
    // Үнэ солиход тэр үнээр байсан хувилбарууд дагана.
    d.setPrice('60000');
    expect(d.variants.every((r) => r.price == '60000'), isTrue);
    // Хямдрал → хугацаа асууна.
    d.setSalePrice('55000');
    expect(d.onSale, isTrue);
    // Цагаан×M-ийг зарахгүй.
    final whiteM = d.variants.firstWhere((r) => r.values['1'] == 'Цагаан' && r.values['2'] == 'M');
    d.updateVariant(whiteM, off: true);
    expect(d.dirty, isTrue);

    final body = d.body();
    expect(body['categoryId'], 6);
    expect(body['mainPrice'], 60000);
    expect(body['price'], 55000);
    expect(body['saleStart'], isNotNull);
    expect(body['images'], ['img-main']);
    expect(body['description'], '<p>Сайн цамц</p>', reason: 'unchanged note keeps its HTML');
    final variants = (body['variants'] as List).cast<Map<String, dynamic>>();
    expect(variants.map((v) => v['name']), ['Хар / S', 'Хар / M', 'Цагаан / S']);
    expect(variants.map((v) => v['id']), [101, 102, null]);
    expect(variants.first['attr'], [
      {'attrId': 1, 'attrName': 'Өнгө', 'value': 'Хар', 'color': '#000000', 'image': 'img-black'},
      {'attrId': 2, 'attrName': 'Хэмжээ', 'value': 'S', 'color': null, 'image': null},
    ]);
    expect(body['qty'], 5);
    final attrs = (body['attrs'] as List).cast<Map<String, dynamic>>();
    expect(attrs.first['values'], [
      {'attrValueId': 11, 'value': 'Хар', 'color': '#000000', 'image': 'img-black', 'images': ['img-black-2']},
      {'attrValueId': 12, 'value': 'Цагаан', 'color': '#ffffff', 'image': null, 'images': <String>[]},
    ]);
  });

  test('new product without options sells one version', () {
    final d = ProductDraft(product: null, categories: categories(), catalogue: catalogue);
    expect(d.hasBasics, isFalse);
    d.update(() => d.name = 'Ном');
    d.setPrice('15000');
    d.update(() => d.categoryId = 5); // эцэг категори — сонголтгүй
    expect(d.attrs, isEmpty);
    d.updateVariant(d.variants.first, qty: '7');
    final body = d.body();
    expect((body['variants'] as List).single, {'id': null, 'name': 'Ном', 'price': 15000, 'mainPrice': 15000, 'qty': 7, 'attr': []});
    expect(body['saleStart'], isNull);
  });

  testWidgets('edit form and variants page open', (t) async {
    SharedPreferences.setMockInitialValues({});
    final admin = _FakeAdmin()..user = AdminUser(1, 'A', '8011', null, 'admin', null);
    await t.pumpWidget(ChangeNotifierProvider<AdminState>.value(
      value: admin,
      child: MaterialApp(theme: adminTheme, home: const ProductFormPage(productId: 63)),
    ));
    await t.pumpAndSettle();
    expect(t.takeException(), isNull);
    expect(find.text('Бараа засах'), findsOneWidget);
    final card = find.text('Өнгө, хэмжээ, тоо оруулах');
    await t.scrollUntilVisible(card, 200, scrollable: find.byType(Scrollable).first);
    await t.tap(card);
    await t.pumpAndSettle();
    expect(t.takeException(), isNull);
    expect(find.text('Хар - S'), findsOneWidget);
    await t.scrollUntilVisible(find.text('Тоо, үнэ'), 200, scrollable: find.byType(Scrollable).last);
    await t.tap(find.text('Болсон'));
    await t.pumpAndSettle();
    await t.scrollUntilVisible(find.text('Барааг устгах'), 300, scrollable: find.byType(Scrollable).first);
    expect(t.takeException(), isNull);
  });

  testWidgets('new product form opens', (t) async {
    SharedPreferences.setMockInitialValues({});
    final admin = _FakeAdmin()..user = AdminUser(1, 'A', '8011', null, 'admin', null);
    await t.pumpWidget(ChangeNotifierProvider<AdminState>.value(
      value: admin,
      child: MaterialApp(theme: adminTheme, home: const ProductFormPage()),
    ));
    await t.pumpAndSettle();
    expect(t.takeException(), isNull);
    expect(find.text('Бараа нэмэх'), findsOneWidget);
    expect(find.text('Барааг устгах'), findsNothing);
  });
}
