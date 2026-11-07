import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

const brandColor = Color(0xFF7322A6);

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

class LoadingView extends StatelessWidget {
  const LoadingView({super.key});
  @override
  Widget build(BuildContext context) => const Center(child: CircularProgressIndicator());
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
