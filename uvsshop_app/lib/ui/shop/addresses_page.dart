import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../api/shop_models.dart';
import '../../state/shop_state.dart';
import '../common.dart';
import 'address_fields.dart';

/// web-ийн /addresses: хадгалсан хүргэлтийн хаягууд (3 хүртэл), нэг нь үндсэн.
class AddressesPage extends StatefulWidget {
  const AddressesPage({super.key});
  @override
  State<AddressesPage> createState() => _AddressesPageState();
}

class _AddressesPageState extends State<AddressesPage> {
  bool _showForm = false;
  String? _editingId;
  AddressAreaPick _area = const AddressAreaPick();
  final _detail = TextEditingController();
  bool _attempted = false;

  @override
  void dispose() {
    _detail.dispose();
    super.dispose();
  }

  void _open(String? id, AddressAreaPick area, String detail) => setState(() {
        _editingId = id;
        _area = area;
        _detail.text = detail;
        _attempted = false;
        _showForm = true;
      });

  void _close() => setState(() {
        _showForm = false;
        _editingId = null;
      });

  Future<void> _save() async {
    setState(() => _attempted = true);
    if (_area.city == null || _detail.text.trim().isEmpty) return;
    final shop = context.read<ShopState>();
    final a = SavedAddress(
      id: '',
      label: _area.type?.name ?? 'Хаяг',
      address: _area.format(_detail.text),
      area: _area,
      detail: _detail.text.trim(),
    );
    if (_editingId != null) {
      await shop.updateAddress(_editingId!, a);
    } else {
      await shop.addAddress(a);
    }
    if (mounted) _close();
  }

  @override
  Widget build(BuildContext context) {
    final shop = context.watch<ShopState>();
    final list = shop.addresses;
    final atLimit = list.length >= ShopState.maxAddresses;
    final taken = list.where((a) => a.id != _editingId).map((a) => a.displayLabel).toList();
    final box = BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: borderColor));

    return Scaffold(
      appBar: AppBar(title: const Text('Хүргэлтийн хаяг')),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        Row(children: [
          const Expanded(child: SizedBox()),
          if (!_showForm && !atLimit)
            FilledButton.icon(
              onPressed: () => _open(null, const AddressAreaPick(), ''),
              icon: const Icon(Icons.add, size: 18),
              label: const Text('Шинэ хаяг нэмэх'),
            ),
        ]),
        const SizedBox(height: 16),
        if (atLimit && !_showForm)
          Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: Text('Хамгийн ихдээ ${ShopState.maxAddresses} хаяг бүртгэх боломжтой.', style: TextStyle(color: Colors.grey.shade600)),
          ),
        if (_showForm)
          Container(
            margin: const EdgeInsets.only(bottom: 16),
            padding: const EdgeInsets.all(16),
            decoration: box,
            child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              Text(_editingId != null ? 'Хаяг засах' : 'Шинэ хаяг', style: const TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 16),
              AddressFields(
                value: _area,
                onChanged: (v) => setState(() => _area = v),
                takenTypes: taken,
                showErrors: _attempted,
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _detail,
                maxLines: 3,
                onChanged: (_) => setState(() {}),
                decoration: InputDecoration(
                  labelText: 'Дэлгэрэнгүй хаяг',
                  hintText: 'Байр, орц, давхар, тоот',
                  errorText: _attempted && _detail.text.trim().isEmpty ? 'Хаяг оруулна уу' : null,
                ),
              ),
              const SizedBox(height: 16),
              Row(children: [
                FilledButton(onPressed: _save, child: const Text('Хадгалах')),
                const SizedBox(width: 8),
                TextButton(onPressed: _close, child: const Text('Болих')),
              ]),
            ]),
          ),
        if (list.isEmpty && !_showForm)
          Container(
            padding: const EdgeInsets.all(40),
            decoration: box,
            child: Column(children: [
              Icon(Icons.location_on_outlined, size: 40, color: Colors.grey.shade500),
              const SizedBox(height: 12),
              const Text('Хадгалсан хаяг алга', style: TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 4),
              Text('Хүргэлтийн хаягаа нэмбэл захиалга хийхэд хурдан болно.',
                  textAlign: TextAlign.center, style: TextStyle(fontSize: 13, color: Colors.grey.shade600)),
            ]),
          )
        else
          for (final a in list)
            Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(16),
              decoration: box,
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Row(children: [
                        Text(a.displayLabel, style: const TextStyle(fontWeight: FontWeight.w600)),
                        if (a.isDefault) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(color: brandColor.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(20)),
                            child: const Row(mainAxisSize: MainAxisSize.min, children: [
                              Icon(Icons.check, size: 12, color: brandColor),
                              SizedBox(width: 3),
                              Text('Үндсэн хаяг', style: TextStyle(fontSize: 11, color: brandColor, fontWeight: FontWeight.w500)),
                            ]),
                          ),
                        ],
                      ]),
                      const SizedBox(height: 4),
                      Text(a.address, style: TextStyle(fontSize: 14, color: Colors.grey.shade600)),
                    ]),
                  ),
                  IconButton(
                    tooltip: 'Засах',
                    visualDensity: VisualDensity.compact,
                    onPressed: () => _open(a.id, a.area ?? const AddressAreaPick(), a.detail ?? a.address),
                    icon: Icon(Icons.edit_outlined, size: 18, color: Colors.grey.shade600),
                  ),
                  IconButton(
                    tooltip: 'Устгах',
                    visualDensity: VisualDensity.compact,
                    onPressed: () => shop.removeAddress(a.id),
                    icon: Icon(Icons.delete_outline, size: 18, color: Colors.grey.shade600),
                  ),
                ]),
                if (!a.isDefault)
                  TextButton(
                    style: TextButton.styleFrom(padding: EdgeInsets.zero, visualDensity: VisualDensity.compact),
                    onPressed: () => shop.setDefaultAddress(a.id),
                    child: const Text('Үндсэн болгох', style: TextStyle(fontSize: 12)),
                  ),
              ]),
            ),
      ]),
    );
  }
}
