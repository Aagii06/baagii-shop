import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../api/shop_models.dart';
import '../../state/admin_state.dart';
import '../../state/app_state.dart';
import '../../state/shop_state.dart';
import '../common.dart';
import 'orders_page.dart';
import 'shop_shell.dart';
import 'sign_in_page.dart';

/// Web-ийн /profile-тэй адил: мэдээллийн карт + ✏️ засах товч, доор нь
/// цэс (Миний захиалгууд, Сагс), бүтэн өргөнтэй "Гарах".
class AccountPage extends StatefulWidget {
  /// Доод цэсний таб руу шилжүүлнэ (Сагс, Хадгалсан).
  final ValueChanged<ShopTab>? onOpenTab;
  const AccountPage({super.key, this.onOpenTab});

  @override
  State<AccountPage> createState() => _AccountPageState();
}

class _AccountPageState extends State<AccountPage> {
  final _name = TextEditingController();
  bool _editing = false;
  bool _saving = false;
  bool _justSaved = false;

  @override
  void dispose() {
    _name.dispose();
    super.dispose();
  }

  void _startEdit(Customer c) {
    _name.text = c.name ?? '';
    setState(() => _editing = true);
  }

  Future<void> _save(Customer c) async {
    final name = _name.text.trim();
    if (name.isEmpty || name == (c.name ?? '')) return;
    setState(() => _saving = true);
    try {
      await context.read<ShopState>().updateName(name);
      if (!mounted) return;
      setState(() {
        _editing = false;
        _justSaved = true;
      });
      Future.delayed(const Duration(seconds: 2), () {
        if (mounted) setState(() => _justSaved = false);
      });
    } catch (e) {
      if (mounted) showMessage(context, e.toString(), error: true);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final shop = context.watch<ShopState>();
    final admin = context.watch<AdminState>();
    final c = shop.customer;
    if (c == null && _editing) _editing = false;

    return Scaffold(
      appBar: AppBar(title: const Text('Профайл тохиргоо')),
      body: ListView(padding: const EdgeInsets.all(12), children: [
        if (c == null) _guestCard() else if (_editing) _editForm(c) else _profileCard(c),
        const SizedBox(height: 12),
        _menu([
          if (c != null)
            _MenuItem(Icons.receipt_long_outlined, 'Миний захиалгууд',
                () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const OrdersPage()))),
          _MenuItem(Icons.shopping_cart_outlined, 'Миний сагс', () => widget.onOpenTab?.call(ShopTab.cart), badge: shop.cartCount),
          if (c != null)
            _MenuItem(Icons.favorite_border, 'Хадгалсан', () => widget.onOpenTab?.call(ShopTab.saved), badge: shop.saved.length),
          if (admin.signedIn)
            _MenuItem(Icons.admin_panel_settings_outlined, 'Админ хэсэг рүү орох', () => context.read<AppState>().openAdmin(),
                subtitle: admin.user?.name)
          else
            _MenuItem(
              Icons.admin_panel_settings_outlined,
              'Админ / Худалдагч нэвтрэх',
              () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SignInPage(initialTab: 1))),
            ),
        ]),
        if (c != null) ...[
          const SizedBox(height: 12),
          OutlinedButton.icon(
            style: OutlinedButton.styleFrom(
              foregroundColor: Colors.red,
              minimumSize: const Size.fromHeight(48),
              side: BorderSide(color: Colors.grey.shade300),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            ),
            onPressed: () => context.read<ShopState>().signOut(),
            icon: const Icon(Icons.logout),
            label: const Text('Гарах'),
          ),
        ],
      ]),
    );
  }

  BoxDecoration get _box => BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
      );

  Widget _avatar(String? name) {
    final n = name?.trim() ?? '';
    return CircleAvatar(
      radius: 28,
      backgroundColor: brandColor.withValues(alpha: 0.1),
      foregroundColor: brandColor,
      child: n.isEmpty
          ? const Icon(Icons.person_outline)
          : Text(n.characters.first.toUpperCase(), style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
    );
  }

  Widget _guestCard() => Container(
        decoration: _box,
        padding: const EdgeInsets.all(16),
        child: Row(children: [
          _avatar(null),
          const SizedBox(width: 16),
          const Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Зочин', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
              SizedBox(height: 2),
              Text('Утасны дугаараараа нэвтэрнэ үү', style: TextStyle(color: Colors.grey)),
            ]),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SignInPage())),
            child: const Text('Нэвтрэх'),
          ),
        ]),
      );

  Widget _profileCard(Customer c) {
    final hasName = c.name?.trim().isNotEmpty == true;
    return Container(
      decoration: _box,
      padding: const EdgeInsets.all(16),
      child: Row(children: [
        _avatar(c.name),
        const SizedBox(width: 16),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(hasName ? c.name!.trim() : 'Нэр оруулаагүй',
                maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
            const SizedBox(height: 2),
            Text(c.phone, style: TextStyle(color: Colors.grey.shade600, fontFamily: 'monospace')),
            if (_justSaved)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Row(children: [
                  Icon(Icons.check, size: 16, color: Colors.green.shade600),
                  const SizedBox(width: 4),
                  Text('Хадгалагдлаа', style: TextStyle(color: Colors.green.shade600, fontSize: 13)),
                ]),
              ),
          ]),
        ),
        IconButton.outlined(
          tooltip: 'Засах',
          onPressed: () => _startEdit(c),
          icon: const Icon(Icons.edit_outlined, size: 20),
        ),
      ]),
    );
  }

  Widget _editForm(Customer c) {
    return Container(
      decoration: _box,
      padding: const EdgeInsets.all(16),
      child: ValueListenableBuilder<TextEditingValue>(
        valueListenable: _name,
        builder: (context, value, _) {
          final trimmed = value.text.trim();
          final canSave = trimmed.isNotEmpty && trimmed != (c.name ?? '') && !_saving;
          return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            const Text('Хувийн мэдээлэл', style: TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 16),
            TextField(
              controller: _name,
              autofocus: true,
              textCapitalization: TextCapitalization.words,
              decoration: const InputDecoration(labelText: 'Нэр', hintText: 'Нэрээ оруулна уу'),
              onSubmitted: (_) => _save(c),
            ),
            const SizedBox(height: 12),
            TextFormField(
              initialValue: c.phone,
              enabled: false,
              decoration: const InputDecoration(
                labelText: 'Утасны дугаар',
                helperText: 'Утасны дугаарыг өөрчлөх боломжгүй.',
              ),
            ),
            const SizedBox(height: 16),
            Row(children: [
              Expanded(
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(44)),
                  onPressed: _saving ? null : () => setState(() => _editing = false),
                  child: const Text('Болих'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: FilledButton(
                  style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(44)),
                  onPressed: canSave ? () => _save(c) : null,
                  child: _saving
                      ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Text('Хадгалах'),
                ),
              ),
            ]),
          ]);
        },
      ),
    );
  }

  Widget _menu(List<_MenuItem> items) => Container(
        decoration: _box,
        clipBehavior: Clip.antiAlias,
        child: Column(children: [
          for (var i = 0; i < items.length; i++) ...[
            if (i > 0) Divider(height: 1, color: Colors.grey.shade200),
            ListTile(
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              leading: Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(color: brandColor.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
                child: Icon(items[i].icon, size: 20, color: brandColor),
              ),
              title: Text(items[i].label, style: const TextStyle(fontWeight: FontWeight.w500)),
              subtitle: items[i].subtitle == null ? null : Text(items[i].subtitle!),
              trailing: Row(mainAxisSize: MainAxisSize.min, children: [
                if (items[i].badge > 0)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                    decoration: BoxDecoration(color: brandColor, borderRadius: BorderRadius.circular(10)),
                    child: Text(items[i].badge > 99 ? '99+' : '${items[i].badge}',
                        style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                  ),
                const SizedBox(width: 4),
                Icon(Icons.chevron_right, color: Colors.grey.shade500),
              ]),
              onTap: items[i].onTap,
            ),
          ],
        ]),
      );
}

class _MenuItem {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final String? subtitle;
  final int badge;
  _MenuItem(this.icon, this.label, this.onTap, {this.subtitle, this.badge = 0});
}
