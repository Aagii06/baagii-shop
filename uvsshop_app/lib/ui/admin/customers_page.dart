import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../api/admin_manage_models.dart';
import '../../state/admin_state.dart';
import '../common.dart';
import 'admin_widgets.dart';
import 'orders_page.dart';

/// Сүүлд устгахад оруулсан админы нууц үг 15 минут санагдана (зөвхөн санах ойд).
({String value, DateTime until})? _savedPassword;

String _rememberedPassword() {
  final r = _savedPassword;
  if (r != null && r.until.isAfter(DateTime.now())) return r.value;
  _savedPassword = null;
  return '';
}

void _rememberPassword(String pw) => _savedPassword = (value: pw, until: DateTime.now().add(const Duration(minutes: 15)));

/// web-ийн /customers: вэбээр нэвтэрсэн худалдан авагчид.
class CustomersPage extends StatefulWidget {
  const CustomersPage({super.key});
  @override
  State<CustomersPage> createState() => _CustomersPageState();
}

class _CustomersPageState extends State<CustomersPage> {
  List<Customer>? _data;
  Object? _error;
  String _query = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final rows = await context.read<AdminState>().customers();
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

  Future<void> _delete(Customer c) async {
    final deleted = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => _DeleteSheet(customer: c),
    );
    if (deleted == true && mounted) {
      showMessage(context, 'Худалдан авагчийг устгалаа');
      _load();
    }
  }

  @override
  Widget build(BuildContext context) {
    final q = _query.trim().toLowerCase();
    final digits = digitsOnly(q);
    final rows = _data
        ?.where((c) => q.isEmpty || (c.name ?? '').toLowerCase().contains(q) || (digits.isNotEmpty && c.phone.contains(digits)))
        .toList();
    return Scaffold(
      appBar: AppBar(
        title: const Text('Худалдан авагчид'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(60),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(12, 0, 12, 8),
            child: TextField(
              onChanged: (v) => setState(() => _query = v),
              decoration: InputDecoration(
                hintText: 'Нэр, утсаар хайх',
                prefixIcon: const Icon(Icons.search),
                filled: true,
                fillColor: Colors.grey.shade100,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide.none),
              ),
            ),
          ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: AsyncList<Customer>(
          data: rows,
          error: _error,
          onRetry: _load,
          emptyIcon: Icons.person_outline,
          emptyText: q.isNotEmpty ? 'Илэрц олдсонгүй' : 'Худалдан авагч алга',
          builder: (rows) => ListView.separated(
            itemCount: rows.length,
            separatorBuilder: (_, _) => const Divider(height: 1),
            itemBuilder: (_, i) {
              final c = rows[i];
              return Container(
                color: Colors.white,
                padding: const EdgeInsets.fromLTRB(16, 12, 8, 12),
                child: Row(children: [
                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(c.name ?? 'Зочин',
                          maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                      Text('${formatPhone(c.phone)} · ${formatDate(c.createdAt, time: false)}-с',
                          style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                    ]),
                  ),
                  Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                    Text('${c.orderCount} захиалга', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                    if (c.lastOrderAt != null)
                      Text(formatDate(c.lastOrderAt, time: false), style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                  ]),
                  const SizedBox(width: 4),
                  IconButton(
                    tooltip: 'Захиалга харах',
                    icon: const Icon(Icons.receipt_long_outlined, size: 20, color: brandColor),
                    onPressed: () => Navigator.of(context)
                        .push(MaterialPageRoute(builder: (_) => AdminOrdersPage(phone: c.phone))),
                  ),
                  // Захиалгатай худалдан авагчийг устгах боломжгүй (backend ч татгалзана).
                  Tooltip(
                    message: c.orderCount > 0 ? 'Захиалгатай тул устгах боломжгүй' : 'Устгах',
                    child: DeleteIconButton(busy: false, onPressed: c.orderCount > 0 ? null : () => _delete(c)),
                  ),
                ]),
              );
            },
          ),
        ),
      ),
    );
  }
}

/// "Устгах уу?" + админы нууц үг (сүүлийн 15 минутад оруулсан бол асуухгүй).
class _DeleteSheet extends StatefulWidget {
  final Customer customer;
  const _DeleteSheet({required this.customer});
  @override
  State<_DeleteSheet> createState() => _DeleteSheetState();
}

class _DeleteSheetState extends State<_DeleteSheet> {
  String _remembered = _rememberedPassword();
  final _password = TextEditingController();
  String? _error;
  bool _busy = false;

  @override
  void dispose() {
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final pw = _remembered.isNotEmpty ? _remembered : _password.text;
    if (pw.isEmpty) return setState(() => _error = 'Нууц үгээ оруулна уу');
    setState(() => _busy = true);
    try {
      await context.read<AdminState>().deleteCustomer(widget.customer.id, pw);
      _rememberPassword(pw);
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        // Санасан нууц үг хуучирсан байж болно — дахин асууна.
        if (_remembered.isNotEmpty) {
          _remembered = '';
          _savedPassword = null;
        }
        _error = errorText(e);
        _busy = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = widget.customer;
    final name = c.name ?? formatPhone(c.phone);
    return Padding(
      padding: EdgeInsets.fromLTRB(24, 0, 24, 24 + MediaQuery.viewInsetsOf(context).bottom),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        CircleAvatar(radius: 24, backgroundColor: Colors.red.shade50, child: Icon(Icons.delete_outline, color: Colors.red.shade600)),
        const SizedBox(height: 12),
        Text('$name-г устгах уу?', textAlign: TextAlign.center, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
        const SizedBox(height: 6),
        Text('${formatPhone(c.phone)} · Худалдан авагчийн бүртгэл устна.',
            textAlign: TextAlign.center, style: TextStyle(color: Colors.grey.shade600)),
        if (_remembered.isEmpty) ...[
          const SizedBox(height: 16),
          PasswordField(
            controller: _password,
            label: 'Баталгаажуулахын тулд өөрийн нууц үгээ оруулна уу',
            error: _error,
            onChanged: (_) => setState(() => _error = null),
          ),
        ] else if (_error != null) ...[
          const SizedBox(height: 8),
          Text(_error!, style: TextStyle(color: Colors.red.shade700)),
        ],
        const SizedBox(height: 20),
        Row(children: [
          Expanded(child: OutlinedButton(onPressed: _busy ? null : () => Navigator.pop(context), child: const Text('Болих'))),
          const SizedBox(width: 8),
          Expanded(
            child: FilledButton(
              style: FilledButton.styleFrom(backgroundColor: Colors.red.shade600),
              onPressed: _busy ? null : _submit,
              child: _busy
                  ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text('Устгах'),
            ),
          ),
        ]),
      ]),
    );
  }
}
