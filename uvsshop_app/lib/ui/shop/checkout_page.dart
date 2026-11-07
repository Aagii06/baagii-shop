import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../api/shop_models.dart';
import '../../state/shop_state.dart';
import '../common.dart';
import 'pay_page.dart';
import 'sign_in_page.dart';

/// Шинэ хаягт урьдчилан сонгох аймгийн ҮСХ-ны код (85 — Увс).
const _defaultCityCode = '85';

class CheckoutPage extends StatefulWidget {
  const CheckoutPage({super.key});
  @override
  State<CheckoutPage> createState() => _CheckoutPageState();
}

class _CheckoutPageState extends State<CheckoutPage> {
  final _form = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _phone = TextEditingController();
  final _extraPhone = TextEditingController();
  final _address = TextEditingController();
  final _note = TextEditingController();
  final _coupon = TextEditingController();

  List<AddressArea> _cities = [], _districts = [], _subs = [];
  AddressArea? _city, _district, _sub;
  bool _placing = false;
  bool _prefilled = false;

  @override
  void initState() {
    super.initState();
    _loadCities();
  }

  @override
  void dispose() {
    for (final c in [_name, _phone, _extraPhone, _address, _note, _coupon]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _loadCities() async {
    try {
      final cities = await context.read<ShopState>().cities();
      if (!mounted) return;
      setState(() => _cities = cities);
      final def = cities.where((c) => c.code == _defaultCityCode).firstOrNull;
      if (def != null) _pickCity(def);
    } catch (_) {}
  }

  Future<void> _pickCity(AddressArea? c) async {
    setState(() {
      _city = c;
      _district = null;
      _sub = null;
      _districts = [];
      _subs = [];
    });
    if (c == null) return;
    try {
      final d = await context.read<ShopState>().districts(c.id);
      if (mounted && _city?.id == c.id) setState(() => _districts = d);
    } catch (_) {}
  }

  Future<void> _pickDistrict(AddressArea? d) async {
    setState(() {
      _district = d;
      _sub = null;
      _subs = [];
    });
    if (d == null) return;
    try {
      final s = await context.read<ShopState>().subDistricts(d.id);
      if (mounted && _district?.id == d.id) setState(() => _subs = s);
    } catch (_) {}
  }

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    setState(() => _placing = true);
    final parts = [_city?.name, _district?.name, _sub?.name, _address.text.trim()].whereType<String>().where((s) => s.isNotEmpty);
    try {
      final order = await context.read<ShopState>().placeOrder({
        'addressLabel': 'Хаяг',
        'address': parts.join(', '),
        if (_city != null) 'cityId': _city!.id,
        if (_district != null) 'districtId': _district!.id,
        if (_sub != null) 'subDistrictId': _sub!.id,
        'fullName': _name.text.trim(),
        'phone': digitsOnly(_phone.text),
        if (_extraPhone.text.trim().isNotEmpty) 'extraPhone': digitsOnly(_extraPhone.text),
        if (_note.text.trim().isNotEmpty) 'note': _note.text.trim(),
        'deliveryMethod': 'standard',
        'deliveryFee': 0,
      }, couponCode: _coupon.text.trim());
      if (!mounted) return;
      Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => PayPage(orderId: order.id)));
    } catch (e) {
      if (mounted) showMessage(context, e.toString(), error: true);
    } finally {
      if (mounted) setState(() => _placing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final shop = context.watch<ShopState>();
    if (!shop.signedIn) {
      return Scaffold(
        appBar: AppBar(title: const Text('Захиалга')),
        body: ListView(padding: const EdgeInsets.all(20), children: [
          const Text('Захиалга өгөхийн тулд утасны дугаараа баталгаажуулна уу.',
              style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
          const SizedBox(height: 16),
          PhoneOtpForm(onDone: () {}),
        ]),
      );
    }
    if (!_prefilled) {
      _prefilled = true;
      _phone.text = shop.customer!.phone;
      _name.text = shop.customer!.name ?? '';
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Хүргэлтийн мэдээлэл')),
      body: Form(
        key: _form,
        child: ListView(padding: const EdgeInsets.all(16), children: [
          _section('Хүлээн авагч'),
          TextFormField(
            controller: _name,
            decoration: const InputDecoration(labelText: 'Нэр *'),
            validator: (v) => (v ?? '').trim().isEmpty ? 'Нэр оруулна уу' : null,
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _phone,
            keyboardType: TextInputType.phone,
            decoration: const InputDecoration(labelText: 'Утас *'),
            validator: (v) => digitsOnly(v ?? '').length != 8 ? 'Утасны дугаар 8 оронтой байна' : null,
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _extraPhone,
            keyboardType: TextInputType.phone,
            decoration: const InputDecoration(labelText: 'Нэмэлт утас'),
            validator: (v) {
              final d = digitsOnly(v ?? '');
              return d.isNotEmpty && d.length != 8 ? 'Утасны дугаар 8 оронтой байна' : null;
            },
          ),
          _section('Хаяг'),
          _dropdown('Аймаг / Хот', _city, _cities, _pickCity),
          const SizedBox(height: 12),
          _dropdown('Сум / Дүүрэг', _district, _districts, _pickDistrict),
          if (_subs.isNotEmpty) ...[
            const SizedBox(height: 12),
            _dropdown('Баг / Хороо', _sub, _subs, (s) => setState(() => _sub = s)),
          ],
          const SizedBox(height: 12),
          TextFormField(
            controller: _address,
            maxLines: 2,
            decoration: const InputDecoration(labelText: 'Дэлгэрэнгүй хаяг *', hintText: 'Байр, орц, давхар, тоот'),
            validator: (v) => (v ?? '').trim().isEmpty ? 'Хаяг оруулна уу' : null,
          ),
          const SizedBox(height: 12),
          TextFormField(controller: _note, maxLines: 2, decoration: const InputDecoration(labelText: 'Тэмдэглэл')),
          const SizedBox(height: 12),
          TextFormField(
            controller: _coupon,
            textCapitalization: TextCapitalization.characters,
            decoration: const InputDecoration(labelText: 'Хөнгөлөлтийн код'),
          ),
          _section('Захиалгын дүн'),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(children: [
                for (final l in shop.cart)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 3),
                    child: Row(children: [
                      Expanded(child: Text('${l.productName} × ${l.qty}', maxLines: 1, overflow: TextOverflow.ellipsis)),
                      Text(money(l.price * l.qty)),
                    ]),
                  ),
                const Divider(),
                Row(children: [const Expanded(child: Text('Хүргэлт')), Text(money(0))]),
                const SizedBox(height: 4),
                Row(children: [
                  const Expanded(child: Text('Нийт', style: TextStyle(fontWeight: FontWeight.bold))),
                  Text(money(shop.cartTotal), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                ]),
              ]),
            ),
          ),
          const SizedBox(height: 90),
        ]),
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: FilledButton(
            style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(50)),
            onPressed: _placing || shop.cart.isEmpty ? null : _submit,
            child: _placing
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Text('Захиалга баталгаажуулах'),
          ),
        ),
      ),
    );
  }

  Widget _section(String t) => Padding(
        padding: const EdgeInsets.only(top: 16, bottom: 10),
        child: Text(t, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
      );

  Widget _dropdown(String label, AddressArea? value, List<AddressArea> items, ValueChanged<AddressArea?> onChanged) =>
      DropdownButtonFormField<int>(
        key: ValueKey('$label-${value?.id}-${items.length}'),
        initialValue: value?.id,
        isExpanded: true,
        decoration: InputDecoration(labelText: label),
        items: [for (final a in items) DropdownMenuItem(value: a.id, child: Text(a.name))],
        onChanged: items.isEmpty ? null : (id) => onChanged(items.where((a) => a.id == id).firstOrNull),
      );
}
