import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../state/admin_state.dart';
import '../common.dart';
import 'admin_widgets.dart';

/// web-ийн /profile/edit: лого, нэр, утас (шинэ дугаарт SMS код), имэйл (шинэ хаягт имэйл код).
class ProfileEditPage extends StatefulWidget {
  const ProfileEditPage({super.key});
  @override
  State<ProfileEditPage> createState() => _ProfileEditPageState();
}

class _ProfileEditPageState extends State<ProfileEditPage> {
  late final AdminState _admin = context.read<AdminState>();
  late final String _currentPhone = _admin.user?.phone ?? _admin.user?.userName ?? '';
  late final _name = TextEditingController(text: _admin.user?.name ?? '');
  late final _phone = TextEditingController(text: _currentPhone);
  late final _email = TextEditingController(text: _admin.user?.email ?? '');
  final _code = TextEditingController();

  late String? _logo = _admin.user?.logo;
  PickedImage? _logoFile;
  String? _codeSentTo;
  int _phoneCooldown = 0;
  int _emailCooldown = 0;
  Timer? _timer;
  bool _sending = false;
  bool _saving = false;
  bool _submitted = false;

  String get _currentEmail => _admin.user?.email ?? '';
  bool get _phoneChanged => _phone.text != _currentPhone;
  bool get _codeSent => _phoneChanged && _codeSentTo == _phone.text;
  bool get _emailChanged => _email.text.trim().isNotEmpty && _email.text.trim().toLowerCase() != _currentEmail.toLowerCase();

  bool get _dirty =>
      _name.text != (_admin.user?.name ?? '') ||
      _phoneChanged ||
      _logo != _admin.user?.logo ||
      _logoFile != null ||
      (_email.text.trim().toLowerCase() != _currentEmail.toLowerCase());

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (_phoneCooldown > 0 || _emailCooldown > 0) {
        setState(() {
          if (_phoneCooldown > 0) _phoneCooldown--;
          if (_emailCooldown > 0) _emailCooldown--;
        });
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _name.dispose();
    _phone.dispose();
    _email.dispose();
    _code.dispose();
    super.dispose();
  }

  Future<void> _pickLogo() async {
    final img = await pickImage(context);
    if (img != null) setState(() => _logoFile = img);
  }

  Future<void> _sendPhoneCode() async {
    if (_phone.text.length < 8) return setState(() => _submitted = true);
    setState(() => _sending = true);
    final ok = await runAction(context, () => _admin.sendPhoneOtp(_phone.text), 'Код илгээлээ');
    if (!mounted) return;
    setState(() {
      _sending = false;
      if (ok) {
        _phoneCooldown = 60;
        _codeSentTo = _phone.text;
        _code.clear();
      }
    });
  }

  Future<void> _sendEmailCode() async {
    final email = _email.text.trim();
    if (!emailRe.hasMatch(email)) return setState(() => _submitted = true);
    setState(() => _sending = true);
    final ok = await runAction(context, () => _admin.sendEmailOtp(email), 'Код илгээлээ');
    if (!mounted) return;
    setState(() {
      _sending = false;
      if (ok) _emailCooldown = 60;
    });
    if (!ok) return;
    await showCodeSheet(
      context,
      hint: '$email хаягт ирсэн кодыг оруулна уу',
      onResend: () => runAction(context, () => _admin.sendEmailOtp(email), 'Код илгээлээ'),
      onConfirm: (code) async {
        final changed = await runAction(context, () => _admin.changeEmail(email, code), 'Имэйл солигдлоо');
        if (changed && mounted) setState(() => _email.text = _admin.user?.email ?? '');
        return changed;
      },
    );
  }

  Future<void> _save() async {
    setState(() => _submitted = true);
    final email = _email.text.trim();
    if (_name.text.trim().isEmpty || _phone.text.length < 8) return;
    if (_phoneChanged && (!_codeSent || _code.text.trim().isEmpty)) return;
    if (email.isNotEmpty && !emailRe.hasMatch(email)) return;
    if (_emailChanged) return;

    setState(() => _saving = true);
    final saved = await runAction(context, () async {
      final logo = _logoFile != null ? await _admin.uploadImage(_logoFile!.bytes, _logoFile!.name, 'users') : _logo;
      await _admin.updateMe(
        name: _name.text.trim(),
        phone: _phone.text,
        email: email.isNotEmpty ? _currentEmail : '',
        logo: logo,
        code: _phoneChanged ? _code.text.trim() : null,
      );
    }, 'Хадгаллаа');
    if (!mounted) return;
    if (saved) {
      Navigator.pop(context);
    } else {
      setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final nameError = _submitted && _name.text.trim().isEmpty ? 'Нэр оруулна уу' : null;
    final phoneError = _submitted && _phone.text.length < 8 ? 'Утасны дугаар 8 оронтой байна' : null;
    final codeError = !_submitted || !_phoneChanged || _phone.text.length < 8
        ? null
        : !_codeSent
            ? 'Шинэ дугаараа кодоор баталгаажуулна уу'
            : _code.text.trim().isEmpty
                ? 'Код оруулна уу'
                : null;
    final email = _email.text.trim();
    final emailError = !_submitted
        ? null
        : email.isNotEmpty && !emailRe.hasMatch(email)
            ? 'Имэйл буруу байна'
            : _emailChanged
                ? 'Шинэ имэйлээ кодоор баталгаажуулна уу'
                : null;
    final hasLogo = _logoFile != null || _logo != null;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Мэдээлэл засах'),
        actions: [SaveAction(enabled: _dirty, busy: _saving, onPressed: _save)],
      ),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        Center(
          child: Stack(clipBehavior: Clip.none, children: [
            GestureDetector(
              onTap: _pickLogo,
              child: ImageBox(fileId: _logo, bytes: _logoFile?.bytes, size: 96, circle: true, placeholder: Icons.person),
            ),
            Positioned(
              right: 0,
              bottom: 0,
              child: GestureDetector(
                onTap: _pickLogo,
                child: Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(color: brandColor, shape: BoxShape.circle, border: Border.all(color: Colors.white, width: 2)),
                  child: const Icon(Icons.photo_camera_outlined, size: 16, color: Colors.white),
                ),
              ),
            ),
            if (hasLogo)
              Positioned(
                right: -4,
                top: -4,
                child: Material(
                  color: Colors.white,
                  shape: const CircleBorder(),
                  elevation: 1,
                  child: InkWell(
                    customBorder: const CircleBorder(),
                    onTap: () => setState(() {
                      _logo = null;
                      _logoFile = null;
                    }),
                    child: const SizedBox(width: 28, height: 28, child: Icon(Icons.close, size: 16)),
                  ),
                ),
              ),
          ]),
        ),
        const SizedBox(height: 20),
        TextField(
          controller: _name,
          onChanged: (_) => setState(() {}),
          decoration: fieldDecoration('Нэр', error: nameError),
        ),
        const SizedBox(height: 14),
        TextField(
          controller: _phone,
          keyboardType: TextInputType.phone,
          maxLength: 8,
          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          onChanged: (_) => setState(() => _phoneCooldown = 0),
          style: const TextStyle(fontFamily: 'monospace'),
          decoration: fieldDecoration(
            'Утасны дугаар',
            error: phoneError ?? (_codeSent ? null : codeError),
            helper: _phoneChanged && !_codeSent ? 'Шинэ дугаараа баталгаажуулахын тулд код авна уу' : null,
            suffix: _phoneChanged
                ? Padding(
                    padding: const EdgeInsets.only(right: 6),
                    child: TextButton(
                      onPressed: _sending || _phone.text.length != 8 || _phoneCooldown > 0 ? null : _sendPhoneCode,
                      child: Text('${_codeSent ? 'Дахин авах' : 'Код авах'}${_phoneCooldown > 0 ? ' ($_phoneCooldown)' : ''}'),
                    ),
                  )
                : null,
          ).copyWith(counterText: ''),
        ),
        if (_codeSent) ...[
          const SizedBox(height: 14),
          TextField(
            controller: _code,
            keyboardType: TextInputType.number,
            maxLength: 6,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            autofillHints: const [AutofillHints.oneTimeCode],
            onChanged: (_) => setState(() {}),
            style: const TextStyle(fontFamily: 'monospace', letterSpacing: 6),
            decoration: fieldDecoration('Баталгаажуулах код',
                    error: codeError, helper: '${_phone.text} дугаарт ирсэн кодыг оруулна уу')
                .copyWith(counterText: ''),
          ),
        ],
        const SizedBox(height: 14),
        TextField(
          controller: _email,
          keyboardType: TextInputType.emailAddress,
          autocorrect: false,
          onChanged: (_) => setState(() => _emailCooldown = 0),
          decoration: fieldDecoration(
            'Имэйл',
            error: emailError,
            helper: _emailChanged ? 'Шинэ имэйлээ баталгаажуулахын тулд код авна уу' : null,
            suffix: _emailChanged
                ? Padding(
                    padding: const EdgeInsets.only(right: 6),
                    child: TextButton(
                      onPressed: _sending || !emailRe.hasMatch(email) || _emailCooldown > 0 ? null : _sendEmailCode,
                      child: Text('Код авах${_emailCooldown > 0 ? ' ($_emailCooldown)' : ''}'),
                    ),
                  )
                : null,
          ),
        ),
      ]),
    );
  }
}
