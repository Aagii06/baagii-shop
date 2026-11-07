import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../api/admin_models.dart';
import '../../state/admin_state.dart';
import '../common.dart';
import 'admin_shell.dart';

class DashboardPage extends StatefulWidget {
  const DashboardPage({super.key});
  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  static const _ranges = {'today': 'Өнөөдөр', 'yesterday': 'Өчигдөр', 'week': '7 хоног', 'month': 'Сар'};
  String _range = 'today';
  late Future<SalesData> _future = _fetch();

  Future<SalesData> _fetch() => context.read<AdminState>().sales(_range);
  void _reload() => setState(() => _future = _fetch());

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AdminState>().user;
    return Scaffold(
      appBar: AppBar(title: Text('Сайн байна уу, ${user?.name ?? ''}'), actions: const [VisitShopButton()]),
      body: RefreshIndicator(
        onRefresh: () async => _reload(),
        child: ListView(padding: const EdgeInsets.all(12), children: [
          Wrap(spacing: 8, children: [
            for (final e in _ranges.entries)
              ChoiceChip(
                label: Text(e.value),
                selected: _range == e.key,
                showCheckmark: false,
                onSelected: (_) {
                  _range = e.key;
                  _reload();
                },
              ),
          ]),
          const SizedBox(height: 12),
          FutureBuilder<SalesData>(
            future: _future,
            builder: (context, snap) {
              if (snap.connectionState != ConnectionState.done) {
                return const SizedBox(height: 300, child: LoadingView());
              }
              if (snap.hasError) return SizedBox(height: 300, child: ErrorView(snap.error!, onRetry: _reload));
              final d = snap.data!;
              return Column(children: [
                Row(children: [
                  Expanded(child: _stat('Захиалга', '${d.orders}', _delta(d.orders.toDouble(), d.prevOrders.toDouble()))),
                  const SizedBox(width: 12),
                  Expanded(child: _stat('Орлого', money(d.revenue), _delta(d.revenue, d.prevRevenue))),
                ]),
                const SizedBox(height: 12),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text('Орлого ${d.unit == 'hour' ? 'цагаар' : 'өдрөөр'}', style: const TextStyle(fontWeight: FontWeight.w600)),
                      const SizedBox(height: 12),
                      SizedBox(height: 180, child: _Bars(d)),
                    ]),
                  ),
                ),
              ]);
            },
          ),
        ]),
      ),
    );
  }

  (String, bool)? _delta(double now, double before) {
    if (now == before || before == 0) return null;
    final diff = (now - before) / before * 100;
    return ('${diff > 0 ? '+' : '−'}${diff.abs().toStringAsFixed(1)}%', diff > 0);
  }

  Widget _stat(String label, String value, (String, bool)? delta) => Card(
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(label, style: TextStyle(color: Colors.grey.shade600)),
            const SizedBox(height: 6),
            FittedBox(child: Text(value, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold))),
            if (delta != null)
              Text(delta.$1, style: TextStyle(color: delta.$2 ? Colors.green.shade700 : Colors.red.shade700, fontSize: 12)),
          ]),
        ),
      );
}

class _Bars extends StatelessWidget {
  final SalesData data;
  const _Bars(this.data);

  String _label(DateTime d, int i) {
    String two(int n) => n.toString().padLeft(2, '0');
    if (data.unit == 'hour') return i % 6 == 0 ? two(d.hour) : '';
    const wd = ['Да', 'Мя', 'Лх', 'Пү', 'Ба', 'Бя', 'Ня'];
    if (data.series.length <= 7) return wd[d.weekday - 1];
    return i % 7 == 0 ? '${two(d.month)}-${two(d.day)}' : '';
  }

  @override
  Widget build(BuildContext context) {
    final s = data.series;
    if (s.isEmpty) return const Center(child: Text('Мэдээлэл алга'));
    final max = s.fold<double>(0, (m, p) => p.$2 > m ? p.$2 : m);
    return Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
      for (var i = 0; i < s.length; i++)
        Expanded(
          child: Tooltip(
            message: money(s[i].$2),
            child: Column(mainAxisAlignment: MainAxisAlignment.end, children: [
              Flexible(
                child: FractionallySizedBox(
                  heightFactor: max == 0 ? 0.01 : (s[i].$2 / max).clamp(0.01, 1.0),
                  child: Container(
                    margin: const EdgeInsets.symmetric(horizontal: 1.5),
                    decoration: BoxDecoration(color: brandColor, borderRadius: BorderRadius.circular(3)),
                  ),
                ),
              ),
              const SizedBox(height: 4),
              SizedBox(
                height: 14,
                child: OverflowBox(
                  maxWidth: 40,
                  child: Text(_label(s[i].$1, i), style: TextStyle(fontSize: 10, color: Colors.grey.shade600)),
                ),
              ),
            ]),
          ),
        ),
    ]);
  }
}
