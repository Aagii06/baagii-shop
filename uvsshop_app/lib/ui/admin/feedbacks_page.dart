import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../api/admin_manage_models.dart';
import '../../state/admin_state.dart';
import '../common.dart';
import 'admin_design.dart';
import 'admin_widgets.dart';

/// web-ийн /feedbacks: вэбийн "Бидэнд бичнэ үү" маягтаар ирсэн захидал.
class FeedbacksPage extends StatefulWidget {
  const FeedbacksPage({super.key});
  @override
  State<FeedbacksPage> createState() => _FeedbacksPageState();
}

class _FeedbacksPageState extends State<FeedbacksPage> {
  List<FeedbackMsg>? _data;
  Object? _error;
  String _status = 'all';
  final Map<int, String> _busy = {};

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final rows = await context.read<AdminState>().feedbacks();
      if (mounted) {
        setState(() {
          _data = rows;
          _error = null;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _error = e);
    }
  }

  Future<void> _act(FeedbackMsg f, String kind, Future<void> Function() fn, String success) async {
    setState(() => _busy[f.id] = kind);
    final done = await runAction(context, fn, success);
    if (!mounted) return;
    setState(() => _busy.remove(f.id));
    if (done) _load();
  }

  Future<void> _toggle(FeedbackMsg f) => _act(f, 'toggle', () => context.read<AdminState>().setFeedbackRead(f.id, f.isNew),
      f.isNew ? 'Уншсан болголоо' : 'Уншаагүй болголоо');

  Future<void> _delete(FeedbackMsg f) async {
    final ok = await confirmAction(context,
        title: 'Санал хүсэлт устгах уу?',
        description: '${f.name}-ийн илгээсэн захидлыг устгана. Буцаах боломжгүй.',
        confirmLabel: 'Устгах',
        danger: true);
    if (ok && mounted) await _act(f, 'delete', () => context.read<AdminState>().deleteFeedback(f.id), 'Устгалаа');
  }

  /// Имэйлээр хариулахад уншсан болгоно.
  Future<void> _reply(FeedbackMsg f) async {
    final uri = Uri(
      scheme: 'mailto',
      path: f.email,
      query: f.subject == null ? null : 'subject=${Uri.encodeComponent('Re: ${f.subject}')}',
    );
    await launchUrl(uri);
    if (f.isNew && mounted) {
      context.read<AdminState>().setFeedbackRead(f.id, true).then((_) => _load(), onError: (_) {});
    }
  }

  @override
  Widget build(BuildContext context) {
    final rows = _data?.where((f) => _status == 'all' || f.status == _status).toList();
    final newCount = _data?.where((f) => f.isNew).length ?? 0;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Санал хүсэлт'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(62),
          child: ChipTabs<String>(
            value: _status,
            onChanged: (v) => setState(() => _status = v),
            tones: {'new': orderTones['pending']!, 'read': orderTones['delivered']!},
            options: [('all', 'Бүгд', null), ('new', 'Шинэ', newCount), ('read', 'Уншсан', null)],
          ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: AsyncList<FeedbackMsg>(
          data: rows,
          error: _error,
          onRetry: _load,
          emptyIcon: Icons.chat_outlined,
          emptyText: _status == 'all' ? 'Санал хүсэлт алга' : '“${feedbackStatusLabel[_status]}” санал хүсэлт алга',
          builder: (rows) => ListView.separated(
            itemCount: rows.length,
            separatorBuilder: (_, _) => const Divider(height: 1),
            itemBuilder: (_, i) => _row(rows[i]),
          ),
        ),
      ),
    );
  }

  Widget _row(FeedbackMsg f) {
    final busy = _busy[f.id];
    final grey = TextStyle(fontSize: 13, color: Colors.grey.shade600);
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Text('#${f.id}', style: grey.copyWith(fontFamily: 'monospace')),
          const SizedBox(width: 8),
          StatusChip(feedbackStatusLabel[f.status]!, f.isNew ? Colors.orange : Colors.green),
          const Spacer(),
          Text(formatWhen(f.createdAt), style: grey.copyWith(fontSize: 12)),
        ]),
        if (f.subject != null)
          Padding(
            padding: const EdgeInsets.only(top: 6),
            child: Text(f.subject!, style: TextStyle(fontSize: 15, fontWeight: f.isNew ? FontWeight.bold : FontWeight.w600)),
          ),
        const SizedBox(height: 2),
        Wrap(crossAxisAlignment: WrapCrossAlignment.center, spacing: 6, children: [
          Text(f.name, style: TextStyle(fontWeight: f.subject == null && f.isNew ? FontWeight.bold : FontWeight.w500)),
          Text('·', style: grey),
          InkWell(
            onTap: () => launchUrl(Uri(scheme: 'mailto', path: f.email)),
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              Icon(Icons.mail_outline, size: 14, color: Colors.grey.shade600),
              const SizedBox(width: 3),
              Text(f.email, style: grey),
            ]),
          ),
        ]),
        if (f.phone != null)
          InkWell(
            onTap: () => launchUrl(Uri(scheme: 'tel', path: f.phone)),
            child: Padding(
              padding: const EdgeInsets.only(top: 2),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                Icon(Icons.phone_outlined, size: 14, color: Colors.grey.shade600),
                const SizedBox(width: 3),
                Text(formatPhone(f.phone!), style: grey.copyWith(fontFamily: 'monospace')),
              ]),
            ),
          ),
        Container(
          width: double.infinity,
          margin: const EdgeInsets.only(top: 8),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(color: mutedColor, borderRadius: BorderRadius.circular(12)),
          child: SelectableText(f.message, style: const TextStyle(fontSize: 14, height: 1.4)),
        ),
        const SizedBox(height: 10),
        Row(children: [
          Expanded(
            child: OutlinedButton.icon(onPressed: () => _reply(f), icon: const Icon(Icons.reply, size: 18), label: const Text('Хариу бичих')),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: OutlinedButton.icon(
              onPressed: busy != null ? null : () => _toggle(f),
              icon: busy == 'toggle'
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                  : Icon(f.isNew ? Icons.check : Icons.undo, size: 18),
              label: Text(f.isNew ? 'Уншсан' : 'Уншаагүй'),
            ),
          ),
          const SizedBox(width: 8),
          DeleteIconButton(busy: busy == 'delete', onPressed: busy != null ? null : () => _delete(f)),
        ]),
      ]),
    );
  }
}
