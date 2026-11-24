import 'dart:async';

import 'package:flutter/material.dart';
import 'package:uvsshop_app/i18n.dart';

/// web-ийн PayDeadlineNotice: төлөөгүй захиалга автоматаар цуцлагдана гэж
/// анхааруулж, [deadline] хүртэлх хугацааг секунд тутам тоолно. deadline-гүй бол юу ч харуулахгүй.
class PayDeadlineNotice extends StatefulWidget {
  final String? deadline;
  final int? hours;
  const PayDeadlineNotice({super.key, required this.deadline, this.hours});

  @override
  State<PayDeadlineNotice> createState() => _PayDeadlineNoticeState();
}

class _PayDeadlineNoticeState extends State<PayDeadlineNotice> {
  Timer? _timer;

  DateTime? get _end => widget.deadline == null ? null : DateTime.tryParse(widget.deadline!);

  @override
  void initState() {
    super.initState();
    if (_end != null) _timer = Timer.periodic(const Duration(seconds: 1), (_) => setState(() {}));
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  static String _format(Duration d) {
    final s = d.isNegative ? 0 : d.inSeconds;
    String pad(int n) => n.toString().padLeft(2, '0');
    return '${pad(s ~/ 3600)}:${pad((s % 3600) ~/ 60)}:${pad(s % 60)}';
  }

  @override
  Widget build(BuildContext context) {
    final end = _end;
    if (end == null) return const SizedBox.shrink();
    final left = end.difference(DateTime.now());
    final expired = left.inSeconds <= 0;
    // 30 минутаас бага үлдвэл улаан
    final urgent = left < const Duration(minutes: 30);
    final fg = urgent ? Colors.red.shade700 : Colors.amber.shade900;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: urgent ? Colors.red.shade50 : Colors.amber.shade50,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: urgent ? Colors.red.shade200 : Colors.amber.shade200),
      ),
      child: Row(children: [
        Icon(Icons.schedule, color: fg),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            expired
                ? tr('Төлбөрийн хугацаа дууссан тул захиалга удахгүй цуцлагдана.')
                : tr('Төлбөрөө {hours} цагийн дотор төлөөгүй бол захиалга автоматаар цуцлагдаж, бараа нөөцөд буцна.', {'hours': widget.hours ?? 3}),
            style: TextStyle(color: fg, fontSize: 13),
          ),
        ),
        if (!expired) ...[
          const SizedBox(width: 10),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.7), borderRadius: BorderRadius.circular(8)),
            child: Text(_format(left),
                style: TextStyle(color: fg, fontSize: 17, fontWeight: FontWeight.bold, fontFamily: 'monospace', fontFeatures: const [FontFeature.tabularFigures()])),
          ),
        ],
      ]),
    );
  }
}
