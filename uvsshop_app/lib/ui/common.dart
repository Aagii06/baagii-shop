import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

const brandColor = Color(0xFF7322A6);

/// web-ийн `brand-gradient` (--gradient-from → --gradient-to).
const brandGradient = LinearGradient(
  begin: Alignment.topLeft,
  end: Alignment.bottomRight,
  colors: [Color(0xFF7322A6), Color(0xFF4F5BDD)],
);

/// web-ийн --accent (цайвар ягаан) ба --muted.
const accentColor = Color(0xFFF3E8F8);
const mutedColor = Color(0xFFF3F4F6);
const borderColor = Color(0xFFE5E7EB);

String money(num v) {
  final s = v.round().abs().toString();
  final b = StringBuffer();
  for (var i = 0; i < s.length; i++) {
    if (i > 0 && (s.length - i) % 3 == 0) b.write(',');
    b.write(s[i]);
  }
  return '${v < 0 ? '−' : ''}$b₮';
}

String formatDate(String? iso, {bool time = true}) {
  final d = iso == null ? null : DateTime.tryParse(iso)?.toLocal();
  if (d == null) return '';
  String two(int n) => n.toString().padLeft(2, '0');
  final date = '${d.year}.${two(d.month)}.${two(d.day)}';
  return time ? '$date ${two(d.hour)}:${two(d.minute)}' : date;
}

/// HTML тайлбарыг энгийн текст болгоно.
String stripHtml(String? html) {
  if (html == null) return '';
  return html
      .replaceAll(RegExp(r'<br\s*/?>|</p>|</li>|</h\d>', caseSensitive: false), '\n')
      .replaceAll(RegExp(r'<li[^>]*>', caseSensitive: false), '• ')
      .replaceAll(RegExp(r'<[^>]+>'), '')
      .replaceAll('&nbsp;', ' ')
      .replaceAll('&amp;', '&')
      .replaceAll('&lt;', '<')
      .replaceAll('&gt;', '>')
      .replaceAll('&quot;', '"')
      .replaceAll(RegExp(r'\n{3,}'), '\n\n')
      .trim();
}

String digitsOnly(String s) => s.replaceAll(RegExp(r'\D'), '');

class NetImage extends StatelessWidget {
  final String? url;
  final BoxFit fit;
  final double? width;
  final double? height;
  final BorderRadius? radius;
  const NetImage(this.url, {super.key, this.fit = BoxFit.cover, this.width, this.height, this.radius});

  @override
  Widget build(BuildContext context) {
    final placeholder = Container(
      width: width,
      height: height,
      color: Colors.grey.shade100,
      alignment: Alignment.center,
      child: Icon(Icons.image_outlined, color: Colors.grey.shade400),
    );
    final img = url == null
        ? placeholder
        : CachedNetworkImage(
            imageUrl: url!,
            fit: fit,
            width: width,
            height: height,
            placeholder: (_, _) => placeholder,
            errorWidget: (_, _, _) => placeholder,
          );
    return radius == null ? img : ClipRRect(borderRadius: radius!, child: img);
  }
}

enum SkeletonKind { list, grid, product, detail, stats }

/// Ачаалж байх үеийн skeleton (web-ийн animate-pulse шиг анивчина) —
/// ирэх агуулгын хэлбэртэй: жагсаалт, барааны grid, барааны хуудас,
/// дэлгэрэнгүй, тайлангийн карт.
class LoadingView extends StatelessWidget {
  final SkeletonKind kind;

  /// Жагсаалт/grid-ийн мөрийн тоо.
  final int count;
  const LoadingView({super.key, this.kind = SkeletonKind.list, this.count = 6});

  @override
  Widget build(BuildContext context) {
    final content = switch (kind) {
      SkeletonKind.list => Column(children: [for (var i = 0; i < count; i++) const _ListRowBone()]),
      SkeletonKind.grid => GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 0.62,
          children: [for (var i = 0; i < count; i++) const _CardBone()],
        ),
      SkeletonKind.product => Column(crossAxisAlignment: CrossAxisAlignment.start, children: const [
          AspectRatio(aspectRatio: 1, child: Bone()),
          SizedBox(height: 16),
          Bone(width: 220, height: 22),
          SizedBox(height: 10),
          Bone(width: 140, height: 28),
          SizedBox(height: 10),
          Bone(width: 90, height: 14),
          SizedBox(height: 20),
          Bone(height: 14),
          SizedBox(height: 8),
          Bone(height: 14),
          SizedBox(height: 8),
          Bone(width: 200, height: 14),
        ]),
      SkeletonKind.detail => Column(children: [
          const Bone(height: 90, radius: 12),
          const SizedBox(height: 10),
          for (var i = 0; i < 3; i++) const _ListRowBone(),
          const SizedBox(height: 10),
          const Bone(height: 110, radius: 12),
        ]),
      SkeletonKind.stats => Column(children: const [
          Row(children: [
            Expanded(child: Bone(height: 84, radius: 12)),
            SizedBox(width: 12),
            Expanded(child: Bone(height: 84, radius: 12)),
          ]),
          SizedBox(height: 12),
          Bone(height: 220, radius: 12),
        ]),
    };
    return Semantics(
      label: 'Ачаалж байна',
      child: SingleChildScrollView(
        physics: const NeverScrollableScrollPhysics(),
        padding: const EdgeInsets.all(12),
        child: Pulse(child: content),
      ),
    );
  }
}

/// Хүүхэд widget-ийг анивчуулна (skeleton-д).
class Pulse extends StatefulWidget {
  final Widget child;
  const Pulse({super.key, required this.child});
  @override
  State<Pulse> createState() => _PulseState();
}

class _PulseState extends State<Pulse> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(vsync: this, duration: const Duration(milliseconds: 900))
    ..repeat(reverse: true);

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) =>
      FadeTransition(opacity: Tween<double>(begin: 0.45, end: 1).animate(_c), child: widget.child);
}

/// Skeleton-ий саарал хэсэг.
class Bone extends StatelessWidget {
  final double? width;
  final double height;
  final double radius;
  const Bone({super.key, this.width, this.height = 14, this.radius = 6});

  @override
  Widget build(BuildContext context) => Container(
        width: width,
        height: height,
        decoration: BoxDecoration(color: const Color(0xFFECEDF1), borderRadius: BorderRadius.circular(radius)),
      );
}

class _ListRowBone extends StatelessWidget {
  const _ListRowBone();
  @override
  Widget build(BuildContext context) => Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
        child: const Row(children: [
          Bone(width: 52, height: 52, radius: 8),
          SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Bone(width: 160, height: 14),
              SizedBox(height: 8),
              Bone(width: 100, height: 12),
            ]),
          ),
          SizedBox(width: 12),
          Bone(width: 56, height: 14),
        ]),
      );
}

class _CardBone extends StatelessWidget {
  const _CardBone();
  @override
  Widget build(BuildContext context) => Container(
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8)),
        clipBehavior: Clip.antiAlias,
        child: const Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          AspectRatio(aspectRatio: 1, child: Bone(radius: 0)),
          Padding(
            padding: EdgeInsets.all(12),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Bone(width: 80, height: 16),
              SizedBox(height: 8),
              Bone(width: 120, height: 12),
            ]),
          ),
        ]),
      );
}

class ErrorView extends StatelessWidget {
  final Object error;
  final VoidCallback? onRetry;
  const ErrorView(this.error, {super.key, this.onRetry});

  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            const Icon(Icons.cloud_off, size: 48, color: Colors.grey),
            const SizedBox(height: 12),
            Text(error.toString(), textAlign: TextAlign.center),
            if (onRetry != null) ...[
              const SizedBox(height: 12),
              OutlinedButton(onPressed: onRetry, child: const Text('Дахин оролдох')),
            ],
          ]),
        ),
      );
}

class EmptyView extends StatelessWidget {
  final IconData icon;
  final String text;
  final Widget? action;
  const EmptyView({super.key, required this.icon, required this.text, this.action});

  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Icon(icon, size: 56, color: Colors.grey.shade400),
            const SizedBox(height: 12),
            Text(text, textAlign: TextAlign.center, style: TextStyle(color: Colors.grey.shade700)),
            if (action != null) ...[const SizedBox(height: 16), action!],
          ]),
        ),
      );
}

void showMessage(BuildContext context, String text, {bool error = false}) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(content: Text(text), backgroundColor: error ? Colors.red.shade700 : null));
}

class StatusChip extends StatelessWidget {
  final String label;
  final Color color;
  const StatusChip(this.label, this.color, {super.key});

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(20)),
        child: Text(label, style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600)),
      );
}

Color orderStatusColor(String status, {bool paid = false}) {
  switch (status) {
    case 'cancelled':
      return Colors.red;
    case 'returned':
      return Colors.blueGrey;
    case 'delivered':
      return Colors.green;
    case 'confirmed':
      return Colors.blue;
    default:
      return paid ? Colors.blue : Colors.orange;
  }
}
