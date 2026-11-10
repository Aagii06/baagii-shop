import 'dart:async';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../../api/api_client.dart';
import '../../config.dart';
import '../common.dart';

// Админы профайл цэсний хуудсуудад давтагддаг хэсгүүд (web-ийн
// DetailHeader, Confirm, Toast, Field, PasswordInput, код асуух sheet).

final emailRe = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');

/// "99112233" → "9911 2233".
String formatPhone(String digits) => digits.length > 4 ? '${digits.substring(0, 4)} ${digits.substring(4)}' : digits;

/// Өнөөдөр бол цаг, бусад үед огноо+цаг.
String formatWhen(String? iso) {
  final d = iso == null ? null : DateTime.tryParse(iso)?.toLocal();
  if (d == null) return '—';
  final now = DateTime.now();
  String two(int n) => n.toString().padLeft(2, '0');
  if (d.year == now.year && d.month == now.month && d.day == now.day) return 'Өнөөдөр ${two(d.hour)}:${two(d.minute)}';
  return formatDate(iso);
}

/// Үйлдлийг ажиллуулж амжилт/алдааг snackbar-аар харуулна. Амжилттай бол true.
Future<bool> runAction(BuildContext context, Future<void> Function() fn, [String? success]) async {
  final messenger = ScaffoldMessenger.of(context);
  try {
    await fn();
    if (success != null) {
      messenger
        ..hideCurrentSnackBar()
        ..showSnackBar(SnackBar(content: Text(success)));
    }
    return true;
  } catch (e) {
    messenger
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: Colors.red.shade700));
    return false;
  }
}

/// "Итгэлтэй байна уу?" цонх.
Future<bool> confirmAction(
  BuildContext context, {
  required String title,
  String? description,
  required String confirmLabel,
  bool danger = false,
}) async {
  final ok = await showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
      content: description == null ? null : Text(description),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Болих')),
        FilledButton(
          style: danger ? FilledButton.styleFrom(backgroundColor: Colors.red.shade600) : null,
          onPressed: () => Navigator.pop(ctx, true),
          child: Text(confirmLabel),
        ),
      ],
    ),
  );
  return ok == true;
}

/// AppBar-ын "Хадгалах" товч.
class SaveAction extends StatelessWidget {
  final bool enabled;
  final bool busy;
  final VoidCallback onPressed;
  final String label;
  const SaveAction({super.key, required this.enabled, required this.busy, required this.onPressed, this.label = 'Хадгалах'});

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(right: 8),
        child: Center(
          child: FilledButton(
            onPressed: enabled && !busy ? onPressed : null,
            child: busy
                ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : Text(label),
          ),
        ),
      );
}

/// Бүх оруулах талбарт ижил хүрээ.
InputDecoration fieldDecoration(String label, {String? hint, String? error, Widget? suffix, String? helper}) => InputDecoration(
      labelText: label,
      hintText: hint,
      errorText: error,
      helperText: helper,
      helperMaxLines: 3,
      errorMaxLines: 3,
      suffixIcon: suffix,
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
    );

/// Нууц үг, харуулах/нуух товчтой.
class PasswordField extends StatefulWidget {
  final TextEditingController controller;
  final String label;
  final String? helper;
  final String? error;
  final bool enabled;
  final ValueChanged<String>? onChanged;
  const PasswordField(
      {super.key, required this.controller, required this.label, this.helper, this.error, this.enabled = true, this.onChanged});

  @override
  State<PasswordField> createState() => _PasswordFieldState();
}

class _PasswordFieldState extends State<PasswordField> {
  bool _shown = false;
  @override
  Widget build(BuildContext context) => TextField(
        controller: widget.controller,
        enabled: widget.enabled,
        obscureText: !_shown,
        autocorrect: false,
        enableSuggestions: false,
        onChanged: widget.onChanged,
        decoration: fieldDecoration(
          widget.label,
          helper: widget.helper,
          error: widget.error,
          suffix: IconButton(
            tooltip: _shown ? 'Нууц үг нуух' : 'Нууц үг харуулах',
            icon: Icon(_shown ? Icons.visibility_off_outlined : Icons.visibility_outlined),
            onPressed: () => setState(() => _shown = !_shown),
          ),
        ),
      );
}

/// Цэсний нэг мөр: өнгөт дүрс, гарчиг, тайлбар.
class MenuTile extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  const MenuTile({super.key, required this.icon, required this.color, required this.title, required this.subtitle, required this.onTap});

  @override
  Widget build(BuildContext context) => InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: color.withValues(alpha: 0.25)),
              ),
              child: Icon(icon, color: color, size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                Text(subtitle,
                    maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 13, color: Colors.grey.shade600)),
              ]),
            ),
            Icon(Icons.chevron_right, color: Colors.grey.shade500),
          ]),
        ),
      );
}

/// Цагаан, дугуй булантай карт.
class Panel extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  const Panel({super.key, required this.child, this.padding = EdgeInsets.zero});

  @override
  Widget build(BuildContext context) => Container(
        padding: padding,
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: borderColor),
        ),
        child: child,
      );
}

/// Шүүлтүүрийн chip-үүд (web-ийн ChipTabs).
class ChipTabs<T> extends StatelessWidget {
  final T value;
  final List<(T, String, int?)> options;
  final ValueChanged<T> onChanged;
  const ChipTabs({super.key, required this.value, required this.options, required this.onChanged});

  @override
  Widget build(BuildContext context) => SizedBox(
        height: 44,
        child: ListView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          children: [
            for (final (v, label, count) in options)
              Padding(
                padding: const EdgeInsets.only(right: 8),
                child: ChoiceChip(
                  showCheckmark: false,
                  label: Text(count != null && count > 0 ? '$label ($count)' : label),
                  selected: v == value,
                  onSelected: (_) => onChanged(v),
                ),
              ),
          ],
        ),
      );
}

/// Зургийн file id-аар (эсвэл шинээр сонгосон bytes-аар) дүрс харуулна.
class ImageBox extends StatelessWidget {
  final String? fileId;
  final Uint8List? bytes;
  final double size;
  final bool circle;
  final IconData placeholder;
  const ImageBox({super.key, this.fileId, this.bytes, required this.size, this.circle = false, this.placeholder = Icons.image_outlined});

  @override
  Widget build(BuildContext context) {
    final radius = BorderRadius.circular(circle ? size : size * 0.2);
    final Widget child = bytes != null
        ? Image.memory(bytes!, width: size, height: size, fit: BoxFit.cover)
        : fileId != null
            ? NetImage(fileUrl(fileId, size <= 64 ? 'icon' : 'thumbnail'), width: size, height: size)
            : Container(
                width: size,
                height: size,
                color: mutedColor,
                child: Icon(placeholder, color: Colors.grey.shade400, size: size * 0.45),
              );
    return ClipRRect(borderRadius: radius, child: SizedBox(width: size, height: size, child: child));
  }
}

/// Сонгосон зураг (хуулахаас өмнө).
class PickedImage {
  final Uint8List bytes;
  final String name;
  PickedImage(this.bytes, this.name);
}

/// Backend-ийн зөвшөөрөх дээд хэмжээ (MB).
const maxImageMb = 50;

/// Галерейгаас нэг зураг сонгуулна. Хэт том бол алдаа харуулж null буцаана.
Future<PickedImage?> pickImage(BuildContext context) async {
  final XFile? file;
  try {
    file = await ImagePicker().pickImage(source: ImageSource.gallery, maxWidth: 1600, maxHeight: 1600, imageQuality: 90);
  } catch (e) {
    if (context.mounted) showMessage(context, 'Зураг сонгож чадсангүй: $e', error: true);
    return null;
  }
  if (file == null) return null;
  final bytes = await file.readAsBytes();
  if (bytes.length > maxImageMb * 1024 * 1024) {
    if (context.mounted) showMessage(context, 'Зураг $maxImageMb MB-аас том байна', error: true);
    return null;
  }
  return PickedImage(bytes, file.name);
}

/// Хүсэлтийн хариуны алдааны мессеж.
String errorText(Object e) => e is ApiException ? e.message : e.toString();

/// Баталгаажуулах код асуух доод sheet. [onResend] — дахин код авах (амжилттай бол true),
/// [onConfirm] — кодоор баталгаажуулах (амжилттай бол true, sheet хаагдана).
Future<bool> showCodeSheet(
  BuildContext context, {
  required String hint,
  required Future<bool> Function() onResend,
  required Future<bool> Function(String code) onConfirm,
  int initialCooldown = 60,
}) async {
  final ok = await showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (_) => _CodeSheet(hint: hint, onResend: onResend, onConfirm: onConfirm, cooldown: initialCooldown),
  );
  return ok == true;
}

class _CodeSheet extends StatefulWidget {
  final String hint;
  final Future<bool> Function() onResend;
  final Future<bool> Function(String code) onConfirm;
  final int cooldown;
  const _CodeSheet({required this.hint, required this.onResend, required this.onConfirm, required this.cooldown});

  @override
  State<_CodeSheet> createState() => _CodeSheetState();
}

class _CodeSheetState extends State<_CodeSheet> {
  final _code = TextEditingController();
  Timer? _timer;
  late int _cooldown = widget.cooldown;
  bool _busy = false;
  bool _sending = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _tick();
  }

  void _tick() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted || _cooldown <= 0) return t.cancel();
      setState(() => _cooldown--);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _code.dispose();
    super.dispose();
  }

  Future<void> _resend() async {
    setState(() => _sending = true);
    final ok = await widget.onResend();
    if (!mounted) return;
    setState(() {
      _sending = false;
      if (ok) {
        _cooldown = 60;
        _code.clear();
      }
    });
    if (ok) _tick();
  }

  Future<void> _confirm() async {
    final code = _code.text.trim();
    if (code.isEmpty) return setState(() => _error = 'Код оруулна уу');
    setState(() => _busy = true);
    final ok = await widget.onConfirm(code);
    if (!mounted) return;
    setState(() => _busy = false);
    if (ok) Navigator.pop(context, true);
  }

  @override
  Widget build(BuildContext context) => Padding(
        padding: EdgeInsets.fromLTRB(24, 0, 24, 24 + MediaQuery.viewInsetsOf(context).bottom),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          CircleAvatar(radius: 24, backgroundColor: accentColor, child: Icon(Icons.mail_outline, color: brandColor)),
          const SizedBox(height: 12),
          const Text('Баталгаажуулах код', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
          const SizedBox(height: 6),
          Text(widget.hint, textAlign: TextAlign.center, style: TextStyle(color: Colors.grey.shade600)),
          const SizedBox(height: 16),
          TextField(
            controller: _code,
            autofocus: true,
            keyboardType: TextInputType.number,
            maxLength: 6,
            textAlign: TextAlign.center,
            autofillHints: const [AutofillHints.oneTimeCode],
            style: const TextStyle(fontSize: 22, letterSpacing: 8, fontFamily: 'monospace'),
            onChanged: (_) => setState(() => _error = null),
            onSubmitted: (_) => _confirm(),
            decoration: fieldDecoration('', error: _error).copyWith(labelText: null, counterText: ''),
          ),
          Align(
            alignment: Alignment.centerLeft,
            child: TextButton(
              onPressed: _sending || _cooldown > 0 ? null : _resend,
              child: Text(_cooldown > 0 ? 'Дахин авах ($_cooldown)' : 'Дахин авах'),
            ),
          ),
          const SizedBox(height: 8),
          Row(children: [
            Expanded(
              child: OutlinedButton(onPressed: () => Navigator.pop(context, false), child: const Text('Болих')),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: FilledButton(
                onPressed: _busy ? null : _confirm,
                child: _busy
                    ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Баталгаажуулах'),
              ),
            ),
          ]),
        ]),
      );
}

/// Жагсаалтын хуудсуудын ачаалал/алдаа/хоосон төлөвийг нэг дор.
class AsyncList<T> extends StatelessWidget {
  final List<T>? data;
  final Object? error;
  final VoidCallback onRetry;
  final IconData emptyIcon;
  final String emptyText;
  final Widget Function(List<T> rows) builder;
  const AsyncList({
    super.key,
    required this.data,
    required this.error,
    required this.onRetry,
    required this.emptyIcon,
    required this.emptyText,
    required this.builder,
  });

  @override
  Widget build(BuildContext context) {
    if (data == null && error != null) return ErrorView(error!, onRetry: onRetry);
    if (data == null) return const LoadingView();
    if (data!.isEmpty) return EmptyView(icon: emptyIcon, text: emptyText);
    return builder(data!);
  }
}

/// Улаан устгах товч (ачаалж байхад эргэнэ).
class DeleteIconButton extends StatelessWidget {
  final bool busy;
  final VoidCallback? onPressed;
  const DeleteIconButton({super.key, required this.busy, this.onPressed});

  @override
  Widget build(BuildContext context) => IconButton(
        tooltip: 'Устгах',
        style: IconButton.styleFrom(backgroundColor: Colors.red.shade50, foregroundColor: Colors.red.shade600),
        onPressed: busy ? null : onPressed,
        icon: busy
            ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
            : const Icon(Icons.delete_outline, size: 18),
      );
}
