import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:uvsshop_app/ui/common.dart';

void main() {
  testWidgets('logo loader spins around the logo', (t) async {
    await t.pumpWidget(const MaterialApp(home: Scaffold(body: Center(child: LogoLoader()))));
    final turns = t.widget<RotationTransition>(find.descendant(of: find.byType(LogoLoader), matching: find.byType(RotationTransition))).turns;
    final before = turns.value;
    await t.pump(const Duration(milliseconds: 275));
    expect(turns.value, isNot(before), reason: 'arc rotates');
    expect(find.descendant(of: find.byType(LogoLoader), matching: find.byType(Image)), findsOneWidget);
    expect(t.getSize(find.byType(LogoLoader)), const Size(112, 112));
    expect(t.takeException(), isNull);
  });
}
