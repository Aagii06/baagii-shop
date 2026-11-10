import 'package:flutter/material.dart';

// Админ вэбийн (admin/src/app/globals.css) өнгө, загварын хэсгүүд — апп
// вэбийн админаас ялгаагүй харагдана.

class AdminColors {
  static const background = Color(0xFFF9FAFC);
  static const foreground = Color(0xFF111827);
  static const primary = Color(0xFF7C1FA4);
  static const primarySoft = Color(0xFFF5E8FC);
  static const primaryInk = Color(0xFF731899);
  static const muted = Color(0xFFF3F4F6);
  static const mutedForeground = Color(0xFF6B7280);
  static const border = Color(0xFFE2E4E8);
  static const success = Color(0xFF059669);
  static const warning = Color(0xFFD97706);
  static const warningSoft = Color(0xFFFEF3C7);
  static const destructive = Color(0xFFDC2626);
  static const tintMint = Color(0xFFD1FAE5);
  static const tintMintInk = Color(0xFF047857);
  static const tintPeach = Color(0xFFFDEBD6);
  static const tintPeachInk = Color(0xFFC26A1B);
  static const tintBlue = Color(0xFFE5EAFF);
  static const tintBlueInk = Color(0xFF2F52C4);
}

/// Нэг өнгөний хослол: зөөлөн (badge, идэвхгүй chip) ба тод (идэвхтэй chip, товч).
class Tone {
  final Color softBg;
  final Color softFg;
  final Color solid;
  const Tone(this.softBg, this.softFg, this.solid);
}

/// web-ийн ORDER_TONE: хүлээгдэж буй — шар, баталсан — цэнхэр, хүргэсэн — ногоон, буцаасан — улаан, цуцалсан — саарал.
const orderTones = {
  'pending': Tone(AdminColors.warningSoft, AdminColors.warning, AdminColors.warning),
  'confirmed': Tone(AdminColors.tintBlue, AdminColors.tintBlueInk, AdminColors.tintBlueInk),
  'delivered': Tone(AdminColors.tintMint, AdminColors.tintMintInk, AdminColors.success),
  'returned': Tone(Color(0x1ADC2626), AdminColors.destructive, AdminColors.destructive),
  'cancelled': Tone(AdminColors.muted, AdminColors.mutedForeground, Color(0xB3111827)),
};

/// "₮1,234,567".
String mnt(num v) {
  final s = v.round().abs().toString();
  final b = StringBuffer();
  for (var i = 0; i < s.length; i++) {
    if (i > 0 && (s.length - i) % 3 == 0) b.write(',');
    b.write(s[i]);
  }
  return '${v < 0 ? '−' : ''}₮$b';
}

/// Статистикийн картад: "₮2.5сая", "₮178мянга" (доош нь бөөрөнхийлнө).
String mntCompact(num v) {
  if (v >= 1000000) return '₮${(v / 100000).floor() / 10}сая';
  if (v >= 1000) return '₮${(v / 1000).floor()}мянга';
  return mnt(v);
}

const mono = 'monospace';

/// Админ горимын theme: дэд хуудсууд web-ийн DetailHeader шиг (хүрээтэй дугуй
/// буцах товч, тод гарчиг), товч, талбарууд бөөрөнхий.
final adminTheme = ThemeData(
  useMaterial3: true,
  colorScheme: ColorScheme.fromSeed(seedColor: AdminColors.primary, primary: AdminColors.primary, surface: Colors.white),
  scaffoldBackgroundColor: AdminColors.background,
  dividerColor: AdminColors.border,
  dividerTheme: const DividerThemeData(color: AdminColors.border, space: 1, thickness: 1),
  appBarTheme: const AppBarTheme(
    backgroundColor: AdminColors.background,
    surfaceTintColor: Colors.transparent,
    scrolledUnderElevation: 0,
    centerTitle: false,
    toolbarHeight: 68,
    titleSpacing: 4,
    foregroundColor: AdminColors.foreground,
    titleTextStyle: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AdminColors.foreground),
    shape: Border(bottom: BorderSide(color: AdminColors.border)),
  ),
  actionIconTheme: ActionIconThemeData(
    backButtonIconBuilder: (_) => Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(color: Colors.white, shape: BoxShape.circle, border: Border.all(color: AdminColors.border)),
      child: const Icon(Icons.arrow_back, size: 20),
    ),
  ),
  filledButtonTheme: FilledButtonThemeData(
    style: FilledButton.styleFrom(
      shape: const StadiumBorder(),
      minimumSize: const Size(0, 44),
      textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
    ),
  ),
  outlinedButtonTheme: OutlinedButtonThemeData(
    style: OutlinedButton.styleFrom(
      shape: const StadiumBorder(),
      minimumSize: const Size(0, 44),
      foregroundColor: AdminColors.foreground,
      side: const BorderSide(color: AdminColors.border),
      textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
    ),
  ),
  inputDecorationTheme: InputDecorationTheme(
    filled: true,
    fillColor: Colors.white,
    contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: const BorderSide(color: AdminColors.border)),
    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: const BorderSide(color: AdminColors.primary, width: 1.5)),
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(24)),
  ),
  snackBarTheme: const SnackBarThemeData(behavior: SnackBarBehavior.floating),
  bottomSheetTheme: const BottomSheetThemeData(backgroundColor: Colors.white, surfaceTintColor: Colors.transparent),
  dialogTheme: const DialogThemeData(backgroundColor: Colors.white, surfaceTintColor: Colors.transparent),
);

/// Tab хуудсуудын дээд талын брэнд (лого + UVS SHOP / ADMIN).
class AdminBrandBar extends StatelessWidget {
  const AdminBrandBar({super.key});

  @override
  Widget build(BuildContext context) => Container(
        decoration: const BoxDecoration(
          color: AdminColors.background,
          border: Border(bottom: BorderSide(color: AdminColors.border)),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        child: Row(children: [
          Container(
            width: 40,
            height: 40,
            clipBehavior: Clip.antiAlias,
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white, width: 2),
            ),
            child: Image.asset('assets/logo.png', fit: BoxFit.contain),
          ),
          const SizedBox(width: 10),
          const Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
            Text('UVS SHOP', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, height: 1.1, letterSpacing: -0.3)),
            Text('ADMIN',
                style: TextStyle(
                    fontSize: 11, fontWeight: FontWeight.w700, color: AdminColors.primaryInk, letterSpacing: 2.2, height: 1.3)),
          ]),
        ]),
      );
}

/// Tab хуудсын суурь: дээр нь брэнд (түлхэж нээсэн бол буцах товчтой AppBar), доор нь агуулга.
class AdminTabScaffold extends StatelessWidget {
  final Widget body;

  /// Өөр хуудаснаас түлхэж нээсэн бол (жишээ нь худалдан авагчийн захиалга) — буцах гарчигтай.
  final String? pushedTitle;
  const AdminTabScaffold({super.key, required this.body, this.pushedTitle});

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: AdminColors.background,
        appBar: pushedTitle != null ? AppBar(title: Text(pushedTitle!), backgroundColor: AdminColors.background) : null,
        body: pushedTitle != null
            ? body
            : SafeArea(
                bottom: false,
                child: Column(children: [const AdminBrandBar(), Expanded(child: body)]),
              ),
      );
}

/// web-ийн PageHeader: том гарчиг (тоотой), баруун талд нь [aside], доор нь хайлт/шүүлтүүр.
class AdminPageHeader extends StatelessWidget {
  final String? title;
  final int? count;
  final Widget? aside;
  final List<Widget> children;
  const AdminPageHeader({super.key, this.title, this.count, this.aside, this.children = const []});

  @override
  Widget build(BuildContext context) => Container(
        decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: AdminColors.border))),
        padding: const EdgeInsets.fromLTRB(16, 20, 16, 16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          ConstrainedBox(
            constraints: const BoxConstraints(minHeight: 40),
            child: Row(children: [
              Expanded(
                child: title == null
                    ? const SizedBox()
                    : Text.rich(
                        TextSpan(children: [
                          TextSpan(text: title),
                          if (count != null)
                            TextSpan(
                              text: ' ($count)',
                              style: TextStyle(fontWeight: FontWeight.w600, color: AdminColors.mutedForeground.withValues(alpha: 0.7)),
                            ),
                        ]),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, height: 1.2),
                      ),
              ),
              ?aside,
            ]),
          ),
          for (final c in children) ...[const SizedBox(height: 16), c],
        ]),
      );
}

/// web-ийн "+ Нэмэх" маягийн жижиг товч.
class AdminSmallButton extends StatelessWidget {
  final String label;
  final IconData? icon;
  final VoidCallback? onPressed;
  const AdminSmallButton({super.key, required this.label, this.icon, this.onPressed});

  @override
  Widget build(BuildContext context) => FilledButton.icon(
        style: FilledButton.styleFrom(
          backgroundColor: AdminColors.primary,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          minimumSize: const Size(0, 38),
          shape: const StadiumBorder(),
          textStyle: const TextStyle(fontWeight: FontWeight.w600),
        ),
        onPressed: onPressed,
        icon: Icon(icon ?? Icons.add, size: 18),
        label: Text(label),
      );
}

/// web-ийн оруулах талбар (бөөрөнхий, цагаан).
InputDecoration adminSearchDecoration(String hint, {IconData? icon}) => InputDecoration(
      hintText: hint,
      prefixIcon: icon == null ? null : Icon(icon, size: 18, color: AdminColors.mutedForeground),
      filled: true,
      fillColor: Colors.white,
      isDense: true,
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(999), borderSide: const BorderSide(color: AdminColors.border)),
      focusedBorder:
          OutlineInputBorder(borderRadius: BorderRadius.circular(999), borderSide: const BorderSide(color: AdminColors.primary, width: 1.5)),
    );

/// web-ийн ChipTabs: хажуу тийш гүйдэг дугуй товчнууд, төлөв бүр өөрийн өнгөтэй, тоо badge-тай.
class PillTabs<T> extends StatelessWidget {
  final T value;
  final List<PillOption<T>> options;
  final ValueChanged<T> onChanged;
  final EdgeInsetsGeometry padding;
  const PillTabs({super.key, required this.value, required this.options, required this.onChanged, this.padding = EdgeInsets.zero});

  @override
  Widget build(BuildContext context) => SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        padding: padding,
        child: Row(children: [
          for (final o in options) ...[
            _pill(o, o.value == value),
            const SizedBox(width: 8),
          ],
        ]),
      );

  Widget _pill(PillOption<T> o, bool active) {
    final tone = o.tone;
    final bg = active ? (tone?.solid ?? AdminColors.primary) : (tone?.softBg ?? Colors.white);
    final fg = active ? Colors.white : (tone?.softFg ?? AdminColors.foreground);
    final border = active || tone != null ? Colors.transparent : AdminColors.border;
    return Material(
      color: bg,
      shape: StadiumBorder(side: BorderSide(color: border)),
      child: InkWell(
        customBorder: const StadiumBorder(),
        onTap: () => onChanged(o.value),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            Text(o.label, style: TextStyle(color: fg, fontSize: 14, fontWeight: FontWeight.w600)),
            if ((o.count ?? 0) > 0) ...[
              const SizedBox(width: 6),
              Container(
                constraints: const BoxConstraints(minWidth: 20),
                height: 20,
                padding: const EdgeInsets.symmetric(horizontal: 6),
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: active ? Colors.white : (o.badgeColor ?? AdminColors.primary),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text('${o.count}',
                    style: TextStyle(
                      fontFamily: mono,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: active ? (tone != null ? AdminColors.foreground : AdminColors.primaryInk) : Colors.white,
                    )),
              ),
            ],
          ]),
        ),
      ),
    );
  }
}

class PillOption<T> {
  final T value;
  final String label;
  final int? count;
  final Tone? tone;
  final Color? badgeColor;
  const PillOption(this.value, this.label, {this.count, this.tone, this.badgeColor});
}

/// Захиалгын төлөвийн badge.
class OrderStatusBadge extends StatelessWidget {
  final String status;
  final String label;
  const OrderStatusBadge(this.status, this.label, {super.key});

  @override
  Widget build(BuildContext context) {
    final t = orderTones[status] ?? orderTones['cancelled']!;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
      decoration: BoxDecoration(color: t.softBg, borderRadius: BorderRadius.circular(20)),
      child: Text(label, style: TextStyle(color: t.softFg, fontSize: 12, fontWeight: FontWeight.w600)),
    );
  }
}

/// web-ийн Card: цагаан, нимгэн хүрээ, дугуй булан. Material тул доторх
/// ListTile, InkWell зөв зурагдана.
class AdminCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  const AdminCard({super.key, required this.child, this.padding = EdgeInsets.zero});

  @override
  Widget build(BuildContext context) => DecoratedBox(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          boxShadow: const [BoxShadow(color: Color(0x0A000000), blurRadius: 6, offset: Offset(0, 1))],
        ),
        child: Material(
          color: Colors.white,
          clipBehavior: Clip.antiAlias,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: const BorderSide(color: AdminColors.border)),
          child: Padding(padding: padding, child: child),
        ),
      );
}

/// Жагсаалтын цагаан, дээр доороо зураастай хэсэг (web-ийн `divide-y` ul).
class AdminList extends StatelessWidget {
  final List<Widget> children;
  const AdminList({super.key, required this.children});

  @override
  Widget build(BuildContext context) => Material(
        color: Colors.white,
        shape: const Border(bottom: BorderSide(color: AdminColors.border)),
        child: Column(children: [
          for (var i = 0; i < children.length; i++) ...[
            if (i > 0) const Divider(height: 1, thickness: 1, color: AdminColors.border),
            children[i],
          ],
        ]),
      );
}
