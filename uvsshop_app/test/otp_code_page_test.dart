import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uvsshop_app/state/shop_state.dart';
import 'package:uvsshop_app/ui/shop/sign_in_page.dart';

class _FakeShop extends ShopState {
  @override
  Future<void> sendOtp(String phone) async {}
  @override
  Future<bool> verifyOtp(String phone, String code) async => code == '1234';
}

Future<bool?> _open(WidgetTester t) async {
  SharedPreferences.setMockInitialValues({});
  bool? result;
  await t.pumpWidget(ChangeNotifierProvider<ShopState>.value(
    value: _FakeShop(),
    child: MaterialApp(
      home: Builder(
        builder: (context) => TextButton(
          onPressed: () async =>
              result = await Navigator.of(context).push<bool>(MaterialPageRoute(builder: (_) => const OtpCodePage(phone: '99112233'))),
          child: const Text('open'),
        ),
      ),
    ),
  ));
  await t.tap(find.text('open'));
  await t.pumpAndSettle();
  return result;
}

void main() {
  testWidgets('going back shows the countdown under the phone and reuses the code', (t) async {
    SharedPreferences.setMockInitialValues({});
    final shop = _CountingShop();
    await t.pumpWidget(ChangeNotifierProvider<ShopState>.value(
      value: shop,
      child: MaterialApp(home: Scaffold(body: ListView(children: [PhoneOtpForm(onDone: () {})]))),
    ));
    await t.enterText(find.byType(TextField), '99112233');
    await t.tap(find.text('Код авах'));
    await t.pumpAndSettle();
    expect(shop.sent, 1);
    expect(find.text('Код баталгаажуулах'), findsOneWidget);
    await t.tap(find.text('Дугаар солих'));
    await t.pumpAndSettle();
    // Дугаарын доор таймер, товч "Код оруулах".
    expect(find.text('Код дахин авах боломжтой: '), findsOneWidget);
    int left() {
      final text = t.widget<Text>(find.textContaining(RegExp(r'^\d:\d\d$'))).data!;
      final parts = text.split(':');
      return int.parse(parts[0]) * 60 + int.parse(parts[1]);
    }
    final first = left();
    expect(first, inInclusiveRange(55, 60));
    await t.pump(const Duration(seconds: 5));
    expect(left(), first - 5);
    await t.tap(find.text('Код оруулах'));
    await t.pumpAndSettle();
    expect(shop.sent, 1, reason: 'no new SMS while waiting');
    await t.tap(find.text('Дугаар солих'));
    await t.pumpAndSettle();
    await t.pump(const Duration(seconds: 60));
    expect(find.text('Код авах'), findsOneWidget);
    expect(find.text('Код дахин авах боломжтой: '), findsNothing);
    expect(t.takeException(), isNull);
  });

  testWidgets('4 digits verify, then success screen returns true', (t) async {
    bool? result;
    SharedPreferences.setMockInitialValues({});
    await t.pumpWidget(ChangeNotifierProvider<ShopState>.value(
      value: _FakeShop(),
      child: MaterialApp(
        home: Builder(
          builder: (context) => TextButton(
            onPressed: () async => result =
                await Navigator.of(context).push<bool>(MaterialPageRoute(builder: (_) => const OtpCodePage(phone: '99112233'))),
            child: const Text('open'),
          ),
        ),
      ),
    ));
    await t.tap(find.text('open'));
    await t.pumpAndSettle();
    expect(find.text('Код баталгаажуулах'), findsOneWidget);
    expect(find.textContaining('9911 2233'), findsOneWidget);
    await t.enterText(find.byType(TextField), '1234');
    await t.pumpAndSettle();
    expect(find.text('Амжилттай баталгаажлаа'), findsOneWidget);
    await t.tap(find.text('Үргэлжлүүлэх'));
    await t.pumpAndSettle();
    expect(result, isTrue);
    expect(t.takeException(), isNull);
  });

  testWidgets('wrong code shows an error and clears the boxes', (t) async {
    await _open(t);
    await t.enterText(find.byType(TextField), '0000');
    await t.pumpAndSettle();
    expect(find.text('Код буруу эсвэл хугацаа дууссан байна'), findsOneWidget);
    expect(find.text('Амжилттай баталгаажлаа'), findsNothing);
    expect(t.takeException(), isNull);
    expect(find.text('Дахин илгээх (1:00)'), findsOneWidget);
    // 1 минутын хүлээлт дуусахад идэвхжинэ.
    await t.pump(const Duration(seconds: 61));
    expect(find.text('Дахин илгээх'), findsOneWidget);
  });
}

class _CountingShop extends _FakeShop {
  int sent = 0;
  @override
  Future<void> sendOtp(String phone) async => sent++;
}

