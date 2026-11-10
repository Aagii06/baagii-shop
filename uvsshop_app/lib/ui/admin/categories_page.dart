import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../api/admin_manage_models.dart';
import '../../state/admin_state.dart';
import '../common.dart';
import 'admin_design.dart';
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

/// Чирсэн категорийг хаана тавих вэ: мөрийн дээр/доор/дотор, эсвэл дээд түвшинд (`id == null`).
typedef _Drop = ({int? id, String place});

/// web-ийн /categories: категорийн мод. Бариулаас нь чирж дээр/доор/дотор нь
/// тавьж зөөнө; мөр бүрээс засах, дэд категори нэмэх, устгах.
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
  final Set<int> _deleting = {};

  /// Чирж буй категори ба одоо хаана тавигдах гэж байгаа.
  AdminCategory? _dragging;
  _Drop? _over;

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

  Future<void> _delete(AdminCategory c) async {
    final ok = await confirmAction(context,
        title: 'Категори устгах уу?',
        description: '“${c.name}” категорийг устгана.'
            '${c.children.isNotEmpty ? ' Энэ категори ${c.children.length} дэд категоритой.' : ''} Буцаах боломжгүй.',
        confirmLabel: 'Устгах',
        danger: true);
    if (!ok || !mounted) return;
    setState(() => _deleting.add(c.id));
    final done = await runAction(context, () => context.read<AdminState>().deleteCategory(c.id), 'Категорийг устгалаа');
    if (!mounted) return;
    setState(() => _deleting.remove(c.id));
    if (done) _load();
  }

  /// Тавих газрын шинэ эцэг (null = дээд түвшин) ба ах дүүсийн дундах байр; юу ч өөрчлөгдөхгүй бол null.
  ({AdminCategory? parent, int index})? _placement(AdminCategory dragged, _Drop drop) {
    final byId = {for (final c in _flat) c.id: c};
    List<AdminCategory> childrenOf(AdminCategory? p) => (p?.children ?? _tree!).where((c) => c.id != dragged.id).toList();
    AdminCategory? parent;
    int index;
    if (drop.id == null) {
      parent = null;
      index = childrenOf(null).length;
    } else {
      final target = byId[drop.id];
      if (target == null || target.id == dragged.id) return null;
      if (drop.place == 'inside') {
        parent = target;
        index = _expanded.contains(target.id) ? 0 : childrenOf(target).length;
      } else {
        parent = target.parentId == null ? null : byId[target.parentId];
        index = childrenOf(parent).indexWhere((c) => c.id == target.id) + (drop.place == 'after' ? 1 : 0);
      }
    }
    if (parent != null && !_canMoveUnder(dragged, parent)) return null;
    final current = (parent?.children ?? _tree!).indexWhere((c) => c.id == dragged.id);
    if (parent?.id == dragged.parentId && current == index) return null;
    return (parent: parent, index: index);
  }

  /// Хуруу [local] байрлалд байхад [target] мөрөнд хаана тавигдах вэ.
  _Drop? _dropAt(AdminCategory dragged, AdminCategory target, double at) {
    // Хамгийн доод түвшин дэд категори авахгүй — хоёр хуваана.
    final nests = _canMoveUnder(dragged, target);
    var place = nests ? (at < 0.25 ? 'before' : (at > 0.75 ? 'after' : 'inside')) : (at < 0.5 ? 'before' : 'after');
    // Нээлттэй эцгийн доор гэдэг нь эхний хүүхдийнх нь дээр — дотор нь тавина.
    if (place == 'after' && _expanded.contains(target.id) && nests) place = 'inside';
    final drop = (id: target.id, place: place);
    return _placement(dragged, drop) == null ? null : drop;
  }

  Future<void> _onDrop(AdminCategory c, _Drop drop) async {
    final spot = _placement(c, drop);
    if (spot == null) return;
    final parent = spot.parent;
    if (parent != null && parent.id != c.parentId && parent.isLeaf && parent.attrs.isNotEmpty) {
      final ok = await confirmAction(context,
          title: 'Категори шилжүүлэх үү?',
          description: '“${parent.name}” дэд категоритой болох тул түүний сонголтууд (өнгө, хэмжээ…) устна.',
          confirmLabel: 'Шилжүүлэх');
      if (!ok || !mounted) return;
    }
    setState(() => _busy = true);
    final moved = await runAction(
        context, () => context.read<AdminState>().moveCategory(c.id, parent?.id, spot.index), 'Категорийг шилжүүллээ');
    if (moved) {
      // Хаашаа орсныг харуулна.
      if (parent != null) _expanded.add(parent.id);
      await _load();
    }
    if (mounted) setState(() => _busy = false);
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
    final dragging = _dragging;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Категори'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: AdminSmallButton(label: 'Нэмэх', onPressed: () => _openForm()),
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
            builder: (rows) => ListView(padding: const EdgeInsets.only(bottom: 120), children: [AdminList(children: [for (final c in rows) _row(c)])]),
          ),
        ),
        // Энд тавибал дээд түвшин болно.
        if (dragging != null && dragging.parentId != null)
          Positioned(
            left: 16,
            right: 16,
            bottom: 24,
            child: DragTarget<AdminCategory>(
              onWillAcceptWithDetails: (_) => true,
              onMove: (_) {
                if (_over?.id != null || _over == null) setState(() => _over = (id: null, place: 'root'));
              },
              onLeave: (_) => setState(() => _over = null),
              onAcceptWithDetails: (d) => _onDrop(d.data, (id: null, place: 'root')),
              builder: (_, _, _) {
                final on = _over != null && _over!.id == null;
                return Container(
                  height: 56,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: on ? AdminColors.primarySoft : AdminColors.background.withValues(alpha: 0.95),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: on ? AdminColors.primary : AdminColors.border, width: 2),
                    boxShadow: const [BoxShadow(color: Color(0x1A000000), blurRadius: 12)],
                  ),
                  child: Text('Энд тавивал дээд түвшин болно',
                      style: TextStyle(fontWeight: FontWeight.w600, color: on ? AdminColors.primaryInk : AdminColors.mutedForeground)),
                );
              },
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
    void toggle() => setState(() => open ? _expanded.remove(c.id) : _expanded.add(c.id));
    final over = _over != null && _over!.id == c.id ? _over!.place : null;
    final isDragged = _dragging?.id == c.id;

    final content = Padding(
      padding: EdgeInsets.only(left: 8 + c.depth * 20.0, right: 12, top: 10, bottom: 10),
      child: Row(children: [
        SizedBox(
          width: 32,
          child: hasKids
              ? IconButton(
                  padding: EdgeInsets.zero,
                  tooltip: open ? 'Хураах' : 'Дэлгэх',
                  onPressed: toggle,
                  icon: AnimatedRotation(
                      turns: open ? 0.25 : 0,
                      duration: const Duration(milliseconds: 150),
                      child: const Icon(Icons.chevron_right, color: AdminColors.mutedForeground)),
                )
              : null,
        ),
        // Чирэх бариул.
        Draggable<AdminCategory>(
          data: c,
          dragAnchorStrategy: pointerDragAnchorStrategy,
          onDragStarted: () => setState(() => _dragging = c),
          onDragEnd: (_) => setState(() {
            _dragging = null;
            _over = null;
          }),
          feedback: FractionalTranslation(
            translation: const Offset(-0.5, -1.4),
            child: Material(
              color: AdminColors.foreground,
              shape: const StadiumBorder(),
              elevation: 6,
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 240),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Text(c.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600)),
                ),
              ),
            ),
          ),
          child: const SizedBox(
            width: 32,
            height: 40,
            child: Icon(Icons.drag_indicator, color: AdminColors.mutedForeground),
          ),
        ),
        Expanded(
          child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: hasKids ? toggle : null,
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(c.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontSize: 15, fontWeight: c.depth == 0 ? FontWeight.bold : FontWeight.w600)),
              const SizedBox(height: 2),
              Text(
                hasKids ? '${c.children.length} дэд категори' : attrsSummary(c.attrs.map((a) => a.name).toList()),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 12,
                  color: !hasKids && c.attrs.isNotEmpty ? AdminColors.primaryInk : AdminColors.mutedForeground,
                  fontWeight: !hasKids && c.attrs.isNotEmpty ? FontWeight.w600 : null,
                ),
              ),
            ]),
          ),
        ),
        _iconBtn(Icons.edit_outlined, 'Засах', () => _openForm(category: c),
            bg: Colors.white, fg: AdminColors.foreground, border: AdminColors.border),
        const SizedBox(width: 6),
        // Хамгийн доод түвшин дэд категори авахгүй — товчнууд эгнээндээ үлдэнэ.
        _canNestUnder(c)
            ? _iconBtn(Icons.add, 'Дэд категори нэмэх', () => _openForm(parentId: c.id),
                bg: AdminColors.primarySoft, fg: AdminColors.primaryInk)
            : const SizedBox(width: 36),
        const SizedBox(width: 6),
        _deleting.contains(c.id)
            ? const SizedBox(width: 36, height: 36, child: Padding(padding: EdgeInsets.all(9), child: CircularProgressIndicator(strokeWidth: 2)))
            : _iconBtn(Icons.delete_outline, 'Устгах', () => _delete(c),
                bg: AdminColors.destructive.withValues(alpha: 0.1), fg: AdminColors.destructive),
      ]),
    );

    return _DropRow(
      onMove: (at) {
        final d = _dragging;
        if (d == null) return;
        final drop = _dropAt(d, c, at);
        if (drop?.id != _over?.id || drop?.place != _over?.place) setState(() => _over = drop);
      },
      onLeave: () {
        if (_over?.id == c.id) setState(() => _over = null);
      },
      onDrop: (dragged) {
        final drop = _over;
        if (drop != null && drop.id == c.id) _onDrop(dragged, drop);
      },
      child: Stack(children: [
        AnimatedOpacity(
          duration: const Duration(milliseconds: 120),
          opacity: isDragged ? 0.4 : 1,
          child: Container(
            decoration: over == 'inside'
                ? BoxDecoration(color: AdminColors.primarySoft, border: Border.all(color: AdminColors.primary, width: 2))
                : const BoxDecoration(color: Colors.white),
            child: content,
          ),
        ),
        // Тавигдах зураас — энэ мөрийн догол дээр.
        if (over == 'before' || over == 'after')
          Positioned(
            left: 16 + c.depth * 20.0,
            right: 16,
            top: over == 'before' ? 0 : null,
            bottom: over == 'after' ? 0 : null,
            child: Container(height: 2.5, decoration: BoxDecoration(color: AdminColors.primary, borderRadius: BorderRadius.circular(2))),
          ),
      ]),
    );
  }

  Widget _iconBtn(IconData icon, String tooltip, VoidCallback onTap, {required Color bg, required Color fg, Color? border}) => Tooltip(
        message: tooltip,
        child: Material(
          color: bg,
          shape: CircleBorder(side: border == null ? BorderSide.none : BorderSide(color: border)),
          child: InkWell(
            customBorder: const CircleBorder(),
            onTap: onTap,
            child: SizedBox(width: 36, height: 36, child: Icon(icon, size: 17, color: fg)),
          ),
        ),
      );
}

/// Чирсэн категорийг хүлээн авах мөр: хуруу мөрийн аль өндөрт (0–1) байгааг [onMove]-д өгнө.
class _DropRow extends StatefulWidget {
  final Widget child;
  final ValueChanged<double> onMove;
  final VoidCallback onLeave;
  final ValueChanged<AdminCategory> onDrop;
  const _DropRow({required this.child, required this.onMove, required this.onLeave, required this.onDrop});
  @override
  State<_DropRow> createState() => _DropRowState();
}

class _DropRowState extends State<_DropRow> {
  @override
  Widget build(BuildContext context) => DragTarget<AdminCategory>(
        onWillAcceptWithDetails: (_) => true,
        onMove: (d) {
          final box = context.findRenderObject() as RenderBox?;
          if (box == null || !box.hasSize) return;
          widget.onMove((box.globalToLocal(d.offset).dy / box.size.height).clamp(0.0, 1.0));
        },
        onLeave: (_) => widget.onLeave(),
        onAcceptWithDetails: (d) => widget.onDrop(d.data),
        builder: (_, _, _) => widget.child,
      );
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
