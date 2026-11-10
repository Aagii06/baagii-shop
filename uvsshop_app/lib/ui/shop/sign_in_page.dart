import 'dart:async';

import 'package:clock/clock.dart';
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

  /// Сүүлд код илгээсэн дугаар ба цаг — кодын хуудас дахин илгээхэд шинэчилнэ.
  String? _sentTo;
  final _sentAt = ValueNotifier<DateTime?>(null);
  Timer? _timer;

  int get _remaining {
    final at = _sentAt.value;
    if (at == null) return 0;
    final left = _resendSeconds - clock.now().difference(at).inSeconds;
    return left > 0 ? left : 0;
  }

  /// Энэ дугаарт саяхан код илгээсэн бол (хүлээлт дуусаагүй).
  bool get _waiting => _sentTo != null && _sentTo == digitsOnly(_phone.text) && _remaining > 0;

  @override
  void initState() {
    super.initState();
    _sentAt.addListener(_startTimer);
  }

  void _startTimer() {
    _timer?.cancel();
    if (_remaining <= 0) return;
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) return t.cancel();
      setState(() {});
      if (_remaining <= 0) t.cancel();
    });
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    _timer?.cancel();
    _sentAt.dispose();
    _phone.dispose();
    super.dispose();
  }

  Future<void> _openCode(String phone) async {
    final ok = await Navigator.of(context).push<bool>(MaterialPageRoute(builder: (_) => OtpCodePage(phone: phone, sentAt: _sentAt)));
    if (ok == true && mounted) widget.onDone();
  }

  Future<void> _send() async {
    final phone = digitsOnly(_phone.text);
    if (phone.length != 8) {
      setState(() => _error = 'Утасны дугаар 8 оронтой байна');
      return;
    }
    // Хүлээлт дуусаагүй бол шинэ код илгээхгүй (товч идэвхгүй).
    if (_waiting) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await context.read<ShopState>().sendOtp(phone);
      if (!mounted) return;
      _sentTo = phone;
      _sentAt.value = clock.now();
      setState(() => _busy = false);
      await _openCode(phone);
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
  Widget build(BuildContext context) {
    final waiting = _waiting;
    final left = _remaining;
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      const Text('Утасны дугаараараа нэвтэрнэ үү. Таны утсанд SMS код илгээнэ.'),
      const SizedBox(height: 16),
      TextField(
        controller: _phone,
        keyboardType: TextInputType.phone,
        maxLength: 8,
        onChanged: (_) => setState(() {}),
        onSubmitted: (_) => _send(),
        decoration: const InputDecoration(labelText: 'Утасны дугаар', prefixIcon: Icon(Icons.phone_outlined), counterText: ''),
      ),
      // Кодын хуудаснаас буцахад: дахин код авах хүртэлх хугацаа.
      if (waiting)
        Padding(
          padding: const EdgeInsets.only(top: 8, left: 4),
          child: Row(children: [
            Icon(Icons.timer_outlined, size: 16, color: Colors.grey.shade600),
            const SizedBox(width: 6),
            Text('Код дахин авах боломжтой: ', style: TextStyle(fontSize: 13, color: Colors.grey.shade600)),
            Text(formatCountdown(left), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, fontFamily: 'monospace', color: brandColor)),
          ]),
        ),
      if (_error != null) ...[
        const SizedBox(height: 8),
        Text(_error!, style: const TextStyle(color: Colors.red)),
      ],
      const SizedBox(height: 16),
      FilledButton(
        style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
        // Таймер гүйж байхад идэвхгүй.
        onPressed: _busy || waiting ? null : _send,
        child: _busy
            ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
            : const Text('Код авах'),
      ),
    ]);
  }
}

/// 59 → "0:59".
String formatCountdown(int seconds) => '${seconds ~/ 60}:${(seconds % 60).toString().padLeft(2, '0')}';

/// Нэвтрэх кодын урт (backend PHONE_OTP_LENGTH).
const otpLength = 4;
/// Код дахин авах хүртэл хүлээх хугацаа.
const _resendSeconds = 60;

/// SMS-ээр ирсэн 4 оронтой кодыг оруулах тусдаа хуудас. Амжилттай бол `true` буцаана.
class OtpCodePage extends StatefulWidget {
  final String phone;

  /// Код илгээсэн цаг — дугаар оруулах хуудастай хуваалцана (буцахад таймер үргэлжилнэ).
  final ValueNotifier<DateTime?>? sentAt;
  const OtpCodePage({super.key, required this.phone, this.sentAt});
  @override
  State<OtpCodePage> createState() => _OtpCodePageState();
}

class _OtpCodePageState extends State<OtpCodePage> {
  final _code = TextEditingController();
  final _focus = FocusNode();
  bool _busy = false;
  bool _sending = false;
  String? _error;
  late int _cooldown = _left();
  Timer? _timer;

  late final DateTime _openedAt = clock.now();
  DateTime? _resentAt;

  int _left() {
    final at = widget.sentAt?.value ?? _resentAt ?? _openedAt;
    final left = _resendSeconds - clock.now().difference(at).inSeconds;
    return left > 0 ? left : 0;
  }

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
      setState(() => _cooldown = _left());
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
    if (ok) {
      final nav = Navigator.of(context);
      await nav.push(MaterialPageRoute(builder: (_) => const OtpSuccessPage()));
      return nav.pop(true);
    }
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
      widget.sentAt?.value = _resentAt = clock.now();
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
    final grey = TextStyle(fontSize: 15, color: Colors.grey.shade600, height: 1.4);
    return Scaffold(
      backgroundColor: Colors.white,
      // Зөвхөн буцах товч — гарчиг нь доор том үсгээр.
      appBar: AppBar(backgroundColor: Colors.white, surfaceTintColor: Colors.white),
      body: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            const Text('Код баталгаажуулах', style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold)),
            const SizedBox(height: 10),
            Text.rich(
              TextSpan(children: [
                const TextSpan(text: 'Таны '),
                TextSpan(text: _phoneLabel, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.black87)),
                const TextSpan(text: ' дугаарт илгээсэн $otpLength оронтой кодыг оруулна уу'),
              ]),
              style: grey,
            ),
            const SizedBox(height: 32),
            // Нэг нуугдмал талбар + 4 харагдах нүд (SMS-ээс автоматаар бөглөгдөнө).
            GestureDetector(
              onTap: () => _focus.requestFocus(),
              child: Stack(children: [
                Positioned.fill(
                  child: Opacity(
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
                ),
                ListenableBuilder(
                  listenable: _focus,
                  builder: (context, _) => Row(children: [
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
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!, style: const TextStyle(color: Colors.red)),
            ],
            const SizedBox(height: 20),
            Row(children: [
              Text('Код ирээгүй юу? ', style: grey.copyWith(fontSize: 14)),
              GestureDetector(
                onTap: _sending || _cooldown > 0 ? null : _resend,
                child: Text(
                  _cooldown > 0 ? 'Дахин илгээх (${formatCountdown(_cooldown)})' : 'Дахин илгээх',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: _cooldown > 0 || _sending ? Colors.grey : brandColor,
                  ),
                ),
              ),
            ]),
            const SizedBox(height: 28),
            FilledButton(
              style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(52), shape: const StadiumBorder()),
              onPressed: code.length == otpLength && !_busy ? _verify : null,
              child: _busy
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text('Баталгаажуулах', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
            ),
            const SizedBox(height: 8),
            Center(
              child: TextButton(onPressed: () => Navigator.of(context).pop(false), child: const Text('Дугаар солих')),
            ),
          ]),
        ),
      ),
    );
  }
}

/// Амжилттай баталгаажсаны дараах дэлгэц (загварын "Verification Success").
class OtpSuccessPage extends StatelessWidget {
  const OtpSuccessPage({super.key});

  @override
  Widget build(BuildContext context) => Scaffold(
        body: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [accentColor, Colors.white]),
          ),
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                Container(
                  width: 96,
                  height: 96,
                  decoration: BoxDecoration(shape: BoxShape.circle, color: brandColor.withValues(alpha: 0.12)),
                  alignment: Alignment.center,
                  child: Container(
                    width: 64,
                    height: 64,
                    decoration: const BoxDecoration(shape: BoxShape.circle, gradient: brandGradient),
                    child: const Icon(Icons.check_rounded, color: Colors.white, size: 36),
                  ),
                ),
                const SizedBox(height: 24),
                const Text('Амжилттай баталгаажлаа', textAlign: TextAlign.center, style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Text('UVS SHOP-д тавтай морил! Та нэвтэрлээ.',
                    textAlign: TextAlign.center, style: TextStyle(fontSize: 15, color: Colors.grey.shade600)),
                const SizedBox(height: 32),
                FilledButton(
                  style: FilledButton.styleFrom(minimumSize: const Size(220, 52), shape: const StadiumBorder()),
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('Үргэлжлүүлэх', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                ),
              ]),
            ),
          ),
        ),
      );
}

class _CodeBox extends StatelessWidget {
  final String digit;
  final bool active;
  final bool error;
  const _CodeBox({required this.digit, required this.active, required this.error});

  @override
  Widget build(BuildContext context) => AnimatedContainer(
        duration: const Duration(milliseconds: 120),
        width: 60,
        height: 60,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: mutedColor,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: error ? Colors.red : (active ? brandColor : Colors.transparent),
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
