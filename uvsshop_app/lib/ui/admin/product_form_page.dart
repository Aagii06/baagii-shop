import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../../api/admin_manage_models.dart';
import '../../config.dart';
import '../../state/admin_state.dart';
import '../../state/product_draft.dart';
import '../common.dart';
import 'admin_design.dart';
import 'admin_widgets.dart';

// web-ийн /products/new ба /products/{id} (ProductForm) болон
// /products/{id}/variants (ProductVariantsForm) — ижил талбар, дараалал.

final _digits = [FilteringTextInputFormatter.digitsOnly];

/// "Өнгө, хувцасны хэмжээ үсэг" — эсвэл "Сонголтгүй".
String _attrsTitle(List<PAttr> attrs) => attrsSummary([for (final a in attrs) a.name]);

Color? _hex(String? v) {
  final h = v?.replaceFirst('#', '');
  if (h == null || h.length != 6) return null;
  final n = int.tryParse(h, radix: 16);
  return n == null ? null : Color(0xFF000000 | n);
}

/// Өнгөний дугуй; hex байхгүй бол зураасан.
class Swatch extends StatelessWidget {
  final String? color;
  final double size;
  const Swatch(this.color, {super.key, this.size = 16});

  @override
  Widget build(BuildContext context) => Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: _hex(color) ?? AdminColors.muted,
          border: Border.all(color: Colors.black.withValues(alpha: 0.15)),
        ),
      );
}

/// Бараа нэмэх ([productId] null) эсвэл засах.
class ProductFormPage extends StatefulWidget {
  final int? productId;
  const ProductFormPage({super.key, this.productId});
  @override
  State<ProductFormPage> createState() => _ProductFormPageState();
}

class _ProductFormPageState extends State<ProductFormPage> {
  ProductDraft? _draft;
  List<Store> _stores = [];
  Object? _error;
  bool _notFound = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _error = null);
    final admin = context.read<AdminState>();
    try {
      final results = await Future.wait([
        widget.productId == null ? Future.value(null) : admin.productRaw(widget.productId!),
        admin.categoryTree(),
        admin.attrsFull(),
        (admin.user?.isAdmin ?? false) ? admin.stores() : Future.value(<Store>[]),
      ]);
      if (!mounted) return;
      final raw = results[0] as Map<String, dynamic>?;
      if (widget.productId != null && raw == null) return setState(() => _notFound = true);
      setState(() {
        _stores = results[3] as List<Store>;
        _draft = ProductDraft(
          product: raw,
          categories: flattenCategories(results[1] as List<AdminCategory>),
          catalogue: results[2] as List<AttrRecord>,
        );
      });
    } catch (e) {
      if (mounted) setState(() => _error = e);
    }
  }

  @override
  Widget build(BuildContext context) {
    final draft = _draft;
    if (draft == null) {
      return Scaffold(
        appBar: AppBar(title: Text(widget.productId == null ? 'Бараа нэмэх' : 'Бараа засах')),
        body: _notFound
            ? EmptyView(icon: Icons.inventory_2_outlined, text: 'Бараа олдсонгүй\n#${widget.productId} дугаартай бараа байхгүй байна.')
            : _error != null
                ? ErrorView(_error!, onRetry: _load)
                : const LoadingView(kind: SkeletonKind.detail),
      );
    }
    return ChangeNotifierProvider.value(value: draft, child: _ProductForm(stores: _stores));
  }
}

class _ProductForm extends StatefulWidget {
  final List<Store> stores;
  const _ProductForm({required this.stores});
  @override
  State<_ProductForm> createState() => _ProductFormState();
}

class _ProductFormState extends State<_ProductForm> {
  late final ProductDraft d = context.read<ProductDraft>();
  late final _name = TextEditingController(text: d.name);
  late final _price = TextEditingController(text: d.price);
  late final _sale = TextEditingController(text: d.salePrice);
  late final _note = TextEditingController(text: d.note);
  late final _qty = TextEditingController(text: d.variants.first.qty);
  bool _touchedName = false;
  bool _touchedPrice = false;
  bool _saveTried = false;
  bool _saving = false;
  bool _deleting = false;
  bool _changed = false;

  @override
  void dispose() {
    for (final c in [_name, _price, _sale, _note, _qty]) {
      c.dispose();
    }
    super.dispose();
  }

  bool _validateBasics() {
    setState(() {
      _touchedName = true;
      _touchedPrice = true;
    });
    return d.hasBasics;
  }

  Future<void> _save() async {
    setState(() => _saveTried = true);
    if (!_validateBasics() || d.salePriceError != null || d.salePeriodError != null || d.variantsError != null) return;
    final admin = context.read<AdminState>();
    setState(() => _saving = true);
    final uploads = {for (final r in d.pendingUploads) r: (d.files[r]!.bytes.toList(), d.files[r]!.name)};
    final ok = await runAction(context, () => admin.saveProduct(d.id, d.body, uploads), 'Хадгаллаа');
    if (!mounted) return;
    if (ok && d.id == null) return Navigator.pop(context, true);
    if (ok) {
      d.markSaved();
      _changed = true;
    }
    setState(() => _saving = false);
  }

  Future<void> _delete() async {
    final ok = await confirmAction(context,
        title: 'Бараа устгах уу?', description: '“${d.name}” барааг устгана. Буцаах боломжгүй.', confirmLabel: 'Устгах', danger: true);
    if (!ok || !mounted) return;
    setState(() => _deleting = true);
    final done = await runAction(context, () => context.read<AdminState>().deleteProduct(d.id!), 'Барааг устгалаа');
    if (!mounted) return;
    if (done) return Navigator.pop(context, true);
    setState(() => _deleting = false);
  }

  Future<void> _pickDate(bool start) async {
    final cur = DateTime.tryParse(start ? d.saleStart : d.saleEnd) ?? DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: cur,
      firstDate: start ? DateTime(2020) : (DateTime.tryParse(d.saleStart) ?? DateTime(2020)),
      lastDate: start ? (DateTime.tryParse(d.saleEnd) ?? DateTime(2100)) : DateTime(2100),
    );
    if (picked == null) return;
    final v = '${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}';
    d.update(() => start ? d.saleStart = v : d.saleEnd = v);
  }

  @override
  Widget build(BuildContext context) {
    context.watch<ProductDraft>();
    final admin = context.read<AdminState>();
    final isAdmin = admin.user?.isAdmin ?? false;
    final attrs = d.attrs;
    final variants = d.variants;
    final periodError = _saveTried || (d.saleStart.isNotEmpty && d.saleEnd.isNotEmpty) ? d.salePeriodError : null;
    final label = TextStyle(fontSize: 14, color: Colors.grey.shade600);

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) Navigator.of(context).pop(_changed);
      },
      child: Scaffold(
        appBar: AppBar(
          title: Text(d.id == null ? 'Бараа нэмэх' : 'Бараа засах'),
          actions: [SaveAction(enabled: d.dirty, busy: _saving, onPressed: _save)],
        ),
        body: ListView(padding: const EdgeInsets.fromLTRB(16, 16, 16, 32), children: [
          TextField(
            controller: _name,
            onChanged: (v) => d.update(() => d.name = v),
            onTapOutside: (_) {
              if (!_touchedName && _name.text.isNotEmpty) setState(() => _touchedName = true);
            },
            decoration: fieldDecoration('Нэр', error: _touchedName ? d.nameError : null),
          ),
          const SizedBox(height: 14),
          Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Expanded(
              child: TextField(
                controller: _price,
                keyboardType: TextInputType.number,
                inputFormatters: _digits,
                style: const TextStyle(fontFamily: mono),
                onChanged: (v) {
                  _touchedPrice = true;
                  d.setPrice(v);
                },
                decoration: fieldDecoration('Үнэ (₮)', error: _touchedPrice ? d.priceError : null),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: TextField(
                controller: _sale,
                keyboardType: TextInputType.number,
                inputFormatters: _digits,
                style: const TextStyle(fontFamily: mono),
                onChanged: d.setSalePrice,
                // Хоосон бол үнээрээ хадгалагдана.
                decoration: fieldDecoration('Хямдрал (₮)', hint: d.price, error: d.salePriceError),
              ),
            ),
          ]),
          if (d.onSale) ...[
            const SizedBox(height: 14),
            Panel(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('Хямдралын хугацаа', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                const SizedBox(height: 10),
                Row(children: [
                  Expanded(child: _dateField('Эхлэх өдөр', d.saleStart, () => _pickDate(true), periodError != null)),
                  const SizedBox(width: 12),
                  Expanded(child: _dateField('Дуусах өдөр', d.saleEnd, () => _pickDate(false), periodError != null)),
                ]),
                const SizedBox(height: 6),
                Text(periodError ?? 'Хугацаа дуусахад бараа үндсэн үнээрээ зарагдана.',
                    style: TextStyle(fontSize: 13, color: periodError != null ? AdminColors.destructive : Colors.grey.shade600)),
              ]),
            ),
          ],
          const SizedBox(height: 14),
          if (isAdmin)
            DropdownButtonFormField<int?>(
              initialValue: widget.stores.any((s) => s.id == d.storeId) ? d.storeId : null,
              isExpanded: true,
              decoration: fieldDecoration('Дэлгүүр', helper: 'Бараа аль дэлгүүрийнх вэ — вэб дээр брэнд болж харагдана'),
              items: [
                const DropdownMenuItem<int?>(value: null, child: Text('Үндсэн дэлгүүр (сонгоогүй)')),
                for (final s in widget.stores) DropdownMenuItem<int?>(value: s.id, child: Text(s.name, overflow: TextOverflow.ellipsis)),
              ],
              onChanged: (v) => d.update(() => d.storeId = v),
            )
          else
            // Худалдагчийн бараа үргэлж өөрийнх нь дэлгүүрт орно (backend тавина).
            TextField(
              enabled: false,
              controller: TextEditingController(text: admin.user?.storeName ?? 'Дэлгүүр оноогоогүй — админд хандана уу'),
              decoration: fieldDecoration('Дэлгүүр', helper: 'Таны нэмсэн бараа өөрийн тань дэлгүүрт орно'),
            ),
          const SizedBox(height: 14),
          _CategoryPicker(
            categories: d.categories,
            value: d.categoryId,
            onChanged: (id) => d.update(() => d.categoryId = id),
            hint: attrs.isNotEmpty
                ? null
                : d.categoryId != null
                    ? 'Энэ категорийн бараа сонголтгүй — зөвхөн тоо ширхэгээ оруулна.'
                    : 'Категори сонговол өнгө, хэмжээ зэрэг сонголтын хэсэг гарна.',
          ),
          if (!d.picked) ...[
            const SizedBox(height: 14),
            // Сонголт сонгоогүй: бараа нэг хувилбартай, тоо нь энд.
            TextField(
              controller: _qty,
              keyboardType: TextInputType.number,
              inputFormatters: _digits,
              style: const TextStyle(fontFamily: mono),
              onTap: () => _qty.selection = TextSelection(baseOffset: 0, extentOffset: _qty.text.length),
              onChanged: (v) => d.updateVariant(variants.first, qty: v),
              decoration: fieldDecoration('Тоо ширхэг',
                  hint: '0', helper: attrs.isNotEmpty ? '${_attrsTitle(attrs)} сонговол тоог тус бүрээр нь оруулна.' : null),
            ),
          ],
          if (attrs.isNotEmpty) ...[
            const SizedBox(height: 14),
            _variantsCard(attrs, variants),
            if (d.hasBasics && d.variantsError != null)
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 6, 20, 0),
                child: Text(d.variantsError!, style: const TextStyle(fontSize: 13, color: AdminColors.destructive)),
              ),
          ],
          const SizedBox(height: 18),
          // Сонголтын дараа: өнгө сонгосны дараа л өнгөнд зураг оруулна.
          const _ProductImages(),
          const SizedBox(height: 18),
          Text('Тайлбар', style: label),
          const SizedBox(height: 6),
          TextField(
            controller: _note,
            minLines: 4,
            maxLines: 12,
            onChanged: (v) => d.update(() => d.note = v),
            decoration: fieldDecoration('').copyWith(labelText: null),
          ),
          if (d.id != null) ...[
            const SizedBox(height: 24),
            FilledButton(
              style: FilledButton.styleFrom(
                backgroundColor: AdminColors.destructive.withValues(alpha: 0.1),
                foregroundColor: AdminColors.destructive,
                minimumSize: const Size.fromHeight(50),
              ),
              onPressed: _deleting ? null : _delete,
              child: _deleting
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Text('Барааг устгах'),
            ),
          ],
        ]),
      ),
    );
  }

  Widget _dateField(String label, String value, VoidCallback onTap, bool invalid) => InkWell(
        borderRadius: BorderRadius.circular(24),
        onTap: onTap,
        child: InputDecorator(
          decoration: fieldDecoration(label).copyWith(
            suffixIcon: const Icon(Icons.calendar_today_outlined, size: 18),
            enabledBorder: invalid
                ? OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: const BorderSide(color: AdminColors.destructive))
                : null,
          ),
          child: Text(value.isEmpty ? '—' : value.replaceAll('-', '.'), style: const TextStyle(fontFamily: mono)),
        ),
      );

  /// "Өнгө, хэмжээ, тоо оруулах" — нэр, үнэ бөглөсний дараа нээгдэнэ.
  Widget _variantsCard(List<PAttr> attrs, List<VariantRow> variants) {
    final icon = attrs.first.isColor ? Icons.palette_outlined : Icons.sell_outlined;
    final title = '${_attrsTitle(attrs)}, тоо оруулах';
    if (!d.hasBasics) {
      return Material(
        color: AdminColors.muted.withValues(alpha: 0.4),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: const BorderSide(color: AdminColors.border)),
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: _validateBasics,
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(children: [
              const CircleAvatar(radius: 20, backgroundColor: AdminColors.muted, child: Icon(Icons.lock_outline, size: 18, color: AdminColors.mutedForeground)),
              const SizedBox(width: 12),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AdminColors.mutedForeground)),
                  const Text('Эхлээд барааны нэр, үнээ оруулна уу', style: TextStyle(fontSize: 13, color: AdminColors.mutedForeground)),
                ]),
              ),
            ]),
          ),
        ),
      );
    }
    final sold = variants.where((r) => !r.off).toList();
    final total = sold.fold<int>(0, (s, r) => s + (int.tryParse(r.qty) ?? 0));
    return Panel(
      child: InkWell(
        onTap: () => Navigator.of(context).push(MaterialPageRoute(
          builder: (_) => ChangeNotifierProvider.value(value: d, child: const ProductVariantsPage()),
        )),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            CircleAvatar(radius: 20, backgroundColor: AdminColors.primarySoft, child: Icon(icon, size: 20, color: AdminColors.primaryInk)),
            const SizedBox(width: 12),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                for (final a in attrs)
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Text.rich(
                      TextSpan(children: [
                        TextSpan(text: '${a.name}: ', style: const TextStyle(color: AdminColors.mutedForeground)),
                        a.values.isEmpty
                            ? const TextSpan(text: 'сонгоогүй', style: TextStyle(color: AdminColors.mutedForeground))
                            : TextSpan(text: a.values.map((v) => v.value).join(', ')),
                      ]),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 13),
                    ),
                  ),
                const SizedBox(height: 4),
                Text(d.picked ? '${sold.length} хувилбар · нийт $total ширхэг' : 'Оруулаагүй',
                    style: const TextStyle(fontFamily: mono, fontSize: 12, color: AdminColors.mutedForeground)),
              ]),
            ),
            const Icon(Icons.chevron_right, color: AdminColors.mutedForeground),
          ]),
        ),
      ),
    );
  }
}

/// web-ийн CategoryPicker: түвшин бүрээр нэг dropdown; хамгийн сүүлийн түвшинд ✓.
class _CategoryPicker extends StatelessWidget {
  final List<AdminCategory> categories;
  final int? value;
  final ValueChanged<int?> onChanged;
  final String? hint;
  const _CategoryPicker({required this.categories, required this.value, required this.onChanged, this.hint});

  @override
  Widget build(BuildContext context) {
    final byId = {for (final c in categories) c.id: c};
    List<AdminCategory> childrenOf(int? parentId) => categories.where((c) => c.parentId == parentId).toList();
    final path = <AdminCategory>[];
    for (var c = value == null ? null : byId[value]; c != null; c = c.parentId == null ? null : byId[c.parentId]) {
      path.insert(0, c);
    }
    final selected = path.isEmpty ? null : path.last;
    final isLeaf = selected != null && childrenOf(selected.id).isEmpty;
    final levels = <(List<AdminCategory>, int?)>[];
    for (var i = 0; i <= path.length; i++) {
      final options = childrenOf(i == 0 ? null : path[i - 1].id);
      if (options.isNotEmpty) levels.add((options, i < path.length ? path[i].id : null));
    }
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      Text('Категори', style: TextStyle(fontSize: 14, color: Colors.grey.shade600)),
      const SizedBox(height: 6),
      for (final (i, (options, sel)) in levels.indexed)
        Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: DropdownButtonFormField<int?>(
            key: ValueKey('cat-$i-$sel-${options.length}'),
            initialValue: sel,
            isExpanded: true,
            decoration: fieldDecoration('').copyWith(labelText: null),
            items: [
              DropdownMenuItem<int?>(value: null, child: Text(i == 0 ? 'Сонгоогүй' : 'Дэд категори сонгох')),
              for (final c in options) DropdownMenuItem<int?>(value: c.id, child: Text(c.name, overflow: TextOverflow.ellipsis)),
            ],
            // Түвшинг цэвэрлэвэл дээд түвшин рүүгээ буцна.
            onChanged: (id) => onChanged(id ?? (i > 0 ? path[i - 1].id : null)),
          ),
        ),
      if (isLeaf)
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 20),
          child: Row(children: [
            Icon(Icons.check_circle_outline, size: 16, color: AdminColors.success),
            SizedBox(width: 6),
            Text('Категори сонгогдлоо', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AdminColors.success)),
          ]),
        )
      else if (hint != null)
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Text(hint!, style: const TextStyle(fontSize: 13, color: AdminColors.mutedForeground)),
        ),
    ]);
  }
}

/// web-ийн ProductImages: барааны ерөнхий зураг, өнгө сонгосон бол өнгө бүрийнх.
class _ProductImages extends StatefulWidget {
  const _ProductImages();
  @override
  State<_ProductImages> createState() => _ProductImagesState();
}

class _ProductImagesState extends State<_ProductImages> {
  String _group = '';

  Future<void> _add(ProductDraft d, String key) async {
    final List<XFile> files;
    try {
      files = await ImagePicker().pickMultiImage(maxWidth: 1600, maxHeight: 1600, imageQuality: 90);
    } catch (e) {
      if (mounted) showMessage(context, 'Зураг сонгож чадсангүй: $e', error: true);
      return;
    }
    final ok = <LocalImage>[];
    for (final f in files) {
      final bytes = await f.readAsBytes();
      if (bytes.length > maxImageMb * 1024 * 1024) {
        if (mounted) showMessage(context, '«${f.name}» зураг $maxImageMb MB-аас том байна', error: true);
        continue;
      }
      ok.add(LocalImage(bytes, f.name));
    }
    if (ok.isNotEmpty) d.addImages(key, ok);
  }

  @override
  Widget build(BuildContext context) {
    final d = context.watch<ProductDraft>();
    final colorAttr = d.attrs.where((a) => a.isColor).firstOrNull;
    final groups = <(String, String, String?)>[
      ('', 'Ерөнхий', null),
      if (colorAttr != null) for (final v in colorAttr.values) (imageKey(colorAttr.key, v.value), v.value, v.color),
    ];
    // Сонголтоос хасагдсан өнгө зургаа хадгалах ч tab-гүй болно.
    final group = groups.where((g) => g.$1 == _group).firstOrNull ?? groups.first;
    final list = d.images[group.$1] ?? [];
    final hint = colorAttr == null
        ? null
        : group.$1.isNotEmpty
            ? 'Худалдан авагч “${group.$2}” өнгийг сонгоход харагдана. Эхний зураг нь өнгөний нүүр зураг.'
            : groups.length > 1
                ? 'Өнгө сонгоогүй үед дэлгүүрт харагдана.'
                : 'Өнгө сонговол өнгө бүрт тусад нь зураг оруулж болно.';
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      Text('Зураг', style: TextStyle(fontSize: 14, color: Colors.grey.shade600)),
      if (groups.length > 1) ...[
        const SizedBox(height: 8),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(children: [
            for (final g in groups)
              Padding(
                padding: const EdgeInsets.only(right: 8),
                child: ChoiceChip(
                  showCheckmark: false,
                  avatar: g.$1.isEmpty ? null : Swatch(g.$3),
                  label: Text('${g.$2}${(d.images[g.$1]?.length ?? 0) > 0 ? ' (${d.images[g.$1]!.length})' : ''}'),
                  selected: g.$1 == group.$1,
                  onSelected: (_) => setState(() => _group = g.$1),
                ),
              ),
          ]),
        ),
      ],
      if (hint != null)
        Padding(
          padding: const EdgeInsets.fromLTRB(4, 8, 4, 0),
          child: Text(hint, style: const TextStyle(fontSize: 13, color: AdminColors.mutedForeground)),
        ),
      const SizedBox(height: 10),
      GridView.count(
        crossAxisCount: 3,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        mainAxisSpacing: 8,
        crossAxisSpacing: 8,
        children: [
          for (final (i, ref) in list.indexed)
            Stack(children: [
              Positioned.fill(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: d.files[ref] != null
                      ? Image.memory(d.files[ref]!.bytes, fit: BoxFit.cover)
                      : NetImage(fileUrl(ref, 'grid')),
                ),
              ),
              if (group.$1.isNotEmpty && i == 0)
                Positioned(
                  left: 6,
                  bottom: 6,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(color: Colors.black.withValues(alpha: 0.7), borderRadius: BorderRadius.circular(20)),
                    child: const Text('Нүүр', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                  ),
                ),
              Positioned(
                right: 6,
                top: 6,
                child: Material(
                  color: Colors.white.withValues(alpha: 0.9),
                  shape: const CircleBorder(),
                  child: InkWell(
                    customBorder: const CircleBorder(),
                    onTap: () => d.removeImage(group.$1, ref),
                    child: const SizedBox(width: 28, height: 28, child: Icon(Icons.close, size: 16)),
                  ),
                ),
              ),
            ]),
          InkWell(
            borderRadius: BorderRadius.circular(16),
            onTap: () => _add(d, group.$1),
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AdminColors.border),
                color: AdminColors.muted.withValues(alpha: 0.5),
              ),
              alignment: Alignment.center,
              child: const Text('+ зураг', style: TextStyle(fontFamily: mono, fontSize: 12, color: AdminColors.mutedForeground)),
            ),
          ),
        ],
      ),
    ]);
  }
}

/// web-ийн /products/{id}/variants: үзүүлэлт бүрийн утгуудыг сонгож, хослол бүрийн тоо, үнэ.
class ProductVariantsPage extends StatelessWidget {
  const ProductVariantsPage({super.key});

  @override
  Widget build(BuildContext context) {
    final d = context.watch<ProductDraft>();
    final attrs = d.attrs;
    final picked = attrs.where((a) => a.values.isNotEmpty).toList();
    final title = _attrsTitle(attrs);
    return Scaffold(
      appBar: AppBar(
        title: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(title, maxLines: 1, overflow: TextOverflow.ellipsis),
          if (d.name.trim().isNotEmpty)
            Text(d.name.trim(), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w400, color: AdminColors.mutedForeground)),
        ]),
        actions: [SaveAction(enabled: true, busy: false, label: 'Болсон', onPressed: () => Navigator.pop(context))],
      ),
      body: ListView(padding: const EdgeInsets.fromLTRB(16, 16, 16, 32), children: [
        for (final (i, a) in attrs.indexed) ...[
          _StepTitle(i + 1, '${a.name} сонгох'),
          if (!d.inCategory(a.key))
            // Өмнөх категорийн үлдсэн сонголт.
            Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.fromLTRB(12, 6, 6, 6),
              decoration: BoxDecoration(color: AdminColors.warningSoft, borderRadius: BorderRadius.circular(12)),
              child: Row(children: [
                Expanded(
                  child: Text('Энэ категорид “${a.name}” сонголт байхгүй.',
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                ),
                OutlinedButton(onPressed: () => d.setAttrValues(a.key, []), child: const Text('Хасах')),
              ]),
            ),
          _AttrPicker(attr: a),
          const SizedBox(height: 24),
        ],
        _StepTitle(attrs.length + 1, 'Тоо, үнэ'),
        if (picked.isEmpty)
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(color: AdminColors.muted, borderRadius: BorderRadius.circular(16)),
            child: Text('Дээрээс ${title.toLowerCase()} сонгоно уу.',
                textAlign: TextAlign.center, style: const TextStyle(fontSize: 13, color: AdminColors.mutedForeground)),
          )
        else
          _VariantTable(attrs: picked),
      ]),
    );
  }
}

class _StepTitle extends StatelessWidget {
  final int step;
  final String text;
  const _StepTitle(this.step, this.text);

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(left: 4, bottom: 10),
        child: Row(children: [
          Container(
            width: 24,
            height: 24,
            alignment: Alignment.center,
            decoration: const BoxDecoration(color: AdminColors.foreground, shape: BoxShape.circle),
            child: Text('$step', style: const TextStyle(fontFamily: mono, color: Colors.white, fontSize: 12)),
          ),
          const SizedBox(width: 8),
          Expanded(child: Text(text, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold))),
        ]),
      );
}

/// Үзүүлэлтийн утга сонгогч: каталогийн утгууд chip-ээр (өнгө бол swatch), гараар нэмэх.
class _AttrPicker extends StatefulWidget {
  final PAttr attr;
  const _AttrPicker({required this.attr});
  @override
  State<_AttrPicker> createState() => _AttrPickerState();
}

/// Өөр өнгө нэмэхэд сонгох өнгөнүүд.
const _palette = [
  '#000000', '#ffffff', '#9ca3af', '#7c1fa4', '#dc2626', '#f97316', '#facc15', '#16a34a', //
  '#0ea5e9', '#2563eb', '#db2777', '#92400e', '#f5f5dc', '#1e3a8a', '#065f46', '#c0c0c0',
];

class _AttrPickerState extends State<_AttrPicker> {
  final _draft = TextEditingController();
  String _hex = '#7c1fa4';

  @override
  void dispose() {
    _draft.dispose();
    super.dispose();
  }

  bool _has(List<PAttrValue> values, String v) => values.any((x) => valueKey(x.value) == valueKey(v));

  List<PAttrValue> _toggle(AttrRecord? def, List<PAttrValue> values, PAttrValue v) => _has(values, v.value)
      ? values.where((x) => valueKey(x.value) != valueKey(v.value)).toList()
      : ([...values, v]..sort((a, b) => valueRank(def, a.value).compareTo(valueRank(def, b.value))));

  @override
  Widget build(BuildContext context) {
    final d = context.watch<ProductDraft>();
    final attr = widget.attr;
    final def = d.catalogue.where((a) => a.id == attr.attrId).firstOrNull;
    // Каталогийн утгууд (сонгосон бол өөрийн өнгөтэй нь), дараа нь гараар нэмсэн утгууд.
    final offered = [
      for (final o in def?.values ?? <AttrValue>[])
        attr.values.where((v) => valueKey(v.value) == valueKey(o.name)).firstOrNull ?? PAttrValue(o.name, o.color, o.id),
      ...attr.values.where((v) => !(def?.values ?? []).any((o) => valueKey(o.name) == valueKey(v.value))),
    ];
    final allPicked = offered.every((v) => _has(attr.values, v.value));

    void add() {
      final value = _draft.text.trim();
      if (value.isEmpty) return;
      if (!_has(attr.values, value)) {
        d.setAttrValues(attr.key, _toggle(def, attr.values, PAttrValue(value, attr.isColor ? _hex : null, null)));
      }
      _draft.clear();
      setState(() {});
    }

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      if (offered.isNotEmpty) ...[
        Wrap(spacing: 8, runSpacing: 8, children: [
          for (final v in offered)
            () {
              final on = _has(attr.values, v.value);
              return Material(
                color: on ? AdminColors.primarySoft : Colors.transparent,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: BorderSide(color: on ? AdminColors.primary : AdminColors.border),
                ),
                child: InkWell(
                  borderRadius: BorderRadius.circular(12),
                  onTap: () => d.setAttrValues(attr.key, _toggle(def, attr.values, v)),
                  child: Container(
                    height: 44,
                    constraints: const BoxConstraints(minWidth: 72),
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    child: Row(mainAxisSize: MainAxisSize.min, mainAxisAlignment: MainAxisAlignment.center, children: [
                      if (attr.isColor) ...[Swatch(v.color), const SizedBox(width: 8)],
                      Text(v.value,
                          style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: on ? AdminColors.primaryInk : AdminColors.mutedForeground)),
                    ]),
                  ),
                ),
              );
            }(),
        ]),
        if (!attr.isColor && offered.length > 3)
          TextButton(
            onPressed: () => d.setAttrValues(attr.key, allPicked ? [] : offered),
            child: Text(allPicked ? 'Бүгдийг болих' : 'Бүгдийг сонгох'),
          ),
        const SizedBox(height: 10),
      ],
      Row(children: [
        if (attr.isColor) ...[
          // Шинэ өнгөний swatch — дарж өнгө сонгоно.
          InkWell(
            customBorder: const CircleBorder(),
            onTap: () async {
              final picked = await showModalBottomSheet<String>(
                context: context,
                showDragHandle: true,
                builder: (ctx) => Padding(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
                  child: Wrap(spacing: 12, runSpacing: 12, children: [
                    for (final c in _palette)
                      GestureDetector(onTap: () => Navigator.pop(ctx, c), child: Swatch(c, size: 40)),
                  ]),
                ),
              );
              if (picked != null) setState(() => _hex = picked);
            },
            child: Container(
              width: 44,
              height: 44,
              alignment: Alignment.center,
              decoration: BoxDecoration(shape: BoxShape.circle, color: Colors.white, border: Border.all(color: AdminColors.border)),
              child: Swatch(_hex, size: 24),
            ),
          ),
          const SizedBox(width: 8),
        ],
        Expanded(
          child: TextField(
            controller: _draft,
            onChanged: (_) => setState(() {}),
            onSubmitted: (_) => add(),
            decoration: fieldDecoration('').copyWith(labelText: null, hintText: attr.isColor ? 'Өөр өнгө нэмэх' : 'Өөр утга нэмэх'),
          ),
        ),
        const SizedBox(width: 8),
        OutlinedButton.icon(
          onPressed: _draft.text.trim().isEmpty ? null : add,
          icon: const Icon(Icons.add, size: 18),
          label: const Text('Нэмэх'),
        ),
      ]),
    ]);
  }
}

/// Хослол бүрийн тоо, үнэ, хямдрал; хасах/буцааж нэмэх.
class _VariantTable extends StatelessWidget {
  final List<PAttr> attrs;
  const _VariantTable({required this.attrs});

  @override
  Widget build(BuildContext context) {
    final d = context.watch<ProductDraft>();
    final variants = d.variants;
    final colorAttr = attrs.where((a) => a.isColor).firstOrNull;
    final sold = variants.where((r) => !r.off).toList();
    final total = sold.fold<int>(0, (s, r) => s + (int.tryParse(r.qty) ?? 0));
    String label(VariantRow r) => attrs.map((a) => r.values[a.key] ?? '').join(' - ');
    String? swatch(VariantRow r) =>
        colorAttr?.values.where((v) => valueKey(v.value) == valueKey(r.values[colorAttr.key] ?? '')).firstOrNull?.color;
    const head = TextStyle(fontSize: 12, color: AdminColors.mutedForeground);

    return Panel(
      padding: const EdgeInsets.fromLTRB(10, 12, 10, 12),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        const Row(children: [
          SizedBox(width: 72, child: Text('Тоо (ш)', textAlign: TextAlign.center, style: head)),
          SizedBox(width: 6),
          Expanded(child: Text('Үнэ (₮)', textAlign: TextAlign.center, style: head)),
          SizedBox(width: 6),
          Expanded(child: Text('Хямдрал (₮)', textAlign: TextAlign.center, style: head)),
        ]),
        for (final r in variants) ...[
          const SizedBox(height: 12),
          Row(children: [
            if (colorAttr != null) ...[Swatch(swatch(r), size: 14), const SizedBox(width: 6)],
            Expanded(
              child: Text(label(r),
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: r.off ? AdminColors.mutedForeground : null,
                    decoration: r.off ? TextDecoration.lineThrough : null,
                  )),
            ),
            IconButton(
              visualDensity: VisualDensity.compact,
              tooltip: r.off ? '${label(r)} — буцааж нэмэх' : '${label(r)} — хасах',
              onPressed: () => d.updateVariant(r, off: !r.off),
              icon: Icon(r.off ? Icons.undo : Icons.delete_outline, size: 18, color: AdminColors.mutedForeground),
            ),
          ]),
          const SizedBox(height: 4),
          if (r.off)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 10),
              alignment: Alignment.center,
              decoration: BoxDecoration(borderRadius: BorderRadius.circular(12), border: Border.all(color: AdminColors.border)),
              child: const Text('Зарахгүй', style: TextStyle(fontSize: 13, color: AdminColors.mutedForeground)),
            )
          else
            Row(children: [
              SizedBox(width: 72, child: _NumberCell(key: ValueKey('${r.key}-q'), value: r.qty, hint: '0', onChanged: (v) => d.updateVariant(r, qty: v))),
              const SizedBox(width: 6),
              Expanded(
                  child: _NumberCell(key: ValueKey('${r.key}-p'), value: r.price, hint: '0', onChanged: (v) => d.updateVariant(r, price: v))),
              const SizedBox(width: 6),
              Expanded(
                child: _NumberCell(
                  key: ValueKey('${r.key}-s'),
                  value: r.salePrice,
                  hint: r.price,
                  invalid: r.overPrice,
                  onChanged: (v) => d.updateVariant(r, salePrice: v),
                ),
              ),
            ]),
        ],
        const Divider(height: 28, color: AdminColors.border),
        Row(children: [
          Expanded(child: Text('Нийт ${sold.length} хувилбар', style: const TextStyle(color: AdminColors.mutedForeground))),
          Text('$total ширхэг', style: const TextStyle(fontFamily: mono, fontWeight: FontWeight.bold)),
        ]),
      ]),
    );
  }
}

/// Хүснэгтийн тоон нүд — гаднаас утга нь солигдвол (үнэ дагаж өөрчлөгдөх) шинэчлэгдэнэ.
class _NumberCell extends StatefulWidget {
  final String value;
  final String hint;
  final bool invalid;
  final ValueChanged<String> onChanged;
  const _NumberCell({super.key, required this.value, required this.hint, required this.onChanged, this.invalid = false});
  @override
  State<_NumberCell> createState() => _NumberCellState();
}

class _NumberCellState extends State<_NumberCell> {
  late final _c = TextEditingController(text: widget.value);

  @override
  void didUpdateWidget(_NumberCell old) {
    super.didUpdateWidget(old);
    if (widget.value != _c.text) _c.text = widget.value;
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => TextField(
        controller: _c,
        keyboardType: TextInputType.number,
        inputFormatters: _digits,
        textAlign: TextAlign.center,
        style: const TextStyle(fontFamily: mono, fontSize: 14),
        // "0" нь эхлэлийн утга — сонгоод бичихэд солигдоно.
        onTap: () => _c.selection = TextSelection(baseOffset: 0, extentOffset: _c.text.length),
        onChanged: widget.onChanged,
        decoration: InputDecoration(
          hintText: widget.hint,
          isDense: true,
          contentPadding: const EdgeInsets.symmetric(horizontal: 6, vertical: 12),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: widget.invalid ? AdminColors.destructive : AdminColors.border),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: AdminColors.primary, width: 1.5),
          ),
        ),
      );
}
