import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Монгол утасны дугаарын маск: "9911 2345" (вебийн components/ui/phone-input.tsx-тэй адил).
/// Утга нь (controller.text) зөвхөн 8 цифр хэвээр — зайг зөвхөн харуулахдаа нэмнэ,
/// тиймээс дугаар уншдаг, шалгадаг код өөрчлөгдөхгүй.
class PhoneController extends TextEditingController {
  PhoneController({super.text});

  @override
  TextSpan buildTextSpan({required BuildContext context, TextStyle? style, required bool withComposing}) {
    final t = text;
    if (t.length <= 4) return TextSpan(style: style, text: t);
    // 4 дэх цифрийн араас зай (letterSpacing) — курсор, сонголт зөв хэвээр.
    final gap = (style?.fontSize ?? 16) * 0.5;
    return TextSpan(style: style, children: [
      TextSpan(text: t.substring(0, 3)),
      TextSpan(text: t.substring(3, 4), style: TextStyle(letterSpacing: gap)),
      TextSpan(text: t.substring(4)),
    ]);
  }
}

/// Зөвхөн цифр, 8 хүртэл; "+976 9911 2345" гэж буулгавал улсын кодыг хасна.
class _PhoneDigitsFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(TextEditingValue oldValue, TextEditingValue newValue) {
    var digits = newValue.text.replaceAll(RegExp(r'\D'), '');
    if (digits.length > 8 && digits.startsWith('976')) digits = digits.substring(3);
    if (digits.length > 8) digits = digits.substring(0, 8);
    if (digits == newValue.text) return newValue;
    return TextEditingValue(text: digits, selection: TextSelection.collapsed(offset: digits.length));
  }
}

final List<TextInputFormatter> phoneFormatters = [_PhoneDigitsFormatter()];

/// controller-гүй (initialValue + onChanged) газарт: маскласан утасны талбар.
class PhoneFormField extends StatefulWidget {
  final String initialValue;
  final ValueChanged<String> onChanged;
  final InputDecoration? decoration;
  final bool autofocus;
  final TextStyle? style;
  const PhoneFormField({super.key, this.initialValue = '', required this.onChanged, this.decoration, this.autofocus = false, this.style});

  @override
  State<PhoneFormField> createState() => _PhoneFormFieldState();
}

class _PhoneFormFieldState extends State<PhoneFormField> {
  late final _controller = PhoneController(text: widget.initialValue);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => TextFormField(
        controller: _controller,
        autofocus: widget.autofocus,
        keyboardType: TextInputType.phone,
        inputFormatters: phoneFormatters,
        style: widget.style,
        onChanged: widget.onChanged,
        decoration: widget.decoration,
      );
}
