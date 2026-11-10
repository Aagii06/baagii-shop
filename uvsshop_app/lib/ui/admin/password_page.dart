import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../state/admin_state.dart';
import 'admin_widgets.dart';
import 'profile_edit_page.dart';

const _minPassword = 6;

/// web-ийн /profile/password: одоогийн нууц үг, шинэ нууц үг 2 удаа. "Хадгалах"
/// дарахад бүртгэлтэй имэйл рүү код ирж, кодоор баталгаажуулсны дараа солигдоно.
class PasswordPage extends StatefulWidget {
  const PasswordPage({super.key});
  @override
  State<PasswordPage> createState() => _PasswordPageState();
}

class _PasswordPageState extends State<PasswordPage> {
  final _current = TextEditingController();
  final _next = TextEditingController();
  final _confirm = TextEditingController();
  bool _submitted = false;
  bool _sending = false;
  // Сүүлд код авсан нууц үгүүд, хугацаа; өөрчлөгдөөгүй бол кодоо дахин ашиглана.
  String? _sentFor;
  DateTime? _sentAt;
  String _sentTo = '';

  @override
  void dispose() {
    _current.dispose();
    _next.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<bool> _requestCode() async {
    final admin = context.read<AdminState>();
    setState(() => _sending = true);
    var email = '';
    final ok = await runAction(context, () async => email = await admin.sendPasswordOtp(_current.text, _next.text), 'Код илгээлээ');
    if (!mounted) return false;
    setState(() {
      _sending = false;
      if (ok) {
        _sentTo = email;
        _sentFor = '${_current.text}\n${_next.text}';
        _sentAt = DateTime.now();
      }
    });
    return ok;
  }

  Future<void> _save() async {
    setState(() => _submitted = true);
    if (_current.text.isEmpty || _next.text.length < _minPassword || _confirm.text != _next.text || _sending) return;
    final reuse = _sentFor == '${_current.text}\n${_next.text}' &&
        _sentAt != null &&
        DateTime.now().difference(_sentAt!).inSeconds < 60;
    if (!reuse && !await _requestCode()) return;
    if (!mounted) return;
    final admin = context.read<AdminState>();
    final cooldown = 60 - DateTime.now().difference(_sentAt!).inSeconds;
    final changed = await showCodeSheet(
      context,
      hint: '${_sentTo.isNotEmpty ? _sentTo : (admin.user?.email ?? '')} хаягт ирсэн кодыг оруулна уу',
      initialCooldown: cooldown.clamp(0, 60),
      onResend: _requestCode,
      onConfirm: (code) => runAction(context, () => admin.changePassword(_current.text, _next.text, code), 'Нууц үг солигдлоо'),
    );
    if (changed && mounted) Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final hasEmail = context.select<AdminState, bool>((a) => (a.user?.email ?? '').isNotEmpty);
    final dirty = _current.text.isNotEmpty || _next.text.isNotEmpty || _confirm.text.isNotEmpty;
    final currentError = _submitted && _current.text.isEmpty ? 'Одоогийн нууц үгээ оруулна уу' : null;
    final newError = _submitted && _next.text.length < _minPassword ? 'Нууц үг 6-аас дээш тэмдэгттэй байна' : null;
    final confirmError = _submitted && newError == null && _confirm.text != _next.text ? 'Нууц үг таарахгүй байна' : null;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Нууц үг солих'),
        actions: [SaveAction(enabled: hasEmail && dirty, busy: _sending, onPressed: _save)],
      ),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        if (hasEmail)
          Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: Text('Солихын өмнө бүртгэлтэй имэйл рүү тань баталгаажуулах код илгээнэ.',
                style: TextStyle(color: Colors.grey.shade600)),
          )
        else
          Container(
            margin: const EdgeInsets.only(bottom: 16),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.amber.shade50,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.amber.shade200),
            ),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Нууц үг солихын тулд эхлээд профайлдаа имэйл хаягаа нэмнэ үү.',
                  style: TextStyle(color: Colors.amber.shade900, fontWeight: FontWeight.w500)),
              TextButton(
                style: TextButton.styleFrom(padding: EdgeInsets.zero),
                onPressed: () =>
                    Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const ProfileEditPage())),
                child: const Text('Имэйл нэмэх'),
              ),
            ]),
          ),
        PasswordField(
          controller: _current,
          label: 'Одоогийн нууц үг',
          error: currentError,
          enabled: hasEmail,
          onChanged: (_) => setState(() {}),
        ),
        const SizedBox(height: 14),
        PasswordField(
          controller: _next,
          label: 'Шинэ нууц үг',
          helper: '6-аас дээш тэмдэгт',
          error: newError,
          enabled: hasEmail,
          onChanged: (_) => setState(() {}),
        ),
        const SizedBox(height: 14),
        PasswordField(
          controller: _confirm,
          label: 'Шинэ нууц үг давтах',
          error: confirmError,
          enabled: hasEmail,
          onChanged: (_) => setState(() {}),
        ),
      ]),
    );
  }
}
