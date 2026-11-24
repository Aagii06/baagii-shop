import 'dart:async';

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
import 'package:uvsshop_app/i18n.dart';

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
  // Имэйл: бичээд "Код авах" → имэйлд ирсэн кодоор "Хадгалах" үед баталгаажна.
  final _email = TextEditingController();
  final _code = TextEditingController();
  String? _codeSentTo;
  bool _sendingCode = false;
  String? _emailError;
  int _resendIn = 0;
  Timer? _resendTimer;
  bool _editing = false;
  bool _saving = false;
  bool _justSaved = false;

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _code.dispose();
    _resendTimer?.cancel();
    super.dispose();
  }

  static final _emailRe = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');
  String get _emailValue => _email.text.trim().toLowerCase();
  bool _emailChanged(Customer c) => _emailValue.isNotEmpty && _emailValue != (c.email ?? '').toLowerCase();

  void _resetEmailForm(Customer c) {
    _email.text = c.email ?? '';
    _code.clear();
    _codeSentTo = null;
    _emailError = null;
  }

  Future<void> _sendCode() async {
    final email = _emailValue;
    if (!_emailRe.hasMatch(email) || _sendingCode || _resendIn > 0) return;
    setState(() {
      _sendingCode = true;
      _emailError = null;
    });
    try {
      await context.read<ShopState>().sendEmailCode(email);
      if (!mounted) return;
      _code.clear();
      setState(() {
        _codeSentTo = email;
        _resendIn = 30;
      });
      _resendTimer?.cancel();
      _resendTimer = Timer.periodic(const Duration(seconds: 1), (t) {
        if (!mounted || _resendIn <= 1) {
          t.cancel();
          if (mounted) setState(() => _resendIn = 0);
          return;
        }
        setState(() => _resendIn--);
      });
    } catch (e) {
      if (mounted) setState(() => _emailError = e.toString());
    } finally {
      if (mounted) setState(() => _sendingCode = false);
    }
  }

  void _push(Widget page) => Navigator.of(context).push(MaterialPageRoute(builder: (_) => page));

  /// "Хадгалах" зөвхөн нэрийг хадгална; имэйл 6 оронтой код оруулахад өөрөө хадгалагдана.
  bool _canSave(Customer c) {
    final name = _name.text.trim();
    return !_saving && name.isNotEmpty && name != (c.name ?? '');
  }

  /// 6 дахь орон оруулмагц кодыг шалгаж имэйлийг хадгална (товч хэрэггүй).
  Future<void> _verifyEmail(Customer c, String code) async {
    if (_saving || _codeSentTo != _emailValue) return;
    final shop = context.read<ShopState>();
    final name = _name.text.trim();
    setState(() {
      _saving = true;
      _emailError = null;
    });
    try {
      await shop.confirmEmail(_emailValue, code);
      if (name.isNotEmpty && name != (c.name ?? '')) await shop.updateName(name);
      if (!mounted) return;
      setState(() {
        _editing = false;
        _justSaved = true;
      });
      Future.delayed(const Duration(seconds: 2), () {
        if (mounted) setState(() => _justSaved = false);
      });
    } catch (e) {
      if (mounted) {
        _code.clear();
        setState(() => _emailError = e.toString());
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _save(Customer c) async {
    if (!_canSave(c)) return;
    final name = _name.text.trim();
    final shop = context.read<ShopState>();
    setState(() => _saving = true);
    try {
      await shop.updateName(name);
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
                Text(tr('Профайл тохиргоо'), style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text(tr('Хувийн мэдээлэл болон бүртгэлээ энд шинэчилнэ.'), style: TextStyle(fontSize: 14, color: Colors.grey.shade600)),
                const SizedBox(height: 24),
                _editing ? _editForm(c) : _profileCard(c),
                const SizedBox(height: 16),
                _menu(shop),
                const SizedBox(height: 16),
                _linkCard(
                  icon: Icons.storefront_outlined,
                  title: tr('Хамтран ажиллах'),
                  subtitle: tr('Дэлгүүрийнхээ мэдээллийг үлдээж, утсаа баталгаажуулна уу. Хүсэлт батлагдвал таны дэлгүүр нээгдэнэ.'),
                  onTap: () => _push(const SellerPage()),
                ),
                if (shop.isStaff || context.watch<AdminState>().signedIn) ...[
                  const SizedBox(height: 16),
                  _adminLink(),
                ],
                const SizedBox(height: 16),
                // Хэл солих товч (одоогоор зөвхөн монгол хэл):
                // Container(padding: const EdgeInsets.all(12), decoration: _box, child: const LanguagePicker()),
                // const SizedBox(height: 16),
                OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.red.shade600,
                    minimumSize: const Size.fromHeight(44),
                    side: const BorderSide(color: borderColor),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  onPressed: () => context.read<ShopState>().signOut(),
                  icon: const Icon(Icons.logout, size: 16),
                  label: Text(tr('Гарах')),
                ),
                // Админ бус дугаараар нэвтэрсэн ч админ / худалдагчийн нэвтрэх зам үргэлж үлдэнэ
                // (дээрх карт зөвхөн isStaff эсвэл админаар нэвтэрсэн үед гарна).
                if (!shop.isStaff && !context.watch<AdminState>().signedIn) ...[
                  const SizedBox(height: 8),
                  Center(
                    child: TextButton.icon(
                      style: TextButton.styleFrom(foregroundColor: Colors.grey.shade600),
                      onPressed: () => _push(const SignInPage(admin: true)),
                      icon: const Icon(Icons.admin_panel_settings_outlined, size: 16),
                      label: Text(tr('Админ / Худалдагч нэвтрэх'), style: const TextStyle(fontSize: 13)),
                    ),
                  ),
                ],
              ]),
      ),
    );
  }

  /// Нэвтрээгүй үед (BaagiiCar шиг) 2 таб: "Хэрэглэгч" — утасны кодоор,
  /// "Админ / Худалдагч" — утас, нууц үгээр (аль хэдийн нэвтэрсэн бол админ руу шилжих товч).
  Widget _signInPrompt() {
    final admin = context.watch<AdminState>();
    return DefaultTabController(
      length: 2,
      child: Column(children: [
        TabBar(
          labelColor: brandColor,
          indicatorColor: brandColor,
          unselectedLabelColor: Colors.grey.shade600,
          labelStyle: const TextStyle(fontWeight: FontWeight.w700),
          tabs: [Tab(text: tr('Хэрэглэгч')), Tab(text: tr('Админ / Худалдагч'))],
        ),
        Expanded(
          child: TabBarView(children: [
            ListView(padding: const EdgeInsets.all(16), children: [PhoneOtpForm(onDone: () {})]),
            ListView(padding: const EdgeInsets.all(16), children: [
              if (admin.signedIn) ...[
                const Icon(Icons.admin_panel_settings_outlined, size: 40, color: brandColor),
                const SizedBox(height: 12),
                Text(tr('{name} — та админ хэсэгт нэвтэрсэн байна.', {'name': admin.user?.name ?? ''}),
                    textAlign: TextAlign.center, style: TextStyle(color: Colors.grey.shade600)),
                const SizedBox(height: 16),
                FilledButton(
                  style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
                  onPressed: () => context.read<AppState>().openAdmin(),
                  child: Text(tr('Админ хэсэг рүү шилжих')),
                ),
              ] else
                const AdminLoginForm(),
            ]),
          ]),
        ),
      ]),
    );
  }

  /// Апп дээрх нэмэлт: худалдан авагчийн утсаар админ / дэлгүүрийн хэрэглэгч
  /// бүртгэлтэй (isStaff) үед л харагдана.
  Widget _adminLink() {
    final admin = context.watch<AdminState>();
    return admin.signedIn
        ? _linkCard(
            icon: Icons.admin_panel_settings_outlined,
            title: tr('Админ хэсэг рүү орох'),
            subtitle: admin.user?.name ?? '',
            onTap: () => context.read<AppState>().openAdmin(),
          )
        : _linkCard(
            icon: Icons.admin_panel_settings_outlined,
            title: tr('Админ / Худалдагч нэвтрэх'),
            subtitle: tr('Дэлгүүрийн админ хэсэгт нэвтэрнэ'),
            onTap: () => _push(const SignInPage(admin: true)),
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
            Text(hasName ? c.name!.trim() : tr('Нэр оруулаагүй'),
                maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
            const SizedBox(height: 2),
            Text(_formatPhone(c.phone), style: TextStyle(fontSize: 14, color: Colors.grey.shade600, fontFamily: 'monospace')),
            if (c.email?.isNotEmpty == true)
              Padding(
                padding: const EdgeInsets.only(top: 2),
                child: Text(c.email!, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 14, color: Colors.grey.shade600)),
              ),
            if (_justSaved)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Row(children: [
                  Icon(Icons.check, size: 16, color: Colors.green.shade600),
                  const SizedBox(width: 4),
                  Text(tr('Хадгалагдлаа'), style: TextStyle(color: Colors.green.shade600, fontSize: 14)),
                ]),
              ),
          ]),
        ),
        IconButton.outlined(
          tooltip: tr('Засах'),
          style: IconButton.styleFrom(side: const BorderSide(color: borderColor)),
          onPressed: () {
            _name.text = c.name ?? '';
            _resetEmailForm(c);
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
        child: ListenableBuilder(
          listenable: Listenable.merge([_name, _email, _code]),
          builder: (context, _) {
            final canSave = _canSave(c);
            final emailChanged = _emailChanged(c);
            final codeSent = emailChanged && _codeSentTo == _emailValue;
            return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              Text(tr('Хувийн мэдээлэл'), style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
              const SizedBox(height: 20),
              Text(tr('Нэр'), style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
              const SizedBox(height: 6),
              TextField(
                controller: _name,
                autofocus: true,
                textCapitalization: TextCapitalization.words,
                decoration: InputDecoration(hintText: tr('Нэрээ оруулна уу')),
                onSubmitted: (_) => _save(c),
              ),
              const SizedBox(height: 20),
              Text(tr('Утасны дугаар'), style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
              const SizedBox(height: 6),
              TextFormField(
                initialValue: _formatPhone(c.phone),
                enabled: false,
                decoration: InputDecoration(helperText: tr('Утасны дугаарыг өөрчлөх боломжгүй.')),
              ),
              const SizedBox(height: 20),
              Text(tr('И-мэйл'), style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
              const SizedBox(height: 6),
              TextField(
                controller: _email,
                keyboardType: TextInputType.emailAddress,
                autocorrect: false,
                autofillHints: const [AutofillHints.email],
                textInputAction: TextInputAction.send,
                onSubmitted: (_) => _sendCode(),
                decoration: InputDecoration(
                  hintText: 'name@example.com',
                  // BaagiiCar шиг "Код авах" товч талбар дотроо
                  suffixIcon: emailChanged
                      ? Padding(
                          padding: const EdgeInsets.all(6),
                          child: FilledButton(
                            style: FilledButton.styleFrom(
                              padding: const EdgeInsets.symmetric(horizontal: 12),
                              minimumSize: const Size(0, 36),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              textStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
                            ),
                            onPressed: _emailRe.hasMatch(_emailValue) && !_sendingCode && _resendIn == 0 ? _sendCode : null,
                            child: _sendingCode
                                ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                : Text(_resendIn > 0 && codeSent
                                    ? '${tr('Дахин авах')} ($_resendIn)'
                                    : codeSent
                                        ? tr('Дахин авах')
                                        : tr('Код авах')),
                          ),
                        )
                      : null,
                ),
                onChanged: (_) {
                  if (_emailError != null) setState(() => _emailError = null);
                },
              ),
              if (codeSent) ...[
                const SizedBox(height: 8),
                Text(tr('{email} хаяг руу код илгээлээ. Кодоо оруулахад шууд хадгалагдана.', {'email': _emailValue}),
                    style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                const SizedBox(height: 6),
                TextField(
                  controller: _code,
                  autofocus: true,
                  keyboardType: TextInputType.number,
                  maxLength: 6,
                  autofillHints: const [AutofillHints.oneTimeCode],
                  enabled: !_saving,
                  decoration: InputDecoration(hintText: tr('6 оронтой код'), counterText: ''),
                  onChanged: (v) {
                    if (_emailError != null) setState(() => _emailError = null);
                    if (v.trim().length == 6) _verifyEmail(c, v.trim());
                  },
                ),
              ],
              if (_emailError != null)
                Padding(
                  padding: const EdgeInsets.only(top: 6),
                  child: Text(_emailError!, style: TextStyle(fontSize: 12, color: Colors.red.shade600)),
                )
              else if (emailChanged && !codeSent)
                Padding(
                  padding: const EdgeInsets.only(top: 6),
                  child: Text(tr('«Код авах» дарж имэйлдээ ирсэн кодоор баталгаажуулна.'),
                      style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                ),
              const SizedBox(height: 20),
              Row(children: [
                Expanded(
                  child: OutlinedButton(
                    style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(44)),
                    onPressed: _saving ? null : () => setState(() => _editing = false),
                    child: Text(tr('Болих')),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: FilledButton(
                    style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(44)),
                    onPressed: canSave ? () => _save(c) : null,
                    child: _saving
                        ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : Text(tr('Хадгалах')),
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
      (Icons.assignment_outlined, tr('Миний захиалга'), 0, () => _push(const OrdersPage())),
      (Icons.shopping_cart_outlined, tr('Сагс'), shop.cartCount, () => widget.onOpenTab?.call(ShopTab.cart)),
      (Icons.favorite_border, tr('Хадгалсан бараа'), shop.saved.length, () => widget.onOpenTab?.call(ShopTab.saved)),
      (Icons.location_on_outlined, tr('Хүргэлтийн хаяг'), 0, () => _push(const AddressesPage())),
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
