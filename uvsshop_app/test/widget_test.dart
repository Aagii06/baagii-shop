import 'package:flutter_test/flutter_test.dart';
import 'package:uvsshop_app/ui/common.dart';

void main() {
  test('money formats with thousands separators', () {
    expect(money(60000), '60,000₮');
    expect(money(1234567), '1,234,567₮');
    expect(money(0), '0₮');
  });

  test('stripHtml removes tags', () {
    expect(stripHtml('<p><strong>99147165</strong></p>'), '99147165');
  });
}
