import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../api/shop_models.dart';
import '../../state/shop_state.dart';
import '../common.dart';
import 'address_fields.dart';
import 'pay_page.dart';
import 'sign_in_page.dart';


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

  AddressAreaPick _area = const AddressAreaPick();

  /// Сонгосон хадгалсан хаяг; `_custom` бол шинэ хаяг гараар оруулна.
  String? _selectedId;
  bool _custom = false;
  bool _attempted = false;
  bool _placing = false;
  bool _prefilled = false;

  @override
  void dispose() {
    for (final c in [_name, _phone, _extraPhone, _address, _note, _coupon]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _submit() async {
    final shop = context.read<ShopState>();
    final selected = shop.addresses.where((a) => a.id == _selectedId).firstOrNull;
    final useSaved = !_custom && selected != null;
    setState(() => _attempted = true);
    final formOk = _form.currentState!.validate();
    if (!formOk || (!useSaved && _area.city == null)) return;
    setState(() => _placing = true);
    final area = useSaved ? selected.area : _area;
    try {
      final order = await shop.placeOrder({
        'addressLabel': useSaved ? selected.displayLabel : (_area.type?.name ?? 'Бусад хаяг'),
        'address': useSaved ? selected.address : _area.format(_address.text),
        if (area?.type != null) 'addressTypeId': area!.type!.id,
        if (area?.city != null) 'cityId': area!.city!.id,
        if (area?.district != null) 'districtId': area!.district!.id,
        if (area?.subDistrict != null) 'subDistrictId': area!.subDistrict!.id,
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
    // Хадгалсан хаягаас үндсэнийг нь урьдчилан сонгоно.
    if (shop.addresses.isNotEmpty && !shop.addresses.any((a) => a.id == _selectedId)) {
      _selectedId = (shop.addresses.where((a) => a.isDefault).firstOrNull ?? shop.addresses.first).id;
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
          _addressSection(shop),
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

  /// web-ийн ShippingForm-ийн хаягийн хэсэг: хадгалсан хаягаас сонгох, эсвэл шинээр оруулах.
  Widget _addressSection(ShopState shop) {
    final saved = shop.addresses;
    final usingCustom = saved.isEmpty || _custom;
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      Padding(
        padding: const EdgeInsets.only(top: 16, bottom: 10),
        child: Row(children: [
          const Expanded(child: Text('Хүргэлтийн хаяг', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16))),
          if (saved.isNotEmpty)
            TextButton.icon(
              onPressed: () => setState(() => _custom = !_custom),
              icon: const Icon(Icons.add, size: 16),
              label: Text(_custom ? 'Хадгалсан хаягууд' : 'Шинэ хаяг нэмэх'),
            ),
        ]),
      ),
      if (!usingCustom)
        for (final a in saved)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Material(
              color: a.id == _selectedId ? accentColor.withValues(alpha: 0.4) : Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: BorderSide(color: a.id == _selectedId ? brandColor : borderColor, width: 2),
              ),
              child: InkWell(
                borderRadius: BorderRadius.circular(12),
                onTap: () => setState(() => _selectedId = a.id),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(a.displayLabel, style: const TextStyle(fontWeight: FontWeight.w600)),
                    const SizedBox(height: 4),
                    Text(a.address, style: TextStyle(fontSize: 14, color: Colors.grey.shade600, height: 1.4)),
                  ]),
                ),
              ),
            ),
          )
      else ...[
        AddressFields(value: _area, onChanged: (v) => setState(() => _area = v), showErrors: _attempted),
        const SizedBox(height: 12),
        TextFormField(
          controller: _address,
          maxLines: 3,
          decoration: const InputDecoration(labelText: 'Дэлгэрэнгүй хаяг', hintText: 'Байр, орц, давхар, тоот...'),
          validator: (v) => (v ?? '').trim().isEmpty ? 'Хаяг оруулна уу' : null,
        ),
      ],
    ]);
  }
}
