import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../api/admin_manage_models.dart';
import '../../state/admin_state.dart';
import '../common.dart';
import 'admin_widgets.dart';
import 'stores_page.dart';

const _minPassword = 6;

/// web-ийн /users: админ болон дэлгүүрийн хэрэглэгчид.
class UsersPage extends StatefulWidget {
  const UsersPage({super.key});
  @override
  State<UsersPage> createState() => _UsersPageState();
}

class _UsersPageState extends State<UsersPage> {
  List<PanelUser>? _data;
  Object? _error;
  String _role = 'all';
  final Set<int> _deleting = {};

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final rows = await context.read<AdminState>().users();
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

  Future<void> _edit(PanelUser? user) async {
    final saved = await Navigator.of(context).push<bool>(MaterialPageRoute(builder: (_) => UserFormPage(user: user)));
    if (saved == true) _load();
  }

  Future<void> _delete(PanelUser u, String name) async {
    final ok = await confirmAction(context,
        title: 'Хэрэглэгч устгах уу?', description: '“$name” нэвтрэх боломжгүй болно.', confirmLabel: 'Устгах', danger: true);
    if (!ok || !mounted) return;
    setState(() => _deleting.add(u.id));
    final done = await runAction(context, () => context.read<AdminState>().deleteUser(u.id), 'Хэрэглэгчийг устгалаа');
    if (!mounted) return;
    setState(() => _deleting.remove(u.id));
    if (done) _load();
  }

  @override
  Widget build(BuildContext context) {
    final me = context.select<AdminState, int?>((a) => a.user?.id);
    // Өөрийгөө профайлаасаа засна, энэ жагсаалтаас биш.
    final rows = _data?.where((u) => u.id != me && (_role == 'all' || u.role == _role)).toList();
    return Scaffold(
      appBar: AppBar(
        title: const Text('Хэрэглэгчид'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: FilledButton.icon(onPressed: () => _edit(null), icon: const Icon(Icons.add), label: const Text('Нэмэх')),
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: ChipTabs<String>(
            value: _role,
            onChanged: (v) => setState(() => _role = v),
            options: [('all', 'Бүгд', null), for (final e in userRoleLabel.entries) (e.key, e.value, null)],
          ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: AsyncList<PanelUser>(
          data: rows,
          error: _error,
          onRetry: _load,
          emptyIcon: Icons.group_outlined,
          emptyText: 'Хэрэглэгч алга',
          builder: (rows) => ListView.separated(
            itemCount: rows.length,
            separatorBuilder: (_, _) => const Divider(height: 1),
            itemBuilder: (_, i) {
              final u = rows[i];
              final name = u.name ?? formatPhone(u.phone);
              return Container(
                color: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Row(children: [
                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Row(children: [
                        Flexible(
                          child: Text(name,
                              maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                        ),
                        const SizedBox(width: 6),
                        StatusChip(userRoleLabel[u.role]!, u.role == 'admin' ? brandColor : Colors.grey.shade700),
                      ]),
                      Text(
                        '${formatPhone(u.phone)}${u.role == 'shopper' ? ' · ${u.storeName ?? 'дэлгүүргүй'}' : ''}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                      ),
                    ]),
                  ),
                  IconButton.outlined(tooltip: 'Засах', onPressed: () => _edit(u), icon: const Icon(Icons.edit_outlined, size: 18)),
                  DeleteIconButton(busy: _deleting.contains(u.id), onPressed: () => _delete(u, name)),
                ]),
              );
            },
          ),
        ),
      ),
    );
  }
}

/// Хэрэглэгч нэмэх / засах. Засахад нууц үг хоосон бол хуучнаараа үлдэнэ.
class UserFormPage extends StatefulWidget {
  final PanelUser? user;
  const UserFormPage({super.key, this.user});
  @override
  State<UserFormPage> createState() => _UserFormPageState();
}

class _UserFormPageState extends State<UserFormPage> {
  late final _name = TextEditingController(text: widget.user?.name ?? '');
  late final _phone = TextEditingController(text: widget.user?.phone ?? '');
  late final _email = TextEditingController(text: widget.user?.email ?? '');
  final _password = TextEditingController();
  late String _role = widget.user?.role ?? 'shopper';
  late int? _storeId = widget.user?.storeId;
  List<Store>? _stores;
  bool _submitted = false;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _loadStores();
  }

  Future<void> _loadStores() async {
    try {
      final s = await context.read<AdminState>().stores();
      if (mounted) setState(() => _stores = s);
    } catch (_) {
      if (mounted) setState(() => _stores = []);
    }
  }

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  bool get _dirty {
    final u = widget.user;
    return _name.text != (u?.name ?? '') ||
        _phone.text != (u?.phone ?? '') ||
        _email.text != (u?.email ?? '') ||
        _role != (u?.role ?? 'shopper') ||
        _storeId != u?.storeId ||
        _password.text.isNotEmpty;
  }

  bool get _passwordShort => widget.user != null
      ? _password.text.isNotEmpty && _password.text.length < _minPassword
      : _password.text.length < _minPassword;

  Future<void> _save() async {
    setState(() => _submitted = true);
    final email = _email.text.trim();
    if (_name.text.trim().isEmpty || _phone.text.length < 8) return;
    if (email.isNotEmpty && !emailRe.hasMatch(email)) return;
    if (_role == 'shopper' && _storeId == null) return;
    if (_passwordShort) return;
    final admin = context.read<AdminState>();
    setState(() => _saving = true);
    final saved = await runAction(
      context,
      () => admin.saveUser(widget.user?.id, {
        'name': _name.text.trim(),
        'phone': _phone.text,
        'email': email,
        'role': _role,
        'storeId': _role == 'shopper' ? _storeId : null,
        'password': _password.text,
      }),
      widget.user == null ? 'Хэрэглэгчийг нэмлээ' : 'Хадгаллаа',
    );
    if (!mounted) return;
    if (saved) {
      Navigator.pop(context, true);
    } else {
      setState(() => _saving = false);
    }
  }

  Future<void> _newStore() async {
    final saved = await Navigator.of(context).push<bool>(MaterialPageRoute(builder: (_) => const StoreFormPage()));
    if (saved == true) _loadStores();
  }

  @override
  Widget build(BuildContext context) {
    final me = context.select<AdminState, int?>((a) => a.user?.id);
    final isMe = widget.user != null && widget.user!.id == me;
    final email = _email.text.trim();
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.user == null ? 'Хэрэглэгч нэмэх' : 'Хэрэглэгч засах'),
        actions: [SaveAction(enabled: _dirty, busy: _saving, onPressed: _save)],
      ),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        Text('Эрх', style: TextStyle(color: Colors.grey.shade600)),
        const SizedBox(height: 6),
        if (isMe)
          Text('Өөрийнхөө эрхийг өөрчлөх боломжгүй', style: TextStyle(color: Colors.grey.shade600))
        else
          SegmentedButton<String>(
            segments: [for (final e in userRoleLabel.entries) ButtonSegment(value: e.key, label: Text(e.value))],
            selected: {_role},
            onSelectionChanged: (s) => setState(() => _role = s.first),
          ),
        const SizedBox(height: 16),
        if (_role == 'shopper') ...[
          if (_stores == null)
            const LinearProgressIndicator()
          else
            DropdownButtonFormField<int>(
              key: ValueKey('store-${_stores!.length}'),
              initialValue: _stores!.any((s) => s.id == _storeId) ? _storeId : null,
              isExpanded: true,
              decoration: fieldDecoration('Дэлгүүр',
                  hint: 'Дэлгүүр сонгох', error: _submitted && _storeId == null ? 'Дэлгүүр сонгоно уу' : null),
              items: [for (final s in _stores!) DropdownMenuItem(value: s.id, child: Text(s.name, overflow: TextOverflow.ellipsis))],
              onChanged: (v) => setState(() => _storeId = v),
            ),
          Align(
            alignment: Alignment.centerLeft,
            child: TextButton(onPressed: _newStore, child: const Text('+ Шинэ дэлгүүр бүртгэх')),
          ),
          const SizedBox(height: 8),
        ],
        TextField(
          controller: _name,
          onChanged: (_) => setState(() {}),
          decoration: fieldDecoration('Нэр', error: _submitted && _name.text.trim().isEmpty ? 'Нэр оруулна уу' : null),
        ),
        const SizedBox(height: 14),
        TextField(
          controller: _phone,
          keyboardType: TextInputType.phone,
          maxLength: 8,
          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          style: const TextStyle(fontFamily: 'monospace'),
          onChanged: (_) => setState(() {}),
          decoration: fieldDecoration('Утасны дугаар',
                  helper: 'Энэ дугаар, нууц үгээр нэвтэрнэ',
                  error: _submitted && _phone.text.length < 8 ? 'Утасны дугаар 8 оронтой байна' : null)
              .copyWith(counterText: ''),
        ),
        const SizedBox(height: 14),
        TextField(
          controller: _email,
          keyboardType: TextInputType.emailAddress,
          autocorrect: false,
          onChanged: (_) => setState(() {}),
          decoration: fieldDecoration('Имэйл',
              error: _submitted && email.isNotEmpty && !emailRe.hasMatch(email) ? 'Имэйл буруу байна' : null),
        ),
        const SizedBox(height: 14),
        PasswordField(
          controller: _password,
          label: widget.user != null ? 'Шинэ нууц үг' : 'Нууц үг',
          helper: widget.user != null ? 'Хоосон бол хуучнаараа үлдэнэ' : 'Дэлгүүрийн хэрэглэгч утас, энэ нууц үгээр админд нэвтэрнэ',
          error: _submitted && _passwordShort ? 'Нууц үг $_minPassword-аас дээш тэмдэгттэй байна' : null,
          onChanged: (_) => setState(() {}),
        ),
      ]),
    );
  }
}
