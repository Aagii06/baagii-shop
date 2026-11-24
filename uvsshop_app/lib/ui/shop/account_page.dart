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
import 'email_code_dialog.dart';
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
  // Хадгалах/Болих товчгүй: нэр Enter эсвэл талбараас гарахад хадгалагдана,
  // имэйл "Код авах" → цонхонд код оруулмагц хадгалагдана, ✕ маягтыг хаана.
  final _name = TextEditingController();
  final _nameFocus = FocusNode();
  final _email = TextEditingController();
  String? _emailError;
  bool _sendingCode = false;
  // Сүүлд код илгээсэн хаяг, цаг — 30 секундэд дахин илгээхгүй, цонхыг л нээнэ.
  String? _codeSentTo;
  DateTime? _codeSentAt;
  bool _editing = false;
  bool _justSaved = false;

  @override
  void initState() {
    super.initState();
    _nameFocus.addListener(() {
      if (!_nameFocus.hasFocus) _saveName();
    });
  }

  @override
  void dispose() {
    _name.dispose();
    _nameFocus.dispose();
    _email.dispose();
    super.dispose();
  }

  static final _emailRe = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');
  String get _emailValue => _email.text.trim().toLowerCase();
  bool _emailChanged(Customer c) => _emailValue.isNotEmpty && _emailValue != (c.email ?? '').toLowerCase();

  void _flashSaved() {
    setState(() => _justSaved = true);
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) setState(() => _justSaved = false);
    });
  }

  /// Нэр өөрчлөгдсөн бол хадгална (хоосон бол хуучнаар нь буцаана).
  Future<void> _saveName() async {
    final shop = context.read<ShopState>();
    final c = shop.customer;
    if (c == null) return;
    final name = _name.text.trim();
    if (name.isEmpty) {
      _name.text = c.name ?? '';
      return;
    }
    if (name == (c.name ?? '')) return;
    try {
      await shop.updateName(name);
      if (mounted) _flashSaved();
    } catch (e) {
      if (mounted) showMessage(context, e.toString(), error: true);
    }
  }

  void _closeForm() {
    _nameFocus.unfocus();
    _saveName();
    setState(() {
      _emailError = null;
      _editing = false;
    });
  }

  int get _resendLeft {
    if (_codeSentAt == null || _codeSentTo != _emailValue) return 0;
    final left = 30 - DateTime.now().difference(_codeSentAt!).inSeconds;
    return left > 0 ? left : 0;
  }

  /// Код илгээнэ; алдааны текст, амжилттай бол null.
  Future<String?> _requestCode(String email) async {
    try {
      await context.read<ShopState>().sendEmailCode(email);
      _codeSentTo = email;
      _codeSentAt = DateTime.now();
      return null;
    } catch (e) {
      return e.toString();
    }
  }

  /// "Код авах": хаягийг шалгаад код илгээж, код оруулах цонхыг нээнэ.
  Future<void> _sendCode() async {
    if (_sendingCode) return;
    final email = _emailValue;
    // Буруу хаяг: цонх нээхийн өмнө анхааруулна.
    if (!_emailRe.hasMatch(email)) {
      final msg = tr('Имэйл хаяг буруу байна. Шалгаад дахин оруулна уу');
      setState(() => _emailError = msg);
      showMessage(context, msg, error: true);
      return;
    }
    FocusScope.of(context).unfocus();
    setState(() {
      _sendingCode = true;
      _emailError = null;
    });
    final error = _resendLeft > 0 ? null : await _requestCode(email);
    if (!mounted) return;
    setState(() {
      _sendingCode = false;
      _emailError = error;
    });
    if (error != null) return showMessage(context, error, error: true);

    final shop = context.read<ShopState>();
    final saved = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (_) => EmailCodeDialog(
        email: email,
        resendIn: _resendLeft,
        onResend: () => _requestCode(email),
        onVerify: (code) async {
          try {
            await shop.confirmEmail(email, code);
            return null;
          } catch (e) {
            return e.toString();
          }
        },
      ),
    );
    if (saved != true || !mounted) return;
    _codeSentTo = null;
    _codeSentAt = null;
    await _saveName();
    if (!mounted) return;
    setState(() => _editing = false);
    _flashSaved();
  }

  void _push(Widget page) => Navigator.of(context).push(MaterialPageRoute(builder: (_) => page));

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
            _email.text = c.email ?? '';
            setState(() {
              _emailError = null;
              _editing = true;
            });
          },
          icon: const Icon(Icons.edit_outlined, size: 16),
        ),
      ]),
    );
  }

  Widget _editForm(Customer c) => Container(
        decoration: _box,
        padding: const EdgeInsets.fromLTRB(16, 8, 8, 16),
        child: ListenableBuilder(
          listenable: _email,
          builder: (context, _) {
            final emailChanged = _emailChanged(c);
            return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              Row(children: [
                Text(tr('Хувийн мэдээлэл'), style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                if (_justSaved) ...[
                  const SizedBox(width: 8),
                  Icon(Icons.check, size: 14, color: Colors.green.shade600),
                  const SizedBox(width: 2),
                  Text(tr('Хадгалагдлаа'), style: TextStyle(color: Colors.green.shade600, fontSize: 12)),
                ],
                const Spacer(),
                IconButton(tooltip: tr('Хаах'), onPressed: _closeForm, icon: const Icon(Icons.close, size: 20)),
              ]),
              Padding(
                padding: const EdgeInsets.only(right: 8),
                child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                  const SizedBox(height: 8),
                  Text(tr('Нэр'), style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _name,
                    focusNode: _nameFocus,
                    autofocus: true,
                    textCapitalization: TextCapitalization.words,
                    textInputAction: TextInputAction.done,
                    decoration: InputDecoration(hintText: tr('Нэрээ оруулна уу')),
                    onSubmitted: (_) => _saveName(),
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
                    onSubmitted: (_) {
                      if (emailChanged) _sendCode();
                    },
                    onChanged: (_) {
                      if (_emailError != null) setState(() => _emailError = null);
                    },
                    decoration: InputDecoration(
                      hintText: 'name@example.com',
                      errorText: _emailError,
                      errorMaxLines: 3,
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
                                onPressed: _sendingCode ? null : _sendCode,
                                child: _sendingCode
                                    ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                    : Text(tr('Код авах')),
                              ),
                            )
                          : null,
                      helperText: emailChanged && _emailError == null ? tr('«Код авах» дарж имэйлдээ ирсэн кодоор баталгаажуулна.') : null,
                      helperMaxLines: 2,
                    ),
                  ),
                ]),
              ),
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
