import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../api/shop_models.dart';
import '../../state/shop_state.dart';
import '../common.dart';

/// Шинэ хаягт урьдчилан сонгох аймгийн ҮСХ-ны код (85 — Увс).
const defaultCityCode = '85';

Color? _hex(String? v) {
  final h = v?.replaceFirst('#', '');
  if (h == null || h.length != 6) return null;
  final n = int.tryParse(h, radix: 16);
  return n == null ? null : Color(0xFF000000 | n);
}

/// web-ийн NewAddressFields: хаягийн төрөл (Гэр, Ажил…) ба Аймаг/Нийслэл →
/// Сум/Дүүрэг → Баг/Хороо. Дээд түвшнийг солиход доод нь цэвэрлэгдэнэ.
class AddressFields extends StatefulWidget {
  final AddressAreaPick value;
  final ValueChanged<AddressAreaPick> onChanged;

  /// Бусад хадгалсан хаягийн ашигласан төрлүүд — энд харагдахгүй.
  final List<String> takenTypes;

  /// Хотыг заавал сонгох эсэх (маягт илгээхэд шалгана).
  final bool showErrors;
  const AddressFields({super.key, required this.value, required this.onChanged, this.takenTypes = const [], this.showErrors = false});

  @override
  State<AddressFields> createState() => _AddressFieldsState();
}

class _AddressFieldsState extends State<AddressFields> {
  List<AddressType> _types = [];
  List<AddressArea> _cities = [];
  List<AddressArea> _districts = [];
  List<AddressArea> _subs = [];

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    final shop = context.read<ShopState>();
    try {
      final types = await shop.addressTypes();
      if (!mounted) return;
      setState(() => _types = types);
      _ensureType();
    } catch (_) {}
    try {
      final cities = await shop.cities();
      if (!mounted) return;
      setState(() => _cities = cities);
      final v = widget.value;
      if (v.city == null) {
        final def = cities.where((c) => c.code == defaultCityCode).firstOrNull;
        if (def != null) await _pickCity(def);
      } else {
        // Засах үед доод түвшний жагсаалтуудыг ачаална.
        final d = await shop.districts(v.city!.id);
        if (!mounted) return;
        setState(() => _districts = d);
        if (v.district != null) {
          final s = await shop.subDistricts(v.district!.id);
          if (mounted) setState(() => _subs = s);
        }
      }
    } catch (_) {}
  }

  List<AddressType> get _available => _types.where((t) => !widget.takenTypes.contains(t.name)).toList();

  /// Сул байгаа эхний төрлийг урьдчилан сонгоно.
  void _ensureType() {
    final avail = _available;
    final cur = widget.value.type;
    if (avail.isEmpty || (cur != null && avail.any((t) => t.id == cur.id))) return;
    widget.onChanged(widget.value.copyWith(type: avail.first));
  }

  void _emit({AddressType? type, AddressArea? city, AddressArea? district, AddressArea? sub, int level = 0}) {
    final v = widget.value;
    widget.onChanged(AddressAreaPick(
      type: type ?? v.type,
      city: level == 1 ? city : v.city,
      district: level == 1 ? null : (level == 2 ? district : v.district),
      subDistrict: level == 1 || level == 2 ? null : (level == 3 ? sub : v.subDistrict),
    ));
  }

  Future<void> _pickCity(AddressArea? c) async {
    _emit(city: c, level: 1);
    setState(() {
      _districts = [];
      _subs = [];
    });
    if (c == null) return;
    try {
      final d = await context.read<ShopState>().districts(c.id);
      if (mounted && widget.value.city?.id == c.id) setState(() => _districts = d);
    } catch (_) {}
  }

  Future<void> _pickDistrict(AddressArea? d) async {
    _emit(district: d, level: 2);
    setState(() => _subs = []);
    if (d == null) return;
    try {
      final s = await context.read<ShopState>().subDistricts(d.id);
      if (mounted && widget.value.district?.id == d.id) setState(() => _subs = s);
    } catch (_) {}
  }

  Widget _dropdown(String label, AddressArea? value, List<AddressArea> items, ValueChanged<AddressArea?> onChanged, {String? error}) =>
      DropdownButtonFormField<int>(
        key: ValueKey('$label-${value?.id}-${items.length}'),
        initialValue: items.any((a) => a.id == value?.id) ? value?.id : null,
        isExpanded: true,
        decoration: InputDecoration(labelText: label, errorText: error),
        items: [for (final a in items) DropdownMenuItem(value: a.id, child: Text(a.name, overflow: TextOverflow.ellipsis))],
        onChanged: items.isEmpty ? null : (id) => onChanged(items.where((a) => a.id == id).firstOrNull),
      );

  @override
  Widget build(BuildContext context) {
    final v = widget.value;
    final avail = _available;
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      if (avail.isNotEmpty) ...[
        Wrap(spacing: 8, runSpacing: 8, children: [
          for (final t in avail)
            Builder(builder: (_) {
              final selected = v.type?.id == t.id;
              final bg = selected ? (_hex(t.bgColor) ?? brandColor) : Colors.white;
              final fg = selected ? (_hex(t.txtColor) ?? Colors.white) : Colors.black87;
              return Material(
                color: bg,
                shape: StadiumBorder(side: BorderSide(color: selected ? bg : borderColor)),
                child: InkWell(
                  customBorder: const StadiumBorder(),
                  onTap: () => _emit(type: t),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
                    child: Text(t.name, style: TextStyle(color: fg, fontWeight: FontWeight.w500)),
                  ),
                ),
              );
            }),
        ]),
        const SizedBox(height: 16),
      ],
      _dropdown('Аймаг / Нийслэл', v.city, _cities, _pickCity,
          error: widget.showErrors && v.city == null ? 'Аймаг / нийслэлээ сонгоно уу' : null),
      const SizedBox(height: 12),
      _dropdown('Сум / Дүүрэг', v.district, _districts, _pickDistrict,
          error: widget.showErrors && v.city != null && v.district == null && _districts.isNotEmpty ? 'Сум / дүүргээ сонгоно уу' : null),
      if (_subs.isNotEmpty) ...[
        const SizedBox(height: 12),
        _dropdown('Баг / Хороо', v.subDistrict, _subs, (s) => _emit(sub: s, level: 3)),
      ],
    ]);
  }
}
