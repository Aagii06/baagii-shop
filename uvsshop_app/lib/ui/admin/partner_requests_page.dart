import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../api/admin_manage_models.dart';
import '../../state/admin_state.dart';
import '../common.dart';
import 'admin_design.dart';
import 'admin_widgets.dart';
import 'stores_page.dart';
import 'package:uvsshop_app/i18n.dart';

const _minPassword = 6;
const _take = 20;

final _statusColor = {'pending': Colors.orange, 'approved': Colors.green, 'rejected': Colors.red};

/// web-ийн /partner-requests: худалдагч болох хүсэлтүүд. Батлахад дэлгүүр,
/// түүний хэрэглэгч үүснэ; татгалзах, шийдвэрээ буцаах боломжтой.
class PartnerRequestsPage extends StatefulWidget {
  const PartnerRequestsPage({super.key});
  @override
  State<PartnerRequestsPage> createState() => _PartnerRequestsPageState();
}

class _PartnerRequestsPageState extends State<PartnerRequestsPage> {
  final _scroll = ScrollController();
  // Олон төлөв сонгож болно; юу ч сонгоогүй бол бүгд.
  Set<String> _statuses = {};

  void _toggle(String? status) {
    final next = {..._statuses};
    if (status == null) {
      next.clear();
    } else if (!next.remove(status)) {
      next.add(status);
    }
    // Бүгдийг сонгосон нь "бүгд"-тэй адил.
    if (next.length == partnerStatusLabel.length) next.clear();
    _statuses = next;
    _reload();
  }
  final List<PartnerRequest> _rows = [];
  int _count = 0;
  Map<String, int>? _stats;
  bool _loading = false;
  bool _loaded = false;
  Object? _error;
  // Шийдвэр хийгдэж буй хүсэлт ба аль товч нь.
  ({int id, String kind})? _busy;
  // Батлах маягт нээлттэй хүсэлтүүд.
  final Set<int> _approving = {};

  @override
  void initState() {
    super.initState();
    _scroll.addListener(() {
      if (_scroll.position.pixels > _scroll.position.maxScrollExtent - 400) _loadMore();
    });
    _reload();
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  Future<void> _reload() async {
    setState(() {
      _rows.clear();
      _count = 0;
      _error = null;
      _loaded = false;
    });
    await _loadMore(force: true);
  }

  Future<void> _loadMore({bool force = false}) async {
    if (_loading || (!force && _rows.length >= _count)) return;
    final statuses = _statuses;
    setState(() => _loading = true);
    try {
      final r = await context.read<AdminState>().partnerRequests(skip: _rows.length, take: _take, statuses: statuses);
      if (!mounted || !identical(statuses, _statuses)) return;
      setState(() {
        _rows.addAll(r.rows.where((n) => !_rows.any((o) => o.id == n.id)));
        _count = r.count;
        _stats = r.stats;
        _loaded = true;
      });
    } catch (e) {
      if (mounted) setState(() => _error = e);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<bool> _decide(PartnerRequest r, String kind, Future<void> Function() fn, String success) async {
    setState(() => _busy = (id: r.id, kind: kind));
    final done = await runAction(context, fn, success);
    if (!mounted) return done;
    setState(() => _busy = null);
    if (done) _reload();
    return done;
  }

  Future<bool> _approve(PartnerRequest r, String storeName, String password) async {
    final ok = await confirmAction(context,
        title: tr('#{id} хүсэлтийг батлах уу?', {'id': r.id}),
        description: tr('Дэлгүүр, түүний хэрэглэгч үүсч, {phone} дугаар энэ нууц үгээр админд нэвтэрнэ.', {'phone': formatPhone(r.phone)}),
        confirmLabel: tr('Батлах'));
    if (!ok || !mounted) return false;
    final done = await _decide(
        r, 'approve', () => context.read<AdminState>().approvePartner(r.id, password, storeName), tr('Хүсэлтийг баталлаа'));
    if (done) _approving.remove(r.id);
    return done;
  }

  Future<void> _reject(PartnerRequest r) async {
    final ok = await confirmAction(context,
        title: tr('#{id} хүсэлтээс татгалзах уу?', {'id': r.id}),
        description: tr('Татгалзсан хүсэлтийг дараа нь буцааж, дахин шийдвэрлэж болно.'),
        confirmLabel: tr('Татгалзах'),
        danger: true);
    if (ok && mounted) await _decide(r, 'reject', () => context.read<AdminState>().rejectPartner(r.id), tr('Хүсэлтээс татгалзлаа'));
  }

  Future<void> _revert(PartnerRequest r) async {
    final ok = await confirmAction(context,
        title: tr('#{id} хүсэлтийн шийдвэрийг буцаах уу?', {'id': r.id}),
        description: r.status == 'approved'
            ? tr('Батлахад үүссэн дэлгүүр, түүний хэрэглэгч устаж, хүсэлт дахин хүлээгдэж буй болно. Дэлгүүрт бараа бүртгэлтэй бол буцаах боломжгүй.')
            : tr('Хүсэлт дахин хүлээгдэж буй болж, дахин батлах эсвэл татгалзах боломжтой.'),
        confirmLabel: tr('Шийдвэрийг буцаах'),
        danger: true);
    if (ok && mounted) await _decide(r, 'revert', () => context.read<AdminState>().revertPartner(r.id), tr('Шийдвэрийг буцаалаа'));
  }

  Future<void> _openStore(int id) async {
    final store = await context.read<AdminState>().store(id).catchError((_) => null);
    if (!mounted) return;
    if (store == null) return showMessage(context, tr('Дэлгүүр олдсонгүй'), error: true);
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => StoreFormPage(store: store)));
  }

  @override
  Widget build(BuildContext context) {
    final stats = _stats;
    final total = stats?.values.fold(0, (a, b) => a + b) ?? 0;
    return Scaffold(
      appBar: AppBar(
        title: Text(tr('Хамтран ажиллах хүсэлт')),
      ),
      body: RefreshIndicator(
        onRefresh: _reload,
        child: ListView(controller: _scroll, padding: const EdgeInsets.all(12), children: [
          // Тоотой хэсэг нь шүүлтүүр: олныг сонгож болно (өнгөөр ялгагдана), юу ч сонгоогүй бол бүгд.
          if (stats != null)
            Panel(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: IntrinsicHeight(
                  child: Row(children: [
                    _Stat(tr('Нийт хүсэлт'), total, null, checked: _statuses.isEmpty, onTap: () => _toggle(null)),
                    for (final e in partnerStatusLabel.entries) ...[
                      const VerticalDivider(width: 1),
                      _Stat(e.value, stats[e.key] ?? 0, _statusColor[e.key],
                          checked: _statuses.contains(e.key), onTap: () => _toggle(e.key)),
                    ],
                  ]),
                ),
              ),
            ),
          const SizedBox(height: 12),
          if (!_loaded && _error == null)
            const LoadingView(count: 4)
          else if (_error != null && _rows.isEmpty)
            ErrorView(_error!, onRetry: _reload)
          else if (_rows.isEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 40),
              child: EmptyView(
                icon: Icons.handshake_outlined,
                text: _statuses.isEmpty
                    ? tr('Хүсэлт алга')
                    : tr('“{_status}” хүсэлт алга', {'_status': _statuses.map((s) => partnerStatusLabel[s]).join(', ')}),
              ),
            )
          else ...[
            Panel(
              child: Column(children: [
                for (var i = 0; i < _rows.length; i++) ...[
                  if (i > 0) const Divider(height: 1),
                  _RequestRow(
                    key: ValueKey(_rows[i].id),
                    request: _rows[i],
                    busy: _busy?.id == _rows[i].id ? _busy!.kind : null,
                    locked: _busy != null,
                    approving: _approving.contains(_rows[i].id),
                    onApproving: (v) => setState(() => v ? _approving.add(_rows[i].id) : _approving.remove(_rows[i].id)),
                    onApprove: (name, pw) => _approve(_rows[i], name, pw),
                    onReject: () => _reject(_rows[i]),
                    onRevert: () => _revert(_rows[i]),
                    onOpenStore: _openStore,
                  ),
                ],
              ]),
            ),
            if (_rows.length < _count)
              _loading
                  ? const LoadingView(count: 2)
                  : Padding(
                      padding: const EdgeInsets.all(16),
                      child: Center(child: OutlinedButton(onPressed: _loadMore, child: Text(tr('Дахин оролдох')))),
                    ),
          ],
        ]),
      ),
    );
  }
}

/// Тоо + шүүлтүүр: дарахад сонгогдоно; сонгогдсон нь төлөвийн өнгөт дэвсгэр, өнгөт тоотой.
class _Stat extends StatelessWidget {
  final String label;
  final int value;
  final Color? dot;
  final bool checked;
  final VoidCallback onTap;
  const _Stat(this.label, this.value, this.dot, {required this.checked, required this.onTap});

  @override
  Widget build(BuildContext context) => Expanded(
        child: Material(
          color: checked ? (dot ?? AdminColors.primary).withValues(alpha: 0.14) : Colors.transparent,
          child: InkWell(
            onTap: onTap,
            child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
          child: Column(children: [
            Text('$value',
                style: TextStyle(
                    fontFamily: 'monospace',
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: checked ? (dot ?? AdminColors.primary) : null)),
            const SizedBox(height: 4),
            Row(mainAxisAlignment: MainAxisAlignment.center, children: [
              Container(
                width: 6,
                height: 6,
                decoration: BoxDecoration(shape: BoxShape.circle, color: dot ?? Colors.grey.shade500),
              ),
              const SizedBox(width: 4),
              Flexible(
                child: Text(label,
                    maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 11, color: Colors.grey.shade600)),
              ),
            ]),
          ]),
        ),
          ),
        ),
      );
}

class _RequestRow extends StatefulWidget {
  final PartnerRequest request;
  final String? busy;
  final bool locked;
  final bool approving;
  final ValueChanged<bool> onApproving;
  final Future<bool> Function(String storeName, String password) onApprove;
  final VoidCallback onReject;
  final VoidCallback onRevert;
  final ValueChanged<int> onOpenStore;
  const _RequestRow({
    super.key,
    required this.request,
    required this.busy,
    required this.locked,
    required this.approving,
    required this.onApproving,
    required this.onApprove,
    required this.onReject,
    required this.onRevert,
    required this.onOpenStore,
  });

  @override
  State<_RequestRow> createState() => _RequestRowState();
}

class _RequestRowState extends State<_RequestRow> {
  late final _storeName = TextEditingController(text: widget.request.storeName ?? '');
  final _password = TextEditingController();
  bool _tried = false;

  @override
  void dispose() {
    _storeName.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _confirm() async {
    setState(() => _tried = true);
    if (_storeName.text.trim().isEmpty || _password.text.length < _minPassword) return;
    await widget.onApprove(_storeName.text.trim(), _password.text);
  }

  @override
  Widget build(BuildContext context) {
    final r = widget.request;
    final grey = TextStyle(fontSize: 13, color: Colors.grey.shade600);
    final contact = [?r.name, ?r.email].join(' · ');
    final green = Colors.green.shade600;
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Text('#${r.id}', style: grey.copyWith(fontFamily: 'monospace')),
          const SizedBox(width: 8),
          StatusChip(partnerStatusLabel[r.status]!, _statusColor[r.status]!),
          const Spacer(),
          if (r.status != 'pending')
            IconButton(
              tooltip: tr('Шийдвэрийг буцаах'),
              style: IconButton.styleFrom(backgroundColor: Colors.red.shade50, foregroundColor: Colors.red.shade600),
              onPressed: widget.locked ? null : widget.onRevert,
              icon: widget.busy == 'revert'
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.undo, size: 18),
            ),
        ]),
        const SizedBox(height: 6),
        Table(columnWidths: const {0: IntrinsicColumnWidth(), 1: FlexColumnWidth()}, children: [
          TableRow(children: [
            Padding(padding: const EdgeInsets.only(right: 12), child: Text(tr('Дэлгүүр'), style: grey)),
            Text(r.storeName ?? '—', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
          ]),
          TableRow(children: [
            Padding(padding: const EdgeInsets.only(right: 12), child: Text(tr('Утасны дугаар'), style: grey)),
            Text(formatPhone(r.phone), style: const TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.w600)),
          ]),
        ]),
        if (contact.isNotEmpty) Text(contact, style: grey),
        if (r.address != null) Text(r.address!, style: grey),
        Text(formatWhen(r.createdAt), style: grey.copyWith(fontSize: 12)),
        if (r.storeId != null)
          TextButton(
            style: TextButton.styleFrom(padding: EdgeInsets.zero, visualDensity: VisualDensity.compact),
            onPressed: () => widget.onOpenStore(r.storeId!),
            child: Text(tr('Дэлгүүрийг харах')),
          ),
        if (r.status == 'pending') ...[
          const SizedBox(height: 10),
          if (widget.approving) ...[
            TextField(
              controller: _storeName,
              autofocus: true,
              onChanged: (_) => setState(() {}),
              decoration: fieldDecoration(tr('Дэлгүүрийн нэр'),
                  error: _tried && _storeName.text.trim().isEmpty ? tr('Дэлгүүрийн нэр оруулна уу') : null),
            ),
            const SizedBox(height: 10),
            PasswordField(
              controller: _password,
              label: tr('Нууц үг'),
              helper: tr('Дэлгүүрийн хэрэглэгч утас, энэ нууц үгээр админд нэвтэрнэ'),
              error: _tried && _password.text.length < _minPassword ? tr('Нууц үг {_minPassword}-аас дээш тэмдэгттэй байна', {'_minPassword': _minPassword}) : null,
              onChanged: (_) => setState(() {}),
            ),
            const SizedBox(height: 10),
            Row(children: [
              Expanded(child: OutlinedButton(onPressed: () => widget.onApproving(false), child: Text(tr('Болих')))),
              const SizedBox(width: 10),
              Expanded(
                child: FilledButton(
                  style: FilledButton.styleFrom(backgroundColor: green),
                  onPressed: widget.locked ? null : _confirm,
                  child: widget.busy == 'approve'
                      ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : Text(tr('Батлах')),
                ),
              ),
            ]),
          ] else
            Row(children: [
              Expanded(
                child: FilledButton(
                  style: FilledButton.styleFrom(backgroundColor: green),
                  onPressed: widget.locked ? null : () => widget.onApproving(true),
                  child: Text(tr('Батлах')),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: FilledButton(
                  style: FilledButton.styleFrom(backgroundColor: Colors.red.shade50, foregroundColor: Colors.red.shade700),
                  onPressed: widget.locked ? null : widget.onReject,
                  child: widget.busy == 'reject'
                      ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                      : Text(tr('Татгалзах')),
                ),
              ),
            ]),
        ],
      ]),
    );
  }
}
