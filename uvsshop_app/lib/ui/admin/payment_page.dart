import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../api/admin_manage_models.dart';
import '../../state/admin_state.dart';
import '../common.dart';
import 'admin_widgets.dart';

/// web-ийн /payment: хүргэлтийн төлбөр, дансаар шилжүүлэх, QPay.
/// QPay асаалттай хадгалахад backend эхлээд QPay-д нэвтэрч шалгана.
class PaymentPage extends StatefulWidget {
  const PaymentPage({super.key});
  @override
  State<PaymentPage> createState() => _PaymentPageState();
}

class _PaymentPageState extends State<PaymentPage> {
  PaymentSettings? _s;
  Object? _error;
  bool _saving = false;
  bool _submitted = false;
  String _baseline = '';

  final _fee = TextEditingController();
  final _bankName = TextEditingController();
  final _accountName = TextEditingController();
  final _accountNumber = TextEditingController();
  final _iban = TextEditingController();
  final _qpayUser = TextEditingController();
  final _qpayPassword = TextEditingController();
  final _qpayInvoice = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    for (final c in [_fee, _bankName, _accountName, _accountNumber, _iban, _qpayUser, _qpayPassword, _qpayInvoice]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final s = await context.read<AdminState>().paymentSettings();
      if (!mounted) return;
      _fill(s);
    } catch (e) {
      if (mounted) setState(() => _error = e);
    }
  }

  void _fill(PaymentSettings s) {
    _fee.text = '${s.deliveryFee}';
    _bankName.text = s.bankName;
    _accountName.text = s.accountName;
    _accountNumber.text = s.accountNumber;
    _iban.text = s.iban;
    _qpayUser.text = s.qpayUsername;
    _qpayPassword.clear();
    _qpayInvoice.text = s.qpayInvoiceCode;
    setState(() {
      _s = s;
      _error = null;
      _baseline = _snapshot();
    });
  }

  /// Маягтын одоогийн утгууд — өөрчлөгдсөн эсэхийг харьцуулахад.
  String _snapshot() {
    final s = _s;
    if (s == null) return '';
    return jsonEncode([
      s.deliveryEnabled, _fee.text, s.bankEnabled, _bankName.text, _accountName.text, _accountNumber.text, _iban.text, //
      s.qpayEnabled, s.qpaySandbox, _qpayUser.text, _qpayPassword.text, _qpayInvoice.text,
    ]);
  }

  bool _blank(bool on, TextEditingController c) => on && c.text.trim().isEmpty;

  Future<void> _save() async {
    final s = _s!;
    setState(() => _submitted = true);
    if ([_bankName, _accountName, _accountNumber].any((c) => _blank(s.bankEnabled, c))) return;
    if ([_qpayUser, _qpayInvoice].any((c) => _blank(s.qpayEnabled, c))) return;
    if (!s.qpayHasPassword && _blank(s.qpayEnabled, _qpayPassword)) return;
    if (_blank(s.deliveryEnabled, _fee)) return;
    final admin = context.read<AdminState>();
    setState(() => _saving = true);
    await runAction(context, () async {
      final saved = await admin.savePaymentSettings({
        'delivery': {'enabled': s.deliveryEnabled, 'fee': int.tryParse(_fee.text) ?? 0},
        'bank': {
          'enabled': s.bankEnabled,
          'bankName': _bankName.text,
          'accountName': _accountName.text,
          'accountNumber': _accountNumber.text,
          'iban': _iban.text,
        },
        'qpay': {
          'enabled': s.qpayEnabled,
          'sandbox': s.qpaySandbox,
          'username': _qpayUser.text,
          'password': _qpayPassword.text,
          'invoiceCode': _qpayInvoice.text,
        },
      });
      if (mounted) {
        _submitted = false;
        _fill(saved);
      }
    }, 'Хадгаллаа');
    if (mounted) setState(() => _saving = false);
  }

  String? _req(bool on, TextEditingController c) => _submitted && _blank(on, c) ? 'Заавал оруулна' : null;

  Widget _field(TextEditingController c, String label, {String? error, bool mono = false, String? helper, bool obscure = false, String? hint}) =>
      Padding(
        padding: const EdgeInsets.only(top: 12),
        child: TextField(
          controller: c,
          obscureText: obscure,
          autocorrect: false,
          onChanged: (_) => setState(() {}),
          style: mono ? const TextStyle(fontFamily: 'monospace') : null,
          decoration: fieldDecoration(label, error: error, helper: helper, hint: hint),
        ),
      );

  Widget _toggle(String title, String desc, bool value, ValueChanged<bool> onChanged) => SwitchListTile(
        contentPadding: EdgeInsets.zero,
        title: Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
        subtitle: Text(desc, style: TextStyle(fontSize: 13, color: Colors.grey.shade600)),
        value: value,
        onChanged: (v) => setState(() => onChanged(v)),
      );

  @override
  Widget build(BuildContext context) {
    final s = _s;
    final dirty = s != null && _snapshot() != _baseline;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Төлбөрийн тохиргоо'),
        actions: [if (s != null) SaveAction(enabled: dirty, busy: _saving, onPressed: _save)],
      ),
      body: s == null
          ? (_error != null ? ErrorView(_error!, onRetry: _load) : const LoadingView(kind: SkeletonKind.detail))
          : ListView(padding: const EdgeInsets.all(12), children: [
              Panel(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
                child: Column(children: [
                  _toggle('Хүргэлтийн төлбөр', 'Admin-аас захиалга нэмэхэд хүргэлтийн үнэ нэмнэ. Унтраавал хүргэлт үнэгүй',
                      s.deliveryEnabled, (v) => s.deliveryEnabled = v),
                  if (s.deliveryEnabled)
                    Padding(
                      padding: const EdgeInsets.only(top: 12),
                      child: TextField(
                        controller: _fee,
                        keyboardType: TextInputType.number,
                        inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                        style: const TextStyle(fontFamily: 'monospace'),
                        onChanged: (_) => setState(() {}),
                        decoration: fieldDecoration('Хүргэлтийн төлбөр', error: _req(true, _fee)),
                      ),
                    ),
                ]),
              ),
              const SizedBox(height: 12),
              Panel(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
                child: Column(children: [
                  _toggle(
                      'Дансаар шилжүүлэх',
                      'Худалдан авагчид дансаа харуулна. Мөнгө орсныг шалгаад захиалгыг баталгаажуулахад төлөгдсөн болно',
                      s.bankEnabled,
                      (v) => s.bankEnabled = v),
                  if (s.bankEnabled) ...[
                    _field(_bankName, 'Банк', error: _req(true, _bankName)),
                    _field(_accountName, 'Хүлээн авагч', error: _req(true, _accountName)),
                    _field(_accountNumber, 'Дансны дугаар', error: _req(true, _accountNumber), mono: true),
                    _field(_iban, 'IBAN дугаар', mono: true),
                  ],
                ]),
              ),
              const SizedBox(height: 12),
              Panel(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
                child: Column(children: [
                  _toggle('QPay', 'QR уншуулж эсвэл банкны аппаар төлнө. Төлөгдсөн захиалга автоматаар тэмдэглэгдэнэ',
                      s.qpayEnabled, (v) => s.qpayEnabled = v),
                  if (s.qpayEnabled) ...[
                    _field(_qpayUser, 'Нэвтрэх нэр (client_id)', error: _req(true, _qpayUser), mono: true),
                    _field(
                      _qpayPassword,
                      'Нууц үг (client_secret)',
                      obscure: true,
                      hint: s.qpayHasPassword ? '••••••••' : null,
                      helper: s.qpayHasPassword ? 'Хоосон үлдээвэл хадгалсан нууц үг хэвээр' : null,
                      error: s.qpayHasPassword ? null : _req(true, _qpayPassword),
                    ),
                    _field(_qpayInvoice, 'Нэхэмжлэхийн код (invoice_code)', error: _req(true, _qpayInvoice), mono: true),
                    const SizedBox(height: 4),
                    _toggle('Туршилтын орчин (sandbox)', 'Жинхэнэ гүйлгээ хийхгүй. Бодит төлбөр авахад унтраана', s.qpaySandbox,
                        (v) => s.qpaySandbox = v),
                  ],
                ]),
              ),
            ]),
    );
  }
}
