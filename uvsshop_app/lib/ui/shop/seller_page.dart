import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../state/shop_state.dart';
import '../common.dart';

final _emailRe = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');
const _codeLength = 4;
const _resendSeconds = 30;

/// web-ийн /seller (Борлуулагч болох): эхлээд утсаа SMS кодоор баталгаажуулж,
/// дараа нь дэлгүүрийн мэдээллээ оруулна. Админ батлахад дэлгүүр нээгдэнэ.
class SellerPage extends StatefulWidget {
  const SellerPage({super.key});
  @override
  State<SellerPage> createState() => _SellerPageState();
}

class _SellerPageState extends State<SellerPage> {
  late final _phone = TextEditingController(text: context.read<ShopState>().customer?.phone ?? '');
  final _code = TextEditingController();
  final _storeName = TextEditingController();
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _address = TextEditingController();
  final _codeFocus = FocusNode();
  final _storeFocus = FocusNode();

  String? _codeSentTo;
  String? _phoneToken;
  int _cooldown = 0;
  Timer? _timer;
  bool _phoneBusy = false;
  String? _phoneError;
  String? _codeError;
  bool _submitted = false;
  bool _busy = false;
  bool _done = false;
  String? _error;

  bool get _verified => _phoneToken != null;
  bool get _codeSent => !_verified && _codeSentTo == _phone.text;

  @override
  void dispose() {
    _timer?.cancel();
    for (final c in [_phone, _code, _storeName, _name, _email, _address]) {
      c.dispose();
    }
    _codeFocus.dispose();
    _storeFocus.dispose();
    super.dispose();
  }

  void _startCooldown() {
    _timer?.cancel();
    _cooldown = _resendSeconds;
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted || _cooldown <= 0) return t.cancel();
      setState(() => _cooldown--);
    });
  }

  Future<void> _sendCode() async {
    if (_phone.text.length != 8 || _phoneBusy || _cooldown > 0) return;
    setState(() {
      _phoneError = null;
      _codeError = null;
      _phoneBusy = true;
    });
    try {
      await context.read<ShopState>().sendSellerOtp(_phone.text);
      if (!mounted) return;
      setState(() {
        _codeSentTo = _phone.text;
        _code.clear();
        _startCooldown();
      });
      _codeFocus.requestFocus();
    } catch (e) {
      if (mounted) setState(() => _phoneError = e.toString());
    } finally {
      if (mounted) setState(() => _phoneBusy = false);
    }
  }

  Future<void> _verify() async {
    if (_code.text.length < _codeLength || _phoneBusy) return;
    setState(() {
      _codeError = null;
      _phoneBusy = true;
    });
    try {
      final token = await context.read<ShopState>().verifySellerOtp(_phone.text, _code.text);
      if (!mounted) return;
      setState(() {
        _phoneToken = token;
        _codeSentTo = null;
      });
      _storeFocus.requestFocus();
    } catch (e) {
      if (mounted) setState(() => _codeError = e.toString());
    } finally {
      if (mounted) setState(() => _phoneBusy = false);
    }
  }

  void _changePhone() => setState(() {
        _phoneToken = null;
        _codeSentTo = null;
        _code.clear();
        _cooldown = 0;
        _timer?.cancel();
      });

  Future<void> _submit() async {
    if (_phoneToken == null) return;
    setState(() => _submitted = true);
    final email = _email.text.trim();
    if (_storeName.text.trim().isEmpty || _name.text.trim().isEmpty || (email.isNotEmpty && !_emailRe.hasMatch(email))) return;
    setState(() {
      _error = null;
      _busy = true;
    });
    try {
      await context.read<ShopState>().registerSeller(
            phone: _phone.text,
            phoneToken: _phoneToken!,
            storeName: _storeName.text.trim(),
            name: _name.text.trim(),
            email: email.isEmpty ? null : email,
            address: _address.text.trim().isEmpty ? null : _address.text.trim(),
          );
      if (mounted) setState(() => _done = true);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString().isEmpty ? 'Хүсэлт илгээхэд алдаа гарлаа' : e.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Widget _label(String text, {bool optional = false}) => Padding(
        padding: const EdgeInsets.only(bottom: 6),
        child: Text.rich(TextSpan(children: [
          TextSpan(text: text, style: const TextStyle(fontWeight: FontWeight.w500)),
          if (optional) TextSpan(text: ' (заавал биш)', style: TextStyle(color: Colors.grey.shade600)),
        ])),
      );

  Widget _inlineButton(String text, VoidCallback? onPressed) => Padding(
        padding: const EdgeInsets.only(right: 6),
        child: TextButton(
          style: TextButton.styleFrom(
            backgroundColor: brandColor.withValues(alpha: 0.1),
            visualDensity: VisualDensity.compact,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          ),
          onPressed: onPressed,
          child: Text(text, style: const TextStyle(fontWeight: FontWeight.w600)),
        ),
      );

  @override
  Widget build(BuildContext context) {
    final email = _email.text.trim();
    return Scaffold(
      appBar: AppBar(title: const Text('Борлуулагч болох')),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: borderColor)),
          child: _done ? _doneView() : _form(email),
        ),
      ]),
    );
  }

  Widget _doneView() => Column(children: [
        const Icon(Icons.check_circle_outline, size: 48, color: brandColor),
        const SizedBox(height: 16),
        const Text('Хүсэлт илгээгдлээ', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
        const SizedBox(height: 6),
        Text('Бид тантай удахгүй холбогдоно.', style: TextStyle(color: Colors.grey.shade600)),
      ]);

  Widget _form(String email) {
    final verified = _verified;
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      Align(
        alignment: Alignment.centerLeft,
        child: CircleAvatar(radius: 24, backgroundColor: accentColor, child: const Icon(Icons.storefront_outlined, color: brandColor)),
      ),
      const SizedBox(height: 16),
      const Text('Борлуулагч болох', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
      const SizedBox(height: 6),
      Text('Дэлгүүрийнхээ мэдээллийг үлдээж, утсаа баталгаажуулна уу. Хүсэлт батлагдвал таны дэлгүүр нээгдэнэ.',
          style: TextStyle(fontSize: 14, color: Colors.grey.shade600)),
      const SizedBox(height: 24),
      // Алхам 1 — утас, SMS кодоор.
      _label('Утасны дугаар'),
      TextField(
        controller: _phone,
        readOnly: verified,
        keyboardType: TextInputType.phone,
        maxLength: 8,
        inputFormatters: [FilteringTextInputFormatter.digitsOnly],
        onChanged: (_) => setState(() {
          _cooldown = 0;
          _phoneError = null;
        }),
        onSubmitted: (_) => _sendCode(),
        decoration: InputDecoration(
          counterText: '',
          hintText: 'Утасны дугаар',
          errorText: _phoneError,
          helperText: verified || _phoneError != null ? null : 'Энэ дугаар руу баталгаажуулах код илгээнэ.',
          filled: verified,
          fillColor: verified ? Colors.green.shade50 : null,
          suffixIcon: verified
              ? Row(mainAxisSize: MainAxisSize.min, children: [
                  Icon(Icons.check_circle, size: 16, color: Colors.green.shade600),
                  const SizedBox(width: 4),
                  Text('Баталгаажсан', style: TextStyle(color: Colors.green.shade600, fontWeight: FontWeight.w600)),
                  TextButton(onPressed: _changePhone, child: const Text('Солих')),
                ])
              : _inlineButton('Код авах${_cooldown > 0 ? ' ($_cooldown)' : ''}',
                  _phone.text.length != 8 || _phoneBusy || _cooldown > 0 ? null : _sendCode),
        ),
      ),
      if (_codeSent) ...[
        const SizedBox(height: 16),
        _label('Баталгаажуулах код'),
        TextField(
          controller: _code,
          focusNode: _codeFocus,
          keyboardType: TextInputType.number,
          maxLength: _codeLength,
          autofillHints: const [AutofillHints.oneTimeCode],
          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          style: const TextStyle(fontSize: 18, letterSpacing: 8),
          onChanged: (v) {
            setState(() => _codeError = null);
            // Сүүлийн оронг оруулахад шууд шалгана.
            if (v.length == _codeLength) _verify();
          },
          onSubmitted: (_) => _verify(),
          decoration: InputDecoration(
            counterText: '',
            hintText: '••••',
            errorText: _codeError,
            helperText: _codeError == null
                ? '${_phone.text.substring(0, 4)} ${_phone.text.substring(4)} дугаарт ирсэн кодыг оруулна уу'
                : null,
            suffixIcon: _inlineButton('Шалгах', _code.text.length < _codeLength || _phoneBusy ? null : _verify),
          ),
        ),
      ],
      const SizedBox(height: 16),
      // Алхам 2 — дэлгүүрийн мэдээлэл, утас баталгаажсаны дараа нээгдэнэ.
      Opacity(
        opacity: verified ? 1 : 0.5,
        child: IgnorePointer(
          ignoring: !verified,
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            if (!verified)
              Container(
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(color: mutedColor, borderRadius: BorderRadius.circular(8)),
                child: Text('Эхлээд утасны дугаараа баталгаажуулна уу', style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
              ),
            _label('Дэлгүүрийн нэр'),
            TextField(
              controller: _storeName,
              focusNode: _storeFocus,
              onChanged: (_) => setState(() {}),
              decoration: InputDecoration(
                  errorText: _submitted && _storeName.text.trim().isEmpty ? 'Дэлгүүрийн нэр оруулна уу' : null),
            ),
            const SizedBox(height: 16),
            _label('Таны нэр'),
            TextField(
              controller: _name,
              textCapitalization: TextCapitalization.words,
              onChanged: (_) => setState(() {}),
              decoration: InputDecoration(errorText: _submitted && _name.text.trim().isEmpty ? 'Нэрээ оруулна уу' : null),
            ),
            const SizedBox(height: 16),
            _label('Имэйл', optional: true),
            TextField(
              controller: _email,
              keyboardType: TextInputType.emailAddress,
              autocorrect: false,
              onChanged: (_) => setState(() {}),
              decoration:
                  InputDecoration(errorText: _submitted && email.isNotEmpty && !_emailRe.hasMatch(email) ? 'Имэйл буруу байна' : null),
            ),
            const SizedBox(height: 16),
            _label('Дэлгүүрийн хаяг', optional: true),
            TextField(controller: _address, maxLines: 3),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!, style: TextStyle(color: Colors.red.shade700)),
            ],
            const SizedBox(height: 20),
            FilledButton(
              style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
              onPressed: verified && !_busy ? _submit : null,
              child: _busy
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text('Хүсэлт илгээх'),
            ),
          ]),
        ),
      ),
    ]);
  }
}
