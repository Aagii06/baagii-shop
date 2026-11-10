import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../state/admin_state.dart';
import '../../state/app_state.dart';
import '../../state/shop_state.dart';
import '../common.dart';

/// Нэг нэвтрэх хуудас: худалдан авагч утасны кодоор, админ/худалдагч
/// нууц үгээр. Админ нэвтэрмэгц шууд админ хэсэг рүү орно.
class SignInPage extends StatelessWidget {
  final int initialTab;
  const SignInPage({super.key, this.initialTab = 0});

  @override
  Widget build(BuildContext context) => DefaultTabController(
        length: 2,
        initialIndex: initialTab,
        child: Scaffold(
          appBar: AppBar(
            title: const Text('Нэвтрэх'),
            bottom: const TabBar(tabs: [Tab(text: 'Худалдан авагч'), Tab(text: 'Админ / Худалдагч')]),
          ),
          body: TabBarView(children: [
            ListView(padding: const EdgeInsets.all(20), children: [
              PhoneOtpForm(onDone: () => Navigator.of(context).pop(true)),
            ]),
            ListView(padding: const EdgeInsets.all(20), children: const [AdminLoginForm()]),
          ]),
        ),
      );
}

/// Утасны дугаар оруулж "Код авах" дарахад кодын тусдаа хуудас ([OtpCodePage]) нээгдэнэ.
class PhoneOtpForm extends StatefulWidget {
  final VoidCallback onDone;
  const PhoneOtpForm({super.key, required this.onDone});
  @override
  State<PhoneOtpForm> createState() => _PhoneOtpFormState();
}

class _PhoneOtpFormState extends State<PhoneOtpForm> {
  final _phone = TextEditingController();
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _phone.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final phone = digitsOnly(_phone.text);
    if (phone.length != 8) {
      setState(() => _error = 'Утасны дугаар 8 оронтой байна');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await context.read<ShopState>().sendOtp(phone);
      if (!mounted) return;
      setState(() => _busy = false);
      final ok = await Navigator.of(context).push<bool>(MaterialPageRoute(builder: (_) => OtpCodePage(phone: phone)));
      if (ok == true && mounted) widget.onDone();
    } catch (e) {
      if (mounted) {
        setState(() {
          _busy = false;
          _error = e.toString();
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) => Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        const Text('Утасны дугаараараа нэвтэрнэ үү. Таны утсанд SMS код илгээнэ.'),
        const SizedBox(height: 16),
        TextField(
          controller: _phone,
          keyboardType: TextInputType.phone,
          maxLength: 8,
          onSubmitted: (_) => _send(),
          decoration: const InputDecoration(labelText: 'Утасны дугаар', prefixIcon: Icon(Icons.phone_outlined), counterText: ''),
        ),
        if (_error != null) ...[
          const SizedBox(height: 8),
          Text(_error!, style: const TextStyle(color: Colors.red)),
        ],
        const SizedBox(height: 16),
        FilledButton(
          style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
          onPressed: _busy ? null : _send,
          child: _busy
              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : const Text('Код авах'),
        ),
      ]);
}

/// Нэвтрэх кодын урт (backend PHONE_OTP_LENGTH).
const otpLength = 4;
const _resendSeconds = 30;

/// SMS-ээр ирсэн 4 оронтой кодыг оруулах тусдаа хуудас. Амжилттай бол `true` буцаана.
class OtpCodePage extends StatefulWidget {
  final String phone;
  const OtpCodePage({super.key, required this.phone});
  @override
  State<OtpCodePage> createState() => _OtpCodePageState();
}

class _OtpCodePageState extends State<OtpCodePage> {
  final _code = TextEditingController();
  final _focus = FocusNode();
  bool _busy = false;
  bool _sending = false;
  String? _error;
  int _cooldown = _resendSeconds;
  Timer? _timer;

  String get _phoneLabel => '${widget.phone.substring(0, 4)} ${widget.phone.substring(4)}';

  @override
  void initState() {
    super.initState();
    _tick();
  }

  void _tick() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted || _cooldown <= 0) return t.cancel();
      setState(() => _cooldown--);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _code.dispose();
    _focus.dispose();
    super.dispose();
  }

  Future<void> _verify() async {
    if (_code.text.length < otpLength || _busy) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    final ok = await context.read<ShopState>().verifyOtp(widget.phone, _code.text);
    if (!mounted) return;
    if (ok) return Navigator.of(context).pop(true);
    setState(() {
      _busy = false;
      _error = 'Код буруу эсвэл хугацаа дууссан байна';
      _code.clear();
    });
    _focus.requestFocus();
  }

  Future<void> _resend() async {
    setState(() {
      _sending = true;
      _error = null;
    });
    try {
      await context.read<ShopState>().sendOtp(widget.phone);
      if (!mounted) return;
      showMessage(context, 'Код дахин илгээлээ');
      setState(() {
        _cooldown = _resendSeconds;
        _code.clear();
      });
      _tick();
      _focus.requestFocus();
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final code = _code.text;
    return Scaffold(
      appBar: AppBar(title: const Text('Баталгаажуулах код')),
      body: ListView(padding: const EdgeInsets.fromLTRB(24, 32, 24, 24), children: [
        const Center(
          child: CircleAvatar(radius: 28, backgroundColor: accentColor, child: Icon(Icons.sms_outlined, color: brandColor)),
        ),
        const SizedBox(height: 16),
        const Text('Кодоо оруулна уу', textAlign: TextAlign.center, style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
        const SizedBox(height: 6),
        Text('$_phoneLabel дугаарт ирсэн $otpLength оронтой кодыг оруулна уу',
            textAlign: TextAlign.center, style: TextStyle(color: Colors.grey.shade600)),
        const SizedBox(height: 28),
        // Нэг нуугдмал талбар + 4 харагдах нүд (SMS-ээс автоматаар бөглөгдөнө).
        GestureDetector(
          onTap: () => _focus.requestFocus(),
          child: Stack(alignment: Alignment.center, children: [
            Opacity(
              opacity: 0,
              child: TextField(
                controller: _code,
                focusNode: _focus,
                autofocus: true,
                keyboardType: TextInputType.number,
                maxLength: otpLength,
                autofillHints: const [AutofillHints.oneTimeCode],
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                showCursor: false,
                enableInteractiveSelection: false,
                decoration: const InputDecoration(counterText: '', border: InputBorder.none),
                onChanged: (v) {
                  setState(() => _error = null);
                  // Сүүлийн цифрийг оруулахад шууд шалгана.
                  if (v.length == otpLength) _verify();
                },
              ),
            ),
            ListenableBuilder(
              listenable: _focus,
              builder: (context, _) => Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                for (var i = 0; i < otpLength; i++) ...[
                  if (i > 0) const SizedBox(width: 12),
                  _CodeBox(
                    digit: i < code.length ? code[i] : '',
                    active: _focus.hasFocus && (i == code.length || (i == otpLength - 1 && code.length == otpLength)),
                    error: _error != null,
                  ),
                ],
              ]),
            ),
          ]),
        ),
        const SizedBox(height: 16),
        if (_busy)
          const Center(child: SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.5)))
        else if (_error != null)
          Text(_error!, textAlign: TextAlign.center, style: const TextStyle(color: Colors.red)),
        const SizedBox(height: 16),
        Center(
          child: TextButton(
            onPressed: _sending || _cooldown > 0 ? null : _resend,
            child: Text(_cooldown > 0 ? 'Код дахин авах ($_cooldown)' : 'Код дахин авах'),
          ),
        ),
        Center(
          child: TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Дугаар солих'),
          ),
        ),
      ]),
    );
  }
}

class _CodeBox extends StatelessWidget {
  final String digit;
  final bool active;
  final bool error;
  const _CodeBox({required this.digit, required this.active, required this.error});

  @override
  Widget build(BuildContext context) => AnimatedContainer(
        duration: const Duration(milliseconds: 120),
        width: 56,
        height: 64,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: error ? Colors.red : (active ? brandColor : borderColor),
            width: active || error ? 2 : 1.5,
          ),
        ),
        child: Text(digit, style: const TextStyle(fontSize: 26, fontWeight: FontWeight.bold)),
      );
}

class AdminLoginForm extends StatefulWidget {
  const AdminLoginForm({super.key});
  @override
  State<AdminLoginForm> createState() => _AdminLoginFormState();
}

class _AdminLoginFormState extends State<AdminLoginForm> {
  final _phone = TextEditingController();
  final _password = TextEditingController();
  bool _busy = false;
  bool _obscure = true;
  String? _error;

  @override
  void dispose() {
    _phone.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    final phone = digitsOnly(_phone.text);
    if (phone.length != 8 || _password.text.isEmpty) {
      setState(() => _error = 'Утасны дугаар (8 орон) болон нууц үгээ оруулна уу');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await context.read<AdminState>().login(phone, _password.text);
      if (!mounted) return;
      // Админыг таньж шууд админ хэсэг рүү оруулна.
      Navigator.of(context).popUntil((r) => r.isFirst);
      context.read<AppState>().openAdmin();
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        const Text('Админ болон худалдагч утасны дугаар, нууц үгээрээ нэвтэрнэ.'),
        const SizedBox(height: 16),
        TextField(
          controller: _phone,
          keyboardType: TextInputType.phone,
          maxLength: 8,
          decoration: const InputDecoration(labelText: 'Утасны дугаар', prefixIcon: Icon(Icons.phone_outlined), counterText: ''),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _password,
          obscureText: _obscure,
          onSubmitted: (_) => _login(),
          decoration: InputDecoration(
            labelText: 'Нууц үг',
            prefixIcon: const Icon(Icons.lock_outline),
            suffixIcon: IconButton(
              icon: Icon(_obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined),
              onPressed: () => setState(() => _obscure = !_obscure),
            ),
          ),
        ),
        if (_error != null) ...[
          const SizedBox(height: 8),
          Text(_error!, style: const TextStyle(color: Colors.red)),
        ],
        const SizedBox(height: 16),
        FilledButton(
          style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
          onPressed: _busy ? null : _login,
          child: _busy
              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : const Text('Нэвтрэх'),
        ),
      ]);
}
