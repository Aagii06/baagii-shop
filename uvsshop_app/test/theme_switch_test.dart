import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:uvsshop_app/ui/admin/admin_design.dart';

void main() {
  testWidgets('switch shop -> admin theme (animated, no TextStyle lerp error)', (t) async {
    final shopTheme = ThemeData(useMaterial3: true);
    Widget app(ThemeData th) => MaterialApp(
          theme: th,
          home: Scaffold(
            appBar: AppBar(title: const Text('x')),
            body: Column(children: [
              FilledButton(onPressed: () {}, child: const Text('a')),
              OutlinedButton(onPressed: () {}, child: const Text('b')),
              const TextField(decoration: InputDecoration(labelText: 'c')),
            ]),
          ),
        );
    await t.pumpWidget(app(shopTheme));
    await t.pumpWidget(app(adminTheme));
    for (var i = 0; i < 10; i++) {
      await t.pump(const Duration(milliseconds: 30));
    }
    expect(t.takeException(), isNull);
  });
}
