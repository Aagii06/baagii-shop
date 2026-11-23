import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../config.dart';
import '../common.dart';
import 'package:uvsshop_app/i18n.dart';

/// web-ийн components/product/ShareButtons.tsx: Facebook, X, Telegram, холбоос
/// хуулах, утасны өөрийн share цэс. [light] — өнгөлөг толгой дээрх цагаан товч.
class ShareButtons extends StatefulWidget {
  final String title;

  /// Вэб дээрх зам, жишээ нь `/product/12`, `/store?id=3`.
  final String path;
  final bool light;
  const ShareButtons({super.key, required this.title, required this.path, this.light = false});

  @override
  State<ShareButtons> createState() => _ShareButtonsState();
}

class _ShareButtonsState extends State<ShareButtons> {
  bool _copied = false;

  String get _url => '${AppConfig.webOrigin}${widget.path}';

  Future<void> _open(String href) async {
    if (!await launchUrl(Uri.parse(href), mode: LaunchMode.externalApplication) && mounted) {
      showMessage(context, tr('Нээж чадсангүй'), error: true);
    }
  }

  Future<void> _copy() async {
    await Clipboard.setData(ClipboardData(text: _url));
    if (!mounted) return;
    setState(() => _copied = true);
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) setState(() => _copied = false);
    });
  }

  void _native(BuildContext context) {
    final box = context.findRenderObject() as RenderBox?;
    SharePlus.instance.share(ShareParams(
      text: '${widget.title}\n$_url',
      subject: widget.title,
      // iPad дээр share цонх товчноос гарна.
      sharePositionOrigin: box == null ? null : box.localToGlobal(Offset.zero) & box.size,
    ));
  }

  @override
  Widget build(BuildContext context) {
    final u = Uri.encodeComponent(_url);
    final text = Uri.encodeComponent(widget.title);
    final light = widget.light;
    // Өнгөлөг толгой дээр бүгд хагас тунгалаг цагаан; энгийн үед брэндийн өнгөтэй.
    Color bg(Color c) => light ? Colors.white.withValues(alpha: 0.18) : c;
    return Wrap(crossAxisAlignment: WrapCrossAlignment.center, runSpacing: 8, children: [
      Padding(
        padding: const EdgeInsets.only(right: 10),
        child: Text(tr('Хуваалцах'),
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: light ? Colors.white.withValues(alpha: 0.85) : Colors.grey.shade600,
            )),
      ),
      _Circle(
        label: 'Facebook',
        color: bg(const Color(0xFF1877F2)),
        onTap: () => _open('https://www.facebook.com/sharer/sharer.php?u=$u'),
        child: const Text('f', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w900, height: 1)),
      ),
      _Circle(
        label: 'X',
        color: bg(Colors.black),
        onTap: () => _open('https://x.com/intent/post?url=$u&text=$text'),
        child: const Text('𝕏', style: TextStyle(color: Colors.white, fontSize: 16, height: 1)),
      ),
      _Circle(
        label: 'Telegram',
        color: bg(const Color(0xFF229ED9)),
        onTap: () => _open('https://t.me/share/url?url=$u&text=$text'),
        child: const Icon(Icons.send_rounded, size: 17, color: Colors.white),
      ),
      _Circle(
        label: _copied ? tr('Холбоос хуулагдлаа') : tr('Холбоос хуулах'),
        color: _copied ? Colors.green.shade600 : (light ? bg(Colors.white) : accentColor),
        onTap: _copy,
        child: Icon(
          _copied ? Icons.check_rounded : Icons.link_rounded,
          size: 19,
          color: _copied || light ? Colors.white : brandColor,
        ),
      ),
      Builder(
        builder: (context) => _Circle(
          label: tr('Хуваалцах'),
          color: bg(brandColor),
          onTap: () => _native(context),
          child: const Icon(Icons.share_rounded, size: 17, color: Colors.white),
        ),
      ),
    ]);
  }
}

class _Circle extends StatelessWidget {
  final String label;
  final Color color;
  final Widget child;
  final VoidCallback onTap;
  const _Circle({required this.label, required this.color, required this.child, required this.onTap});

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(right: 8),
        child: Tooltip(
          message: label,
          child: Semantics(
            button: true,
            label: label,
            child: GestureDetector(
              onTap: onTap,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                width: 38,
                height: 38,
                alignment: Alignment.center,
                decoration: BoxDecoration(color: color, shape: BoxShape.circle),
                child: child,
              ),
            ),
          ),
        ),
      );
}
