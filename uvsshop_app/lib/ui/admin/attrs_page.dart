import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../api/admin_manage_models.dart';
import '../../state/admin_state.dart';
import '../common.dart';
import 'admin_widgets.dart';

/// "#ff0000" → өнгө.
Color? _hex(String? v) {
  final h = v?.replaceFirst('#', '');
  if (h == null || (h.length != 6 && h.length != 3)) return null;
  final full = h.length == 3 ? h.split('').map((c) => '$c$c').join() : h;
  final n = int.tryParse(full, radix: 16);
  return n == null ? null : Color(0xFF000000 | n);
}

/// web-ийн /attrs: барааны үзүүлэлт (өнгө, хэмжээ…) ба утгууд.
class AttrsPage extends StatefulWidget {
  const AttrsPage({super.key});
  @override
  State<AttrsPage> createState() => _AttrsPageState();
}

class _AttrsPageState extends State<AttrsPage> {
  List<AttrRecord>? _data;
  Object? _error;
  final Set<int> _deleting = {};

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final rows = await context.read<AdminState>().attrRecords();
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

  Future<void> _edit(AttrRecord? a) async {
    // Жагсаалт бүх утгыг илгээхгүй байж болох тул засахын өмнө бүрнээр нь уншина.
    AttrRecord? full = a;
    if (a != null && a.values.length < a.valuesCnt) {
      full = await context.read<AdminState>().attr(a.id).catchError((_) => a);
      if (!mounted) return;
    }
    final saved = await Navigator.of(context).push<bool>(MaterialPageRoute(builder: (_) => AttrFormPage(attr: full)));
    if (saved == true) _load();
  }

  Future<void> _delete(AttrRecord a) async {
    final ok = await confirmAction(context,
        title: 'Үзүүлэлт устгах уу?', description: '“${a.name}” үзүүлэлтийг устгана. Буцаах боломжгүй.', confirmLabel: 'Устгах', danger: true);
    if (!ok || !mounted) return;
    setState(() => _deleting.add(a.id));
    final done = await runAction(context, () => context.read<AdminState>().deleteAttr(a.id), 'Үзүүлэлтийг устгалаа');
    if (!mounted) return;
    setState(() => _deleting.remove(a.id));
    if (done) _load();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(
          title: const Text('Үзүүлэлт'),
          actions: [
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: FilledButton.icon(onPressed: () => _edit(null), icon: const Icon(Icons.add), label: const Text('Нэмэх')),
            ),
          ],
        ),
        body: RefreshIndicator(
          onRefresh: _load,
          child: AsyncList<AttrRecord>(
            data: _data,
            error: _error,
            onRetry: _load,
            emptyIcon: Icons.tune,
            emptyText: 'Үзүүлэлт алга\n“Нэмэх” товчоор өнгө, хэмжээ зэрэг үзүүлэлт нэмнэ үү.',
            builder: (rows) => ListView.separated(
              itemCount: rows.length,
              separatorBuilder: (_, _) => const Divider(height: 1),
              itemBuilder: (_, i) {
                final a = rows[i];
                final colors = a.values.take(5).map((v) => _hex(v.color)).whereType<Color>().toList();
                return Container(
                  color: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  child: Row(children: [
                    Expanded(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Row(children: [
                          Flexible(
                            child: Text(a.name,
                                maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                          ),
                          const SizedBox(width: 6),
                          StatusChip('${a.valuesCnt}', Colors.grey.shade700),
                        ]),
                        if (a.preview.isNotEmpty)
                          Padding(
                            padding: const EdgeInsets.only(top: 3),
                            child: Row(children: [
                              for (final c in colors)
                                Container(
                                  width: 14,
                                  height: 14,
                                  margin: const EdgeInsets.only(right: 2),
                                  decoration: BoxDecoration(color: c, shape: BoxShape.circle, border: Border.all(color: Colors.white)),
                                ),
                              if (colors.isNotEmpty) const SizedBox(width: 4),
                              Expanded(
                                child: Text(a.preview,
                                    maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                              ),
                            ]),
                          ),
                      ]),
                    ),
                    IconButton.outlined(tooltip: 'Засах', onPressed: () => _edit(a), icon: const Icon(Icons.edit_outlined, size: 18)),
                    DeleteIconButton(busy: _deleting.contains(a.id), onPressed: () => _delete(a)),
                  ]),
                );
              },
            ),
          ),
        ),
      );
}

/// Үзүүлэлт нэмэх / засах: нэр ба утгууд (дарааллаар нь).
class AttrFormPage extends StatefulWidget {
  final AttrRecord? attr;
  const AttrFormPage({super.key, this.attr});
  @override
  State<AttrFormPage> createState() => _AttrFormPageState();
}

class _AttrFormPageState extends State<AttrFormPage> {
  late final _name = TextEditingController(text: widget.attr?.name ?? '');
  final _draft = TextEditingController();
  // (тогтвортой key, id, controller)
  late final List<(int, int?, TextEditingController)> _values = [
    for (final (i, v) in (widget.attr?.values ?? <AttrValue>[]).indexed) (i, v.id, TextEditingController(text: v.name)),
  ];
  late int _nextKey = _values.length;
  String? _draftError;
  bool _submitted = false;
  bool _saving = false;

  @override
  void dispose() {
    _name.dispose();
    _draft.dispose();
    for (final v in _values) {
      v.$3.dispose();
    }
    super.dispose();
  }

  bool get _dirty {
    final saved = widget.attr?.values ?? [];
    return _name.text != (widget.attr?.name ?? '') ||
        _draft.text.trim().isNotEmpty ||
        _values.length != saved.length ||
        [for (var i = 0; i < _values.length; i++) _values[i].$2 != saved[i].id || _values[i].$3.text != saved[i].name].any((x) => x);
  }

  String? _firstDuplicate(List<String> names) {
    final seen = <String>{};
    for (final n in names) {
      if (!seen.add(valueKey(n))) return n.trim();
    }
    return null;
  }

  /// Бичсэн утгыг жагсаалтад нэмнэ. Нэмж чадахгүй бол false.
  bool _addDraft() {
    final value = _draft.text.trim();
    if (value.isEmpty) return true;
    if (_values.any((v) => valueKey(v.$3.text) == valueKey(value))) {
      setState(() => _draftError = '“$value” утга аль хэдийн байна');
      return false;
    }
    setState(() {
      _values.add((_nextKey++, null, TextEditingController(text: value)));
      _draft.clear();
      _draftError = null;
    });
    return true;
  }

  Future<void> _save() async {
    setState(() => _submitted = true);
    if (!_addDraft()) return;
    final names = _values.map((v) => v.$3.text).toList();
    if (_name.text.trim().isEmpty || names.isEmpty || names.any((n) => n.trim().isEmpty) || _firstDuplicate(names) != null) return;
    final admin = context.read<AdminState>();
    setState(() => _saving = true);
    final saved = await runAction(
      context,
      () => admin.saveAttr(widget.attr, _name.text.trim(), [for (final v in _values) (v.$2, v.$3.text.trim())]),
      widget.attr == null ? 'Үзүүлэлт нэмлээ' : 'Хадгаллаа',
    );
    if (!mounted) return;
    if (saved) {
      Navigator.pop(context, true);
    } else {
      setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final names = _values.map((v) => v.$3.text).toList();
    final dup = _firstDuplicate(names);
    final valuesError = !_submitted
        ? null
        : _values.isEmpty
            ? 'Хамгийн багадаа нэг утга нэмнэ үү'
            : names.any((n) => n.trim().isEmpty)
                ? 'Хоосон утгыг бөглөх эсвэл хасна уу'
                : dup != null
                    ? '“$dup” утга давхардсан байна'
                    : null;
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.attr == null ? 'Үзүүлэлт нэмэх' : 'Үзүүлэлт засах'),
        actions: [SaveAction(enabled: _dirty, busy: _saving, onPressed: _save)],
      ),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        TextField(
          controller: _name,
          onChanged: (_) => setState(() {}),
          decoration: fieldDecoration('Нэр', error: _submitted && _name.text.trim().isEmpty ? 'Үзүүлэлтийн нэр оруулна уу' : null),
        ),
        const SizedBox(height: 16),
        Panel(
          padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Утгууд', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
            Text('Бараа бүртгэхэд эдгээрээс сонгоно. Энд байгаа дарааллаар харагдана.',
                style: TextStyle(fontSize: 13, color: Colors.grey.shade600)),
            const SizedBox(height: 12),
            for (var i = 0; i < _values.length; i++)
              Padding(
                key: ValueKey(_values[i].$1),
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(children: [
                  Expanded(
                    child: TextField(
                      controller: _values[i].$3,
                      onChanged: (_) => setState(() {}),
                      decoration: fieldDecoration('Утга ${i + 1}',
                              error: _submitted && _values[i].$3.text.trim().isEmpty ? '' : null)
                          .copyWith(isDense: true),
                    ),
                  ),
                  IconButton(
                    visualDensity: VisualDensity.compact,
                    tooltip: 'Дээш',
                    onPressed: i == 0
                        ? null
                        : () => setState(() {
                              final t = _values[i];
                              _values[i] = _values[i - 1];
                              _values[i - 1] = t;
                            }),
                    icon: const Icon(Icons.arrow_upward, size: 18),
                  ),
                  IconButton(
                    visualDensity: VisualDensity.compact,
                    tooltip: 'Доош',
                    onPressed: i == _values.length - 1
                        ? null
                        : () => setState(() {
                              final t = _values[i];
                              _values[i] = _values[i + 1];
                              _values[i + 1] = t;
                            }),
                    icon: const Icon(Icons.arrow_downward, size: 18),
                  ),
                  IconButton(
                    visualDensity: VisualDensity.compact,
                    tooltip: 'Хасах',
                    onPressed: () => setState(() => _values.removeAt(i).$3.dispose()),
                    icon: Icon(Icons.close, size: 18, color: Colors.red.shade600),
                  ),
                ]),
              ),
            Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Expanded(
                child: TextField(
                  controller: _draft,
                  onChanged: (_) => setState(() => _draftError = null),
                  onSubmitted: (_) => _addDraft(),
                  textInputAction: TextInputAction.done,
                  decoration: fieldDecoration('Шинэ утга', error: _draftError).copyWith(isDense: true),
                ),
              ),
              const SizedBox(width: 8),
              IconButton.filledTonal(onPressed: _addDraft, icon: const Icon(Icons.add)),
            ]),
            if (valuesError != null)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(valuesError, style: TextStyle(color: Colors.red.shade700, fontSize: 13)),
              ),
          ]),
        ),
      ]),
    );
  }
}
