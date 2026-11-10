import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../api/admin_manage_models.dart';
import '../../state/admin_state.dart';
import '../common.dart';
import 'admin_widgets.dart';
import 'attrs_page.dart';

/// [parent]-ийн доор дэд категори нэмбэл түвшний хязгаарт багтах эсэх.
bool _canNestUnder(AdminCategory parent) => parent.depth + 2 <= maxCategoryDepth;

/// [moving]-ийг (доорх бүхнээр нь) [target]-ийн доор (null бол дээд түвшинд) шилжүүлж болох эсэх.
bool _canMoveUnder(AdminCategory moving, AdminCategory? target) {
  if (target == null) return true;
  if (moving.contains(target.id)) return false;
  return target.depth + moving.height <= maxCategoryDepth - 1;
}

/// web-ийн /categories: категорийн мод. Мөр бүрээс засах, дэд категори нэмэх,
/// дээш/доош зөөх, өөр категори руу шилжүүлэх, устгах.
class CategoriesPage extends StatefulWidget {
  const CategoriesPage({super.key});
  @override
  State<CategoriesPage> createState() => _CategoriesPageState();
}

class _CategoriesPageState extends State<CategoriesPage> {
  List<AdminCategory>? _tree;
  Object? _error;
  final Set<int> _expanded = {};
  bool _busy = false;

  List<AdminCategory> get _flat => _tree == null ? [] : flattenCategories(_tree!);

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final tree = await context.read<AdminState>().categoryTree();
      if (mounted) {
        setState(() {
          _tree = tree;
          _error = null;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _error = e);
    }
  }

  Future<void> _openForm({AdminCategory? category, int? parentId}) async {
    final saved = await Navigator.of(context).push<bool>(MaterialPageRoute(
      builder: (_) => CategoryFormPage(category: category, parentId: parentId, categories: _flat),
    ));
    if (saved == true) _load();
  }

  Future<void> _withBusy(Future<bool> Function() fn) async {
    setState(() => _busy = true);
    final ok = await fn();
    if (ok) await _load();
    if (mounted) setState(() => _busy = false);
  }

  Future<void> _delete(AdminCategory c) async {
    final ok = await confirmAction(context,
        title: 'Категори устгах уу?',
        description: '“${c.name}” категорийг устгана.'
            '${c.children.isNotEmpty ? ' Энэ категори ${c.children.length} дэд категоритой.' : ''} Буцаах боломжгүй.',
        confirmLabel: 'Устгах',
        danger: true);
    if (!ok || !mounted) return;
    await _withBusy(() => runAction(context, () => context.read<AdminState>().deleteCategory(c.id), 'Категорийг устгалаа'));
  }

  List<AdminCategory> _siblingsOf(AdminCategory c) {
    final byId = {for (final x in _flat) x.id: x};
    return c.parentId == null ? _tree! : (byId[c.parentId]?.children ?? []);
  }

  /// Ижил эцгийн дотор нэг байр дээш/доош.
  Future<void> _shift(AdminCategory c, int dir) async {
    final siblings = _siblingsOf(c);
    final i = siblings.indexWhere((s) => s.id == c.id);
    final target = i + dir;
    if (target < 0 || target >= siblings.length) return;
    await _withBusy(
        () => runAction(context, () => context.read<AdminState>().moveCategory(c.id, c.parentId, target), 'Категорийг шилжүүллээ'));
  }

  /// Өөр эцэг рүү (эсвэл дээд түвшин рүү) шилжүүлж, төгсгөлд нь байрлуулна.
  Future<void> _moveTo(AdminCategory c) async {
    final flat = _flat;
    final options = flat.where((t) => t.id != c.parentId && _canMoveUnder(c, t)).toList();
    final picked = await showModalBottomSheet<({AdminCategory? target})>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (ctx) => ConstrainedBox(
        constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(ctx).height * 0.75),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
            child: Text('“${c.name}”-г хаана шилжүүлэх вэ?', style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
          ),
          Flexible(
            child: ListView(shrinkWrap: true, children: [
              if (c.parentId != null)
                ListTile(
                  leading: const Icon(Icons.vertical_align_top),
                  title: const Text('Дээд түвшин', style: TextStyle(fontWeight: FontWeight.bold)),
                  onTap: () => Navigator.pop(ctx, (target: null)),
                ),
              for (final t in options)
                ListTile(
                  contentPadding: EdgeInsets.only(left: 16 + t.depth * 20.0, right: 16),
                  leading: Icon(t.isLeaf ? Icons.label_outline : Icons.folder_outlined, size: 20),
                  title: Text(t.name, style: TextStyle(fontWeight: t.depth == 0 ? FontWeight.bold : FontWeight.w500)),
                  onTap: () => Navigator.pop(ctx, (target: t)),
                ),
            ]),
          ),
        ]),
      ),
    );
    if (picked == null || !mounted) return;
    final parent = picked.target;
    // Навч анхны дэд категоритой болбол өөрийн сонголтуудаа алдана.
    if (parent != null && parent.isLeaf && parent.attrs.isNotEmpty) {
      final ok = await confirmAction(context,
          title: 'Категори шилжүүлэх үү?',
          description: '“${parent.name}” дэд категоритой болох тул түүний сонголтууд (өнгө, хэмжээ…) устна.',
          confirmLabel: 'Шилжүүлэх');
      if (!ok || !mounted) return;
    }
    final index = (parent?.children ?? _tree!).where((x) => x.id != c.id).length;
    await _withBusy(() => runAction(
        context, () => context.read<AdminState>().moveCategory(c.id, parent?.id, index), 'Категорийг шилжүүллээ'));
    if (parent != null && mounted) setState(() => _expanded.add(parent.id));
  }

  @override
  Widget build(BuildContext context) {
    final flat = _flat;
    final byId = {for (final c in flat) c.id: c};
    bool shown(AdminCategory c) {
      final p = c.parentId == null ? null : byId[c.parentId];
      return p == null || (_expanded.contains(p.id) && shown(p));
    }

    final visible = flat.where(shown).toList();
    return Scaffold(
      appBar: AppBar(
        title: const Text('Категори'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: FilledButton.icon(onPressed: () => _openForm(), icon: const Icon(Icons.add), label: const Text('Нэмэх')),
          ),
        ],
      ),
      body: Stack(children: [
        RefreshIndicator(
          onRefresh: _load,
          child: AsyncList<AdminCategory>(
            data: _tree == null ? null : visible,
            error: _error,
            onRetry: _load,
            emptyIcon: Icons.grid_view,
            emptyText: 'Категори алга\n“Нэмэх” товчоор шинэ категори нэмнэ үү.',
            builder: (rows) => ListView.separated(
              itemCount: rows.length,
              separatorBuilder: (_, _) => const Divider(height: 1),
              itemBuilder: (_, i) => _row(rows[i]),
            ),
          ),
        ),
        if (_busy)
          const Positioned.fill(
            child: ColoredBox(color: Colors.black26, child: Center(child: CircularProgressIndicator(color: Colors.white))),
          ),
      ]),
    );
  }

  Widget _row(AdminCategory c) {
    final open = _expanded.contains(c.id);
    final hasKids = c.children.isNotEmpty;
    final siblings = _siblingsOf(c);
    final idx = siblings.indexWhere((s) => s.id == c.id);
    void toggle() => setState(() => open ? _expanded.remove(c.id) : _expanded.add(c.id));

    return Material(
      color: Colors.white,
      child: InkWell(
        onTap: hasKids ? toggle : null,
        child: Padding(
          padding: EdgeInsets.only(left: 8 + c.depth * 20.0, right: 4, top: 6, bottom: 6),
          child: Row(children: [
            SizedBox(
              width: 36,
              child: hasKids
                  ? IconButton(
                      visualDensity: VisualDensity.compact,
                      tooltip: open ? 'Хураах' : 'Дэлгэх',
                      onPressed: toggle,
                      icon: AnimatedRotation(turns: open ? 0.25 : 0, duration: const Duration(milliseconds: 150), child: const Icon(Icons.chevron_right)),
                    )
                  : null,
            ),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(c.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 15, fontWeight: c.depth == 0 ? FontWeight.bold : FontWeight.w600)),
                Text(
                  hasKids ? '${c.children.length} дэд категори' : attrsSummary(c.attrs.map((a) => a.name).toList()),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 12,
                    color: !hasKids && c.attrs.isNotEmpty ? brandColor : Colors.grey.shade600,
                    fontWeight: !hasKids && c.attrs.isNotEmpty ? FontWeight.w600 : null,
                  ),
                ),
              ]),
            ),
            IconButton.outlined(
              tooltip: 'Засах',
              visualDensity: VisualDensity.compact,
              onPressed: () => _openForm(category: c),
              icon: const Icon(Icons.edit_outlined, size: 18),
            ),
            PopupMenuButton<String>(
              tooltip: 'Бусад',
              onSelected: (v) => switch (v) {
                'sub' => _openForm(parentId: c.id),
                'up' => _shift(c, -1),
                'down' => _shift(c, 1),
                'move' => _moveTo(c),
                'delete' => _delete(c),
                _ => null,
              },
              itemBuilder: (_) => [
                if (_canNestUnder(c))
                  const PopupMenuItem(value: 'sub', child: ListTile(leading: Icon(Icons.add), title: Text('Дэд категори нэмэх'))),
                PopupMenuItem(
                    value: 'up', enabled: idx > 0, child: const ListTile(leading: Icon(Icons.arrow_upward), title: Text('Дээш зөөх'))),
                PopupMenuItem(
                    value: 'down',
                    enabled: idx < siblings.length - 1,
                    child: const ListTile(leading: Icon(Icons.arrow_downward), title: Text('Доош зөөх'))),
                const PopupMenuItem(value: 'move', child: ListTile(leading: Icon(Icons.drive_file_move_outline), title: Text('Шилжүүлэх'))),
                PopupMenuItem(
                  value: 'delete',
                  child: ListTile(
                    leading: Icon(Icons.delete_outline, color: Colors.red.shade600),
                    title: Text('Устгах', style: TextStyle(color: Colors.red.shade600)),
                  ),
                ),
              ],
            ),
          ]),
        ),
      ),
    );
  }
}

/// Категори нэмэх / засах: нэр, эцэг (зөвхөн харах), барааны сонголт (хамгийн сүүлийн түвшинд).
class CategoryFormPage extends StatefulWidget {
  final AdminCategory? category;
  final int? parentId;
  final List<AdminCategory> categories;
  const CategoryFormPage({super.key, this.category, this.parentId, required this.categories});
  @override
  State<CategoryFormPage> createState() => _CategoryFormPageState();
}

class _CategoryFormPageState extends State<CategoryFormPage> {
  late final _name = TextEditingController(text: widget.category?.name ?? '');
  List<AttrRecord>? _catalogue;
  Object? _catalogueError;
  List<int> _attrs = [];
  List<int> _savedAttrs = [];
  bool _nameTouched = false;
  bool _saving = false;

  int? get _parentId => widget.category != null ? widget.category!.parentId : widget.parentId;
  AdminCategory? get _parent => widget.categories.where((c) => c.id == _parentId).firstOrNull;
  bool get _isLeaf => widget.category == null || widget.category!.isLeaf;

  @override
  void initState() {
    super.initState();
    _loadCatalogue();
  }

  Future<void> _loadCatalogue() async {
    setState(() => _catalogueError = null);
    try {
      final list = await context.read<AdminState>().attrsFull();
      if (!mounted) return;
      final c = widget.category;
      // Каталогоос устсан үзүүлэлтийг хасна — унтраах карт нь байхгүй.
      final initial = c != null && _isLeaf ? c.attrs.map((a) => a.id).where((id) => list.any((a) => a.id == id)).toList() : <int>[];
      setState(() {
        _catalogue = list;
        _attrs = [...initial];
        _savedAttrs = initial;
      });
    } catch (e) {
      if (mounted) setState(() => _catalogueError = e);
    }
  }

  @override
  void dispose() {
    _name.dispose();
    super.dispose();
  }

  bool get _dirty => _name.text != (widget.category?.name ?? '') || _attrs.join(',') != _savedAttrs.join(',');

  void _toggle(int id) => setState(() {
        if (_attrs.contains(id)) {
          _attrs.remove(id);
        } else if (_attrs.length < maxCategoryAttrs) {
          _attrs.add(id);
        }
      });

  Future<void> _save() async {
    setState(() => _nameTouched = true);
    if (_name.text.trim().isEmpty) return;
    final admin = context.read<AdminState>();
    final attrs = _isLeaf ? _attrs : <int>[];
    setState(() => _saving = true);
    final saved = await runAction(context, () async {
      final c = widget.category;
      if (c == null) {
        await admin.createCategory(_name.text.trim(), _parentId, attrs);
        await admin.releaseParentAttrs(_parent);
      } else {
        await admin.updateCategory(c, name: _name.text.trim(), parentId: _parentId, attrIds: attrs);
      }
    }, widget.category == null ? 'Категори нэмлээ' : 'Хадгаллаа');
    if (!mounted) return;
    if (saved) {
      Navigator.pop(context, true);
    } else {
      setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = widget.category;
    final title = c != null ? 'Категори засах' : (_parentId != null ? 'Дэд категори нэмэх' : 'Категори нэмэх');
    final nameOf = {for (final a in _catalogue ?? <AttrRecord>[]) a.id: a.name};
    return Scaffold(
      appBar: AppBar(title: Text(title), actions: [SaveAction(enabled: _dirty, busy: _saving, onPressed: _save)]),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        TextField(
          controller: _name,
          onChanged: (_) => setState(() {}),
          onEditingComplete: () => setState(() => _nameTouched = true),
          decoration: fieldDecoration('Нэр', error: _nameTouched && _name.text.trim().isEmpty ? 'Категорийн нэр оруулна уу' : null),
        ),
        if (c != null || _parent != null) ...[
          const SizedBox(height: 14),
          TextField(
            enabled: false,
            controller: TextEditingController(text: _parent?.name ?? 'Дээд түвшин'),
            decoration: fieldDecoration('Эцэг категори'),
          ),
        ],
        const SizedBox(height: 16),
        Panel(
          padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Барааны сонголт', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
            const SizedBox(height: 2),
            Text(
              _isLeaf
                  ? 'Худалдан авагч юугаар нь сонгож авах вэ? Бараа бүртгэхэд эдгээрийг оруулах хэсэг гарна.'
                  : 'Дэд категоритой тул сонголтыг хамгийн сүүлийн түвшний дэд категориуд дээр нь сонгоно.',
              style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
            ),
            if (_isLeaf) ...[
              const SizedBox(height: 12),
              if (_catalogue == null)
                _catalogueError != null
                    ? ErrorView(_catalogueError!, onRetry: _loadCatalogue)
                    : const Padding(padding: EdgeInsets.all(12), child: LinearProgressIndicator())
              else if (_catalogue!.isEmpty)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: mutedColor, borderRadius: BorderRadius.circular(12)),
                  child: Text('Сонголтын жагсаалт хоосон байна.', style: TextStyle(color: Colors.grey.shade600)),
                )
              else
                LayoutBuilder(
                  builder: (_, box) => Wrap(spacing: 8, runSpacing: 8, children: [
                    for (final a in _catalogue!) _attrCard(a, (box.maxWidth - 8) / 2),
                  ]),
                ),
              const SizedBox(height: 10),
              Wrap(crossAxisAlignment: WrapCrossAlignment.center, children: [
                Text('Дарсан дарааллаар нь оруулна. Хамгийн ихдээ $maxCategoryAttrs сонголт. Шинэ сонголтыг ',
                    style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                InkWell(
                  onTap: () async {
                    await Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AttrsPage()));
                    _loadCatalogue();
                  },
                  child: const Text('Үзүүлэлт',
                      style: TextStyle(fontSize: 12, color: brandColor, fontWeight: FontWeight.w600, decoration: TextDecoration.underline)),
                ),
                Text(' хэсэгт нэмнэ.', style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
              ]),
              const SizedBox(height: 10),
              // Бараа бүртгэх маягт юу асуухыг харуулна.
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: accentColor, borderRadius: BorderRadius.circular(12)),
                child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Icon(Icons.check, size: 18, color: brandColor),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _attrs.isEmpty
                        ? const Text.rich(TextSpan(children: [
                            TextSpan(text: 'Сонголтгүй', style: TextStyle(fontWeight: FontWeight.bold)),
                            TextSpan(text: ' — бараа нэг л хувилбартай, зөвхөн тоо ширхэгээ оруулна (ж: хүнс, ном).'),
                          ]))
                        : Text.rich(TextSpan(children: [
                            const TextSpan(text: 'Бараа бүртгэхэд: '),
                            TextSpan(
                              text: '${_attrs.map((id) => '${nameOf[id] ?? '#$id'} сонгох').join(' → ')} → тоо, үнэ',
                              style: const TextStyle(fontWeight: FontWeight.bold),
                            ),
                          ])),
                  ),
                ]),
              ),
            ],
          ]),
        ),
      ]),
    );
  }

  Widget _attrCard(AttrRecord a, double width) {
    final order = _attrs.indexOf(a.id);
    final on = order != -1;
    final disabled = !on && _attrs.length >= maxCategoryAttrs;
    return SizedBox(
      width: width,
      child: Opacity(
        opacity: disabled ? 0.45 : 1,
        child: Material(
          color: on ? accentColor : Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: BorderSide(color: on ? brandColor : borderColor),
          ),
          child: InkWell(
            borderRadius: BorderRadius.circular(12),
            onTap: disabled ? null : () => _toggle(a.id),
            child: Padding(
              padding: const EdgeInsets.all(10),
              child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Container(
                  width: 20,
                  height: 20,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: on ? brandColor : null,
                    border: Border.all(color: on ? brandColor : Colors.grey.shade400),
                  ),
                  child: on
                      ? Text('${order + 1}', style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold))
                      : null,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(a.name, style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: on ? brandColor : null)),
                    Text(a.preview, style: TextStyle(fontSize: 12, color: Colors.grey.shade600, height: 1.25)),
                  ]),
                ),
              ]),
            ),
          ),
        ),
      ),
    );
  }
}
