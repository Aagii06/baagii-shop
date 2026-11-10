import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../api/shop_models.dart';
import '../../state/admin_state.dart';
import '../../state/app_state.dart';
import '../../state/shop_nav.dart';
import '../../state/shop_state.dart';
import '../common.dart';
import 'addresses_page.dart';
import 'orders_page.dart';
import 'seller_page.dart';
import 'sign_in_page.dart';

/// web-ийн /profile (утасны харагдац): гарчиг, мэдээллийн карт + ✏️, цэс
/// (захиалга, сагс, хадгалсан, хаяг), "Хамтран ажиллах", "Гарах".
class AccountPage extends StatefulWidget {
  /// Доод цэсний таб руу шилжүүлнэ (Сагс, Хадгалсан).
  final ValueChanged<ShopTab>? onOpenTab;
  const AccountPage({super.key, this.onOpenTab});

  @override
  State<AccountPage> createState() => _AccountPageState();
}

/// "99112233" → "9911 2233".
String _formatPhone(String p) => p.length > 4 ? '${p.substring(0, 4)} ${p.substring(4)}' : p;

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

  void _push(Widget page) => Navigator.of(context).push(MaterialPageRoute(builder: (_) => page));

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

  static final _box = BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: borderColor));

  @override
  Widget build(BuildContext context) {
    final shop = context.watch<ShopState>();
    final c = shop.customer;
    if (c == null && _editing) _editing = false;

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: c == null
            ? _signInPrompt()
            : ListView(padding: const EdgeInsets.fromLTRB(16, 24, 16, 24), children: [
                const Text('Профайл тохиргоо', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text('Хувийн мэдээлэл болон бүртгэлээ энд шинэчилнэ.', style: TextStyle(fontSize: 14, color: Colors.grey.shade600)),
                const SizedBox(height: 24),
                _editing ? _editForm(c) : _profileCard(c),
                const SizedBox(height: 16),
                _menu(shop),
                const SizedBox(height: 16),
                _linkCard(
                  icon: Icons.storefront_outlined,
                  title: 'Хамтран ажиллах',
                  subtitle: 'Дэлгүүрийнхээ мэдээллийг үлдээж, утсаа баталгаажуулна уу. Хүсэлт батлагдвал таны дэлгүүр нээгдэнэ.',
                  onTap: () => _push(const SellerPage()),
                ),
                if (shop.isStaff) ...[
                  const SizedBox(height: 16),
                  _adminLink(),
                ],
                const SizedBox(height: 16),
                OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.red.shade600,
                    minimumSize: const Size.fromHeight(44),
                    side: const BorderSide(color: borderColor),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  onPressed: () => context.read<ShopState>().signOut(),
                  icon: const Icon(Icons.logout, size: 16),
                  label: const Text('Гарах'),
                ),
              ]),
      ),
    );
  }

  /// web: нэвтрээгүй үед "Та нэвтрээгүй байна".
  Widget _signInPrompt() => ListView(padding: const EdgeInsets.fromLTRB(16, 40, 16, 24), children: [
        Icon(Icons.person_outline, size: 48, color: Colors.grey.shade500),
        const SizedBox(height: 16),
        const Text('Та нэвтрээгүй байна', textAlign: TextAlign.center, style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        Text('Профайл тохиргоогоо үзэхийн тулд эхлээд нэвтэрнэ үү.',
            textAlign: TextAlign.center, style: TextStyle(color: Colors.grey.shade600)),
        const SizedBox(height: 24),
        Center(child: FilledButton(onPressed: () => _push(const SignInPage()), child: const Text('Нэвтрэх'))),
      ]);

  /// Апп дээрх нэмэлт: худалдан авагчийн утсаар админ / дэлгүүрийн хэрэглэгч
  /// бүртгэлтэй (isStaff) үед л харагдана.
  Widget _adminLink() {
    final admin = context.watch<AdminState>();
    return admin.signedIn
        ? _linkCard(
            icon: Icons.admin_panel_settings_outlined,
            title: 'Админ хэсэг рүү орох',
            subtitle: admin.user?.name ?? '',
            onTap: () => context.read<AppState>().openAdmin(),
          )
        : _linkCard(
            icon: Icons.admin_panel_settings_outlined,
            title: 'Админ / Худалдагч нэвтрэх',
            subtitle: 'Дэлгүүрийн админ хэсэгт нэвтэрнэ',
            onTap: () => _push(const SignInPage(initialTab: 1)),
          );
  }

  Widget _avatar(String? name) {
    final n = name?.trim() ?? '';
    return Container(
      width: 56,
      height: 56,
      alignment: Alignment.center,
      decoration: const BoxDecoration(color: accentColor, shape: BoxShape.circle),
      child: n.isEmpty
          ? const Icon(Icons.person_outline, color: brandColor)
          : Text(n.characters.first.toUpperCase(), style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: brandColor)),
    );
  }

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
            Text(_formatPhone(c.phone), style: TextStyle(fontSize: 14, color: Colors.grey.shade600, fontFamily: 'monospace')),
            if (_justSaved)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Row(children: [
                  Icon(Icons.check, size: 16, color: Colors.green.shade600),
                  const SizedBox(width: 4),
                  Text('Хадгалагдлаа', style: TextStyle(color: Colors.green.shade600, fontSize: 14)),
                ]),
              ),
          ]),
        ),
        IconButton.outlined(
          tooltip: 'Засах',
          style: IconButton.styleFrom(side: const BorderSide(color: borderColor)),
          onPressed: () {
            _name.text = c.name ?? '';
            setState(() => _editing = true);
          },
          icon: const Icon(Icons.edit_outlined, size: 16),
        ),
      ]),
    );
  }

  Widget _editForm(Customer c) => Container(
        decoration: _box,
        padding: const EdgeInsets.all(16),
        child: ValueListenableBuilder<TextEditingValue>(
          valueListenable: _name,
          builder: (context, value, _) {
            final trimmed = value.text.trim();
            final canSave = trimmed.isNotEmpty && trimmed != (c.name ?? '') && !_saving;
            return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              const Text('Хувийн мэдээлэл', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
              const SizedBox(height: 20),
              const Text('Нэр', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
              const SizedBox(height: 6),
              TextField(
                controller: _name,
                autofocus: true,
                textCapitalization: TextCapitalization.words,
                decoration: const InputDecoration(hintText: 'Нэрээ оруулна уу'),
                onSubmitted: (_) => _save(c),
              ),
              const SizedBox(height: 20),
              const Text('Утасны дугаар', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
              const SizedBox(height: 6),
              TextFormField(
                initialValue: _formatPhone(c.phone),
                enabled: false,
                decoration: const InputDecoration(helperText: 'Утасны дугаарыг өөрчлөх боломжгүй.'),
              ),
              const SizedBox(height: 20),
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

  /// web-ийн OrdersSidebar (menu): Миний захиалга, Сагс, Хадгалсан бараа, Хүргэлтийн хаяг.
  Widget _menu(ShopState shop) {
    final items = [
      (Icons.assignment_outlined, 'Миний захиалга', 0, () => _push(const OrdersPage())),
      (Icons.shopping_cart_outlined, 'Сагс', shop.cartCount, () => widget.onOpenTab?.call(ShopTab.cart)),
      (Icons.favorite_border, 'Хадгалсан бараа', shop.saved.length, () => widget.onOpenTab?.call(ShopTab.saved)),
      (Icons.location_on_outlined, 'Хүргэлтийн хаяг', 0, () => _push(const AddressesPage())),
    ];
    return Container(
      decoration: _box,
      clipBehavior: Clip.antiAlias,
      child: Column(children: [
        for (var i = 0; i < items.length; i++) ...[
          if (i > 0) const Divider(height: 1, color: borderColor),
          InkWell(
            onTap: items[i].$4,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              child: Row(children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(color: accentColor, borderRadius: BorderRadius.circular(12)),
                  child: Icon(items[i].$1, size: 16, color: brandColor),
                ),
                const SizedBox(width: 12),
                Expanded(child: Text(items[i].$2, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500))),
                if (items[i].$3 > 0)
                  Container(
                    constraints: const BoxConstraints(minWidth: 20),
                    height: 20,
                    padding: const EdgeInsets.symmetric(horizontal: 6),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(color: brandColor, borderRadius: BorderRadius.circular(10)),
                    child: Text(items[i].$3 > 99 ? '99+' : '${items[i].$3}',
                        style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                  ),
                const SizedBox(width: 8),
                Icon(Icons.chevron_right, size: 16, color: Colors.grey.shade500),
              ]),
            ),
          ),
        ],
      ]),
    );
  }

  Widget _linkCard({required IconData icon, required String title, required String subtitle, required VoidCallback onTap}) => Material(
        color: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: const BorderSide(color: borderColor)),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(color: accentColor, borderRadius: BorderRadius.circular(12)),
                child: Icon(icon, size: 20, color: brandColor),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                  if (subtitle.isNotEmpty)
                    Text(subtitle,
                        maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                ]),
              ),
              Icon(Icons.chevron_right, color: Colors.grey.shade500),
            ]),
          ),
        ),
      );
}
