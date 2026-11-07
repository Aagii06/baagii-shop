import 'package:flutter/material.dart';
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

class PhoneOtpForm extends StatefulWidget {
  final VoidCallback onDone;
  const PhoneOtpForm({super.key, required this.onDone});
  @override
  State<PhoneOtpForm> createState() => _PhoneOtpFormState();
}

class _PhoneOtpFormState extends State<PhoneOtpForm> {
  final _phone = TextEditingController();
  final _code = TextEditingController();
  bool _sent = false;
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _phone.dispose();
    _code.dispose();
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
      setState(() => _sent = true);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _verify() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    final ok = await context.read<ShopState>().verifyOtp(digitsOnly(_phone.text), _code.text.trim());
    if (!mounted) return;
    setState(() => _busy = false);
    if (ok) {
      widget.onDone();
    } else {
      setState(() => _error = 'Код буруу эсвэл хугацаа дууссан байна');
    }
  }

  @override
  Widget build(BuildContext context) => Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        const Text('Утасны дугаараараа нэвтэрнэ үү. Таны утсанд SMS код илгээнэ.'),
        const SizedBox(height: 16),
        TextField(
          controller: _phone,
          enabled: !_sent,
          keyboardType: TextInputType.phone,
          maxLength: 8,
          decoration: const InputDecoration(labelText: 'Утасны дугаар', prefixIcon: Icon(Icons.phone_outlined), counterText: ''),
        ),
        if (_sent) ...[
          const SizedBox(height: 12),
          TextField(
            controller: _code,
            autofocus: true,
            keyboardType: TextInputType.number,
            maxLength: 6,
            decoration: const InputDecoration(labelText: 'SMS код', prefixIcon: Icon(Icons.sms_outlined), counterText: ''),
            onSubmitted: (_) => _verify(),
          ),
        ],
        if (_error != null) ...[
          const SizedBox(height: 8),
          Text(_error!, style: const TextStyle(color: Colors.red)),
        ],
        const SizedBox(height: 16),
        FilledButton(
          style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
          onPressed: _busy ? null : (_sent ? _verify : _send),
          child: _busy
              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : Text(_sent ? 'Баталгаажуулах' : 'Код авах'),
        ),
        if (_sent)
          TextButton(
            onPressed: _busy ? null : () => setState(() => _sent = false),
            child: const Text('Дугаар солих / дахин илгээх'),
          ),
      ]);
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
