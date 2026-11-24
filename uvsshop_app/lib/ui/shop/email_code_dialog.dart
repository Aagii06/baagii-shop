import 'dart:async';

import 'package:flutter/material.dart';
import 'package:uvsshop_app/i18n.dart';

import '../common.dart';

/// web-ийн EmailCodeDialog: имэйлд ирсэн 6 оронтой кодыг асууна. Сүүлийн
/// оронг оруулмагц шалгаж, амжилттай бол өөрөө хаагдана — хадгалах товчгүй.
class EmailCodeDialog extends StatefulWidget {
  final String email;

  /// Дахин код авах хүртэлх секунд.
  final int resendIn;

  /// Кодыг шалгаж имэйлийг хадгална; алдааны текст, амжилттай бол null.
  final Future<String?> Function(String code) onVerify;

  /// Дахин код илгээнэ; алдааны текст, амжилттай бол null.
  final Future<String?> Function() onResend;

  const EmailCodeDialog({super.key, required this.email, required this.resendIn, required this.onVerify, required this.onResend});

  static const codeLength = 6;

  @override
  State<EmailCodeDialog> createState() => _EmailCodeDialogState();
}

class _EmailCodeDialogState extends State<EmailCodeDialog> {
  final _code = TextEditingController();
  final _focus = FocusNode();
  bool _busy = false;
  String? _error;
  late int _resendIn = widget.resendIn;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _startTimer();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _code.dispose();
    _focus.dispose();
    super.dispose();
  }

  void _startTimer() {
    _timer?.cancel();
    if (_resendIn <= 0) return;
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) return t.cancel();
      setState(() => _resendIn--);
      if (_resendIn <= 0) t.cancel();
    });
  }

  Future<void> _onChanged(String value) async {
    if (_error != null) setState(() => _error = null);
    if (value.length != EmailCodeDialog.codeLength || _busy) return;
    setState(() => _busy = true);
    final error = await widget.onVerify(value);
    if (!mounted) return;
    if (error == null) return Navigator.of(context).pop(true);
    _code.clear();
    setState(() {
      _busy = false;
      _error = error;
    });
    _focus.requestFocus();
  }

  Future<void> _resend() async {
    setState(() => _busy = true);
    final error = await widget.onResend();
    if (!mounted) return;
    setState(() {
      _busy = false;
      _error = error;
      if (error == null) _resendIn = 30;
    });
    _startTimer();
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: !_busy,
      child: Dialog(
        backgroundColor: Colors.white,
        insetPadding: const EdgeInsets.symmetric(horizontal: 24),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 12, 12, 20),
          child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            Row(children: [
              Expanded(child: Text(tr('Имэйл баталгаажуулах'), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold))),
              IconButton(
                tooltip: tr('Хаах'),
                onPressed: _busy ? null : () => Navigator.of(context).pop(false),
                icon: const Icon(Icons.close, size: 20),
              ),
            ]),
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                Text(tr('{email} хаяг руу илгээсэн 6 оронтой кодыг оруулна уу.', {'email': widget.email}),
                    style: TextStyle(fontSize: 14, color: Colors.grey.shade600)),
                const SizedBox(height: 16),
                Stack(alignment: Alignment.center, children: [
                  TextField(
                    controller: _code,
                    focusNode: _focus,
                    autofocus: true,
                    enabled: !_busy,
                    keyboardType: TextInputType.number,
                    maxLength: EmailCodeDialog.codeLength,
                    autofillHints: const [AutofillHints.oneTimeCode],
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 24, letterSpacing: 12, fontFamily: 'monospace', fontWeight: FontWeight.w600),
                    decoration: InputDecoration(
                      counterText: '',
                      hintText: '••••••',
                      errorText: _error == null ? null : '',
                      errorStyle: const TextStyle(height: 0, fontSize: 0),
                    ),
                    onChanged: (v) {
                      final digits = v.replaceAll(RegExp(r'\D'), '');
                      if (digits != v) _code.text = digits;
                      _onChanged(digits);
                    },
                  ),
                  if (_busy) const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2.5, color: brandColor)),
                ]),
                if (_error != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(_error!, style: TextStyle(fontSize: 13, color: Colors.red.shade600)),
                  ),
                const SizedBox(height: 12),
                Center(
                  child: _resendIn > 0
                      ? Text('${tr('Дахин авах')} ($_resendIn)', style: TextStyle(fontSize: 14, color: Colors.grey.shade600))
                      : TextButton(onPressed: _busy ? null : _resend, child: Text(tr('Дахин авах'))),
                ),
              ]),
            ),
          ]),
        ),
      ),
    );
  }
}
