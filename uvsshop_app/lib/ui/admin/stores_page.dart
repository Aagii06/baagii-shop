import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../api/admin_manage_models.dart';
import '../../state/admin_state.dart';
import '../common.dart';
import 'admin_widgets.dart';

const _tierColor = {'gold': Color(0xFFB45309), 'silver': Color(0xFF475569), 'bronze': Color(0xFFC2410C)};

/// web-ийн /stores: борлуулагч дэлгүүрүүд.
class StoresPage extends StatefulWidget {
  const StoresPage({super.key});
  @override
  State<StoresPage> createState() => _StoresPageState();
}

class _StoresPageState extends State<StoresPage> {
  List<Store>? _data;
  Object? _error;
  final Set<int> _deleting = {};

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final rows = await context.read<AdminState>().stores();
      if (mounted) {
        setState(() {
          _data = rows;
          _error = null;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _error = e);
    }
  }

  Future<void> _edit(Store? store) async {
    final saved = await Navigator.of(context).push<bool>(MaterialPageRoute(builder: (_) => StoreFormPage(store: store)));
    if (saved == true) _load();
  }

  Future<void> _delete(Store s) async {
    final ok = await confirmAction(context,
        title: 'Дэлгүүр устгах уу?',
        description: '“${s.name}” дэлгүүрийг устгана. Бараа, хэрэглэгчтэй дэлгүүрийг устгах боломжгүй.',
        confirmLabel: 'Устгах',
        danger: true);
    if (!ok || !mounted) return;
    setState(() => _deleting.add(s.id));
    final done = await runAction(context, () => context.read<AdminState>().deleteStore(s.id), 'Дэлгүүрийг устгалаа');
    if (!mounted) return;
    setState(() => _deleting.remove(s.id));
    if (done) _load();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(
          title: const Text('Дэлгүүрүүд'),
          actions: [
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: FilledButton.icon(onPressed: () => _edit(null), icon: const Icon(Icons.add), label: const Text('Нэмэх')),
            ),
          ],
        ),
        body: RefreshIndicator(
          onRefresh: _load,
          child: AsyncList<Store>(
            data: _data,
            error: _error,
            onRetry: _load,
            emptyIcon: Icons.storefront_outlined,
            emptyText: 'Дэлгүүр бүртгээгүй байна\nХамтран ажиллах хүсэлтийг батлахад дэлгүүр автоматаар үүснэ, эсвэл энд нэмнэ.',
            builder: (rows) => ListView.separated(
              itemCount: rows.length,
              separatorBuilder: (_, _) => const Divider(height: 1),
              itemBuilder: (_, i) {
                final s = rows[i];
                final contact = [if (s.phone != null) formatPhone(s.phone!), ?s.email].join(' · ');
                return Container(
                  color: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  child: Row(children: [
                    ImageBox(fileId: s.logo, size: 48, placeholder: Icons.storefront_outlined),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Row(children: [
                          Flexible(
                            child: Text(s.name,
                                maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                          ),
                          if (s.tier != 'normal') ...[
                            const SizedBox(width: 6),
                            StatusChip(storeTierLabel[s.tier]!, _tierColor[s.tier]!),
                          ],
                          const SizedBox(width: 6),
                          StatusChip('${s.productsCnt}', Colors.grey.shade700),
                        ]),
                        if (contact.isNotEmpty)
                          Text(contact,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(fontSize: 12, fontFamily: 'monospace', color: Colors.grey.shade600)),
                        if (s.address != null)
                          Text(s.address!, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                      ]),
                    ),
                    IconButton.outlined(tooltip: 'Засах', onPressed: () => _edit(s), icon: const Icon(Icons.edit_outlined, size: 18)),
                    DeleteIconButton(busy: _deleting.contains(s.id), onPressed: () => _delete(s)),
                  ]),
                );
              },
            ),
          ),
        ),
      );
}

/// Дэлгүүр бүртгэх / засах: лого, нэр, түвшин, утас, имэйл, хаяг (тус бүр 5 хүртэл).
class StoreFormPage extends StatefulWidget {
  final Store? store;
  const StoreFormPage({super.key, this.store});
  @override
  State<StoreFormPage> createState() => _StoreFormPageState();
}

class _StoreFormPageState extends State<StoreFormPage> {
  late final _name = TextEditingController(text: widget.store?.name ?? '');
  late List<String> _phones = [...?widget.store?.phones];
  late List<String> _emails = [...?widget.store?.emails];
  late List<String> _addresses = [...?widget.store?.addresses];
  late String? _logo = widget.store?.logo;
  PickedImage? _logoFile;
  late String _tier = widget.store?.tier ?? 'normal';
  bool _submitted = false;
  bool _saving = false;

  bool get _dirty {
    final s = widget.store;
    bool same(List<String> a, List<String> b) => a.join('\n') == b.join('\n');
    return _name.text != (s?.name ?? '') ||
        !same(_phones, s?.phones ?? []) ||
        !same(_emails, s?.emails ?? []) ||
        !same(_addresses, s?.addresses ?? []) ||
        _logo != s?.logo ||
        _logoFile != null ||
        _tier != (s?.tier ?? 'normal');
  }

  @override
  void dispose() {
    _name.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() => _submitted = true);
    if (_name.text.trim().isEmpty || _phones.isEmpty) return;
    final admin = context.read<AdminState>();
    setState(() => _saving = true);
    final saved = await runAction(context, () async {
      final logo = _logoFile != null ? await admin.uploadImage(_logoFile!.bytes, _logoFile!.name, 'stores') : _logo;
      await admin.saveStore(widget.store?.id, {
        'name': _name.text.trim(),
        'phones': _phones,
        'emails': _emails,
        'addresses': _addresses,
        'logo': logo,
        'tier': _tier,
      });
    }, widget.store == null ? 'Дэлгүүрийг бүртгэлээ' : 'Хадгаллаа');
    if (!mounted) return;
    if (saved) {
      Navigator.pop(context, true);
    } else {
      setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final hasLogo = _logo != null || _logoFile != null;
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.store == null ? 'Дэлгүүр бүртгэх' : 'Дэлгүүр засах'),
        actions: [SaveAction(enabled: _dirty, busy: _saving, onPressed: _save)],
      ),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        Row(children: [
          Stack(clipBehavior: Clip.none, children: [
            ImageBox(fileId: _logo, bytes: _logoFile?.bytes, size: 80, placeholder: Icons.storefront_outlined),
            if (hasLogo)
              Positioned(
                right: -8,
                top: -8,
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
          const SizedBox(width: 16),
          OutlinedButton(
            onPressed: () async {
              final img = await pickImage(context);
              if (img != null) setState(() => _logoFile = img);
            },
            child: Text(hasLogo ? 'Лого солих' : 'Лого нэмэх'),
          ),
        ]),
        const SizedBox(height: 16),
        TextField(
          controller: _name,
          onChanged: (_) => setState(() {}),
          decoration: fieldDecoration('Дэлгүүрийн нэр',
              error: _submitted && _name.text.trim().isEmpty ? 'Дэлгүүрийн нэр оруулна уу' : null),
        ),
        const SizedBox(height: 14),
        DropdownButtonFormField<String>(
          initialValue: _tier,
          decoration: fieldDecoration('Түвшин', helper: 'Дэлгүүрүүд хуудсанд өндөр түвшний дэлгүүрийн бараа эхэндээ гарна'),
          items: [for (final t in storeTiers) DropdownMenuItem(value: t, child: Text(storeTierLabel[t]!))],
          onChanged: (v) => setState(() => _tier = v ?? 'normal'),
        ),
        const SizedBox(height: 14),
        ContactList(
          title: 'Утасны дугаар',
          hint: '$maxStoreContacts хүртэл, эхнийх нь үндсэн',
          empty: 'Дугаар нэмээгүй байна',
          addLabel: 'Дугаар нэмэх',
          items: _phones,
          mono: true,
          error: _submitted && _phones.isEmpty ? 'Дор хаяж нэг утасны дугаар нэмнэ үү' : null,
          check: (v) => v.length == 8 ? null : 'Утасны дугаар 8 оронтой байна',
          onChanged: (v) => setState(() => _phones = v),
          input: (value, onChanged, label) => TextFormField(
            initialValue: value,
            autofocus: value.isEmpty,
            keyboardType: TextInputType.phone,
            maxLength: 8,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            style: const TextStyle(fontFamily: 'monospace'),
            onChanged: onChanged,
            decoration: fieldDecoration(label, hint: 'Утасны дугаар').copyWith(counterText: ''),
          ),
        ),
        const SizedBox(height: 14),
        ContactList(
          title: 'Имэйл',
          hint: '$maxStoreContacts хүртэл',
          empty: 'Имэйл нэмээгүй байна',
          addLabel: 'Имэйл нэмэх',
          items: _emails,
          normalize: (v) => v.trim().toLowerCase(),
          check: (v) => emailRe.hasMatch(v) ? null : 'Имэйл буруу байна',
          onChanged: (v) => setState(() => _emails = v),
          input: (value, onChanged, label) => TextFormField(
            initialValue: value,
            autofocus: value.isEmpty,
            keyboardType: TextInputType.emailAddress,
            autocorrect: false,
            onChanged: onChanged,
            decoration: fieldDecoration(label, hint: 'Имэйл хаяг'),
          ),
        ),
        const SizedBox(height: 14),
        ContactList(
          title: 'Хаяг',
          hint: 'Салбар бүрийн хаягийг аймаг, сум, багаас сонгож нэмнэ ($maxStoreContacts хүртэл)',
          empty: 'Хаяг нэмээгүй байна',
          addLabel: 'Хаяг нэмэх',
          items: _addresses,
          check: (_) => null,
          onChanged: (v) => setState(() => _addresses = v),
          input: (value, onChanged, label) => AddressPicker(value: value, onChanged: onChanged),
        ),
      ]),
    );
  }
}

typedef ContactInput = Widget Function(String value, ValueChanged<String> onChanged, String label);

/// Дэлгүүрийн нэг холбоо барих жагсаалт: маягт дээр зөвхөн харагдаж,
/// доод sheet дээр бүгдийг нь засна. Эхнийх нь үндсэн.
class ContactList extends StatelessWidget {
  final String title;
  final String hint;
  final String empty;
  final String addLabel;
  final List<String> items;
  final ValueChanged<List<String>> onChanged;
  final String? Function(String) check;
  final String Function(String) normalize;
  final String? error;
  final bool mono;
  final ContactInput input;

  const ContactList({
    super.key,
    required this.title,
    required this.hint,
    required this.empty,
    required this.addLabel,
    required this.items,
    required this.onChanged,
    required this.check,
    this.normalize = _trim,
    this.error,
    this.mono = false,
    required this.input,
  });

  static String _trim(String v) => v.trim();

  Future<void> _openSheet(BuildContext context) async {
    final next = await showModalBottomSheet<List<String>>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => _ListSheet(
        title: title,
        hint: hint,
        addLabel: addLabel,
        items: items,
        check: check,
        normalize: normalize,
        input: input,
      ),
    );
    if (next != null) onChanged(next);
  }

  @override
  Widget build(BuildContext context) {
    final several = items.length > 1;
    return Panel(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
              Text(hint, style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
            ]),
          ),
          FilledButton.tonalIcon(
            onPressed: () => _openSheet(context),
            icon: Icon(items.isEmpty ? Icons.add : Icons.edit_outlined, size: 16),
            label: Text(items.isEmpty ? 'Нэмэх' : 'Засах'),
          ),
        ]),
        const SizedBox(height: 10),
        if (items.isEmpty)
          Text(empty, style: TextStyle(color: Colors.grey.shade600))
        else
          for (var i = 0; i < items.length; i++)
            Container(
              margin: const EdgeInsets.only(bottom: 4),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: several && i == 0 ? accentColor : mutedColor,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(children: [
                if (several && i == 0) ...[const Icon(Icons.star, size: 16, color: brandColor), const SizedBox(width: 6)],
                Expanded(
                  child: Text(items[i],
                      style: TextStyle(
                        fontSize: 15,
                        fontFamily: mono ? 'monospace' : null,
                        fontWeight: several && i == 0 ? FontWeight.bold : FontWeight.w500,
                        color: several && i == 0 ? brandColor : null,
                      )),
                ),
                if (several && i == 0)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(color: brandColor, borderRadius: BorderRadius.circular(20)),
                    child: const Text('Үндсэн', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                  ),
                if (several && i > 0)
                  IconButton(
                    tooltip: 'Үндсэн болгох',
                    visualDensity: VisualDensity.compact,
                    icon: Icon(Icons.star_border, size: 18, color: Colors.grey.shade600),
                    onPressed: () => onChanged([items[i], ...items.where((e) => e != items[i])]),
                  ),
              ]),
            ),
        if (error != null)
          Padding(
            padding: const EdgeInsets.only(top: 6),
            child: Text(error!, style: TextStyle(color: Colors.red.shade700, fontSize: 13)),
          ),
      ]),
    );
  }
}

class _ListSheet extends StatefulWidget {
  final String title;
  final String hint;
  final String addLabel;
  final List<String> items;
  final String? Function(String) check;
  final String Function(String) normalize;
  final ContactInput input;
  const _ListSheet({
    required this.title,
    required this.hint,
    required this.addLabel,
    required this.items,
    required this.check,
    required this.normalize,
    required this.input,
  });

  @override
  State<_ListSheet> createState() => _ListSheetState();
}

class _ListSheetState extends State<_ListSheet> {
  // Мөр бүр тогтвортой key-тэй, дараалал солигдоход оруулсан утга алдагдахгүй.
  late final List<(int, String)> _draft = widget.items.isEmpty
      ? [(0, '')]
      : [for (var i = 0; i < widget.items.length; i++) (i, widget.items[i])];
  late int _nextKey = _draft.length;
  String? _error;

  void _move(int i, int dir) => setState(() {
        final t = _draft[i];
        _draft[i] = _draft[i + dir];
        _draft[i + dir] = t;
        _error = null;
      });

  void _save() {
    final clean = _draft.map((d) => widget.normalize(d.$2)).where((v) => v.isNotEmpty).toList();
    final problem = clean.map(widget.check).whereType<String>().firstOrNull ??
        (clean.toSet().length != clean.length ? 'Ижил утга давхардсан байна' : null);
    if (problem != null) return setState(() => _error = problem);
    Navigator.pop(context, clean);
  }

  @override
  Widget build(BuildContext context) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
        child: ConstrainedBox(
          constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(context).height * 0.85),
          child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(widget.title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                Text('${widget.hint}. Сумаар эрэмбэлнэ, эхнийх нь үндсэн',
                    style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
              ]),
            ),
            const SizedBox(height: 12),
            Flexible(
              child: ListView(shrinkWrap: true, padding: const EdgeInsets.symmetric(horizontal: 20), children: [
                for (var i = 0; i < _draft.length; i++)
                  Padding(
                    key: ValueKey(_draft[i].$1),
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Expanded(
                        child: widget.input(
                          _draft[i].$2,
                          (v) => setState(() {
                            final k = _draft.indexWhere((d) => d.$1 == _draft[i].$1);
                            _draft[k] = (_draft[k].$1, v);
                            _error = null;
                          }),
                          '${widget.title} ${i + 1}',
                        ),
                      ),
                      Column(children: [
                        IconButton(
                          visualDensity: VisualDensity.compact,
                          tooltip: 'Дээш зөөх',
                          onPressed: i == 0 ? null : () => _move(i, -1),
                          icon: const Icon(Icons.keyboard_arrow_up),
                        ),
                        IconButton(
                          visualDensity: VisualDensity.compact,
                          tooltip: 'Доош зөөх',
                          onPressed: i == _draft.length - 1 ? null : () => _move(i, 1),
                          icon: const Icon(Icons.keyboard_arrow_down),
                        ),
                      ]),
                      IconButton(
                        tooltip: 'Хасах',
                        onPressed: () => setState(() {
                          _draft.removeAt(i);
                          _error = null;
                        }),
                        icon: const Icon(Icons.close),
                      ),
                    ]),
                  ),
                if (_draft.length < maxStoreContacts)
                  OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(48)),
                    onPressed: () => setState(() => _draft.add((_nextKey++, ''))),
                    icon: const Icon(Icons.add),
                    label: Text(widget.addLabel),
                  ),
              ]),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
              child: Column(children: [
                if (_error != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Text(_error!, style: TextStyle(color: Colors.red.shade700)),
                  ),
                Row(children: [
                  Expanded(child: OutlinedButton(onPressed: () => Navigator.pop(context), child: const Text('Болих'))),
                  const SizedBox(width: 8),
                  Expanded(child: FilledButton(onPressed: _save, child: const Text('Хадгалах'))),
                ]),
              ]),
            ),
          ]),
        ),
      );
}

/// Аймаг/Нийслэл → Сум/Дүүрэг → Баг/Хороо-оос сонгож, үлдсэнийг бичнэ.
/// Утга нь нэг мөр: "Улаанбаатар, Баянзүрх, 1-р хороо, 5-р байр 12 тоот".
class AddressPicker extends StatefulWidget {
  final String value;
  final ValueChanged<String> onChanged;
  const AddressPicker({super.key, required this.value, required this.onChanged});
  @override
  State<AddressPicker> createState() => _AddressPickerState();
}

class _AddressPickerState extends State<AddressPicker> {
  static const _sep = ', ';
  List<Area> _cities = [];
  List<Area> _districts = [];
  List<Area> _subs = [];
  int? _cityId;
  int? _districtId;
  int? _subId;
  final _detail = TextEditingController();
  bool _ready = false;

  @override
  void initState() {
    super.initState();
    _parse();
  }

  @override
  void dispose() {
    _detail.dispose();
    super.dispose();
  }

  /// Хадгалсан хаягийг сонголтууд руу буцааж уншина.
  Future<void> _parse() async {
    final admin = context.read<AdminState>();
    final parts = widget.value.split(_sep);
    try {
      _cities = await admin.cities();
      final city = _cities.where((c) => c.name == parts[0]).firstOrNull;
      if (city == null) {
        _detail.text = widget.value;
      } else {
        _cityId = city.id;
        _districts = await admin.districts(city.id);
        final district = parts.length > 1 ? _districts.where((d) => d.name == parts[1]).firstOrNull : null;
        if (district == null) {
          _detail.text = parts.skip(1).join(_sep);
        } else {
          _districtId = district.id;
          _subs = await admin.subDistricts(district.id);
          final sub = parts.length > 2 ? _subs.where((s) => s.name == parts[2]).firstOrNull : null;
          _subId = sub?.id;
          _detail.text = parts.skip(sub != null ? 3 : 2).join(_sep);
        }
      }
    } catch (_) {
      _detail.text = widget.value;
    }
    if (mounted) setState(() => _ready = true);
  }

  String? _nameOf(List<Area> list, int? id) => list.where((a) => a.id == id).firstOrNull?.name;

  void _emit() {
    final city = _nameOf(_cities, _cityId);
    final line = city == null
        ? ''
        : [city, ?_nameOf(_districts, _districtId), ?_nameOf(_subs, _subId), _detail.text.trim()]
            .where((e) => e.isNotEmpty)
            .join(_sep);
    widget.onChanged(line);
  }

  Widget _select(String label, List<Area> areas, int? value, ValueChanged<int?>? onChanged) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: DropdownButtonFormField<int>(
          // Жагсаалт солигдоход сонголтыг шинээр зурна.
          key: ValueKey('$label-${areas.length}-$value'),
          initialValue: areas.any((a) => a.id == value) ? value : null,
          isExpanded: true,
          decoration: fieldDecoration(label),
          items: [for (final a in areas) DropdownMenuItem(value: a.id, child: Text(a.name, overflow: TextOverflow.ellipsis))],
          onChanged: onChanged,
        ),
      );

  @override
  Widget build(BuildContext context) {
    if (!_ready) return const Padding(padding: EdgeInsets.all(12), child: LinearProgressIndicator());
    final admin = context.read<AdminState>();
    return Column(children: [
      _select('Аймаг / Нийслэл', _cities, _cityId, (id) async {
        setState(() {
          _cityId = id;
          _districtId = null;
          _subId = null;
          _districts = [];
          _subs = [];
        });
        _emit();
        if (id == null) return;
        final list = await admin.districts(id).catchError((_) => <Area>[]);
        if (mounted && _cityId == id) setState(() => _districts = list);
      }),
      _select('Сум / Дүүрэг', _districts, _districtId, _cityId == null
          ? null
          : (id) async {
              setState(() {
                _districtId = id;
                _subId = null;
                _subs = [];
              });
              _emit();
              if (id == null) return;
              final list = await admin.subDistricts(id).catchError((_) => <Area>[]);
              if (mounted && _districtId == id) setState(() => _subs = list);
            }),
      _select('Баг / Хороо', _subs, _subId, _districtId == null || _subs.isEmpty
          ? null
          : (id) {
              setState(() => _subId = id);
              _emit();
            }),
      TextField(
        controller: _detail,
        maxLines: 3,
        minLines: 2,
        maxLength: 200,
        onChanged: (_) => _emit(),
        decoration: fieldDecoration('Дэлгэрэнгүй хаяг (байр, орц, тоот…)'),
      ),
    ]);
  }
}
