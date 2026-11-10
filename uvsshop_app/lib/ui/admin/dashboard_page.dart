import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../api/admin_models.dart';
import '../../state/admin_state.dart';
import '../common.dart';
import 'admin_design.dart';
import 'admin_shell.dart';
import 'admin_widgets.dart';
import 'orders_page.dart';

/// Үлдэгдэл үүнээс бага бол "нөөц дуусч байна".
const lowStockThreshold = 5;

const _ranges = {'today': 'Өнөөдөр', 'yesterday': 'Өчигдөр', 'week': '7 хоног', 'month': '30 хоног'};
const _vs = {'today': 'өчигдрөөс', 'yesterday': 'уржигдраас', 'week': 'өмнөх 7 хоногоос', 'month': 'өмнөх 30 хоногоос'};

/// web-ийн / (Хяналтын самбар).
class DashboardPage extends StatefulWidget {
  const DashboardPage({super.key});
  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  String _range = 'today';
  SalesData? _sales;
  Object? _salesError;
  List<AdminOrder>? _recent;
  int? _pending;
  List<AdminProduct>? _products;
  Object? _productsError;

  @override
  void initState() {
    super.initState();
    _reloadAll();
  }

  Future<void> _reloadAll() => Future.wait([_loadSales(), _loadOrders(), _loadProducts()]);

  Future<void> _loadSales() async {
    final range = _range;
    setState(() {
      _sales = null;
      _salesError = null;
    });
    try {
      final s = await context.read<AdminState>().sales(range);
      if (mounted && range == _range) setState(() => _sales = s);
    } catch (e) {
      if (mounted) setState(() => _salesError = e);
    }
  }

  Future<void> _loadOrders() async {
    try {
      final r = await context.read<AdminState>().orders(take: 4);
      if (mounted) {
        setState(() {
          _recent = r.rows;
          _pending = r.pending;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _recent = []);
    }
  }

  Future<void> _loadProducts() async {
    setState(() => _productsError = null);
    try {
      final p = await context.read<AdminState>().allProducts();
      if (mounted) setState(() => _products = p);
    } catch (e) {
      if (mounted) setState(() => _productsError = e);
    }
  }

  ({String text, bool positive})? _delta(num now, num before, {String? against}) {
    if (now == before) return null;
    final diff = now - before;
    final sign = diff > 0 ? '+' : '−';
    if (against == null) {
      if (before == 0) return null;
      return (text: '$sign${(diff / before * 100).abs().toStringAsFixed(1)}%', positive: diff > 0);
    }
    return (text: '$sign${diff.abs()} $against', positive: diff > 0);
  }

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    String two(int n) => n.toString().padLeft(2, '0');
    return AdminTabScaffold(
      body: RefreshIndicator(
        onRefresh: _reloadAll,
        child: ListView(padding: EdgeInsets.zero, children: [
          AdminPageHeader(
            aside: Text('${now.year}.${two(now.month)}.${two(now.day)}',
                style: const TextStyle(fontFamily: mono, fontSize: 14, color: AdminColors.mutedForeground)),
            children: [
              PillTabs<String>(
                value: _range,
                options: [for (final e in _ranges.entries) PillOption(e.key, e.value)],
                onChanged: (v) {
                  _range = v;
                  _loadSales();
                },
              ),
            ],
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
            child: Column(children: [
              ..._salesSection(),
              const SizedBox(height: 12),
              _lowStockCard(),
              if (_recent == null) ...[
                const SizedBox(height: 12),
                const AdminCard(child: Pulse(child: SizedBox(height: 200))),
              ] else if (_recent!.isNotEmpty) ...[
                const SizedBox(height: 12),
                _recentCard(),
              ],
            ]),
          ),
        ]),
      ),
    );
  }

  List<Widget> _salesSection() {
    if (_sales == null && _salesError != null) return [ErrorView(_salesError!, onRetry: _loadSales)];
    if (_sales == null) {
      return [
        const Pulse(
          child: Column(children: [
            Row(children: [Expanded(child: Bone(height: 120, radius: 16)), SizedBox(width: 12), Expanded(child: Bone(height: 120, radius: 16))]),
            SizedBox(height: 12),
            Row(children: [Expanded(child: Bone(height: 120, radius: 16)), SizedBox(width: 12), Expanded(child: Bone(height: 120, radius: 16))]),
            SizedBox(height: 12),
            Bone(height: 200, radius: 16),
          ]),
        ),
      ];
    }
    final s = _sales!;
    return [
      Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Expanded(
          child: _StatTile(
            tone: _TileTone.blue,
            icon: Icons.shopping_bag_outlined,
            label: 'Захиалга',
            value: '${s.orders}',
            delta: _delta(s.orders, s.prevOrders, against: _vs[_range]),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _StatTile(
            tone: _TileTone.brand,
            icon: Icons.account_balance_wallet_outlined,
            label: 'Борлуулалт',
            value: mntCompact(s.revenue),
            delta: _delta(s.revenue, s.prevRevenue),
          ),
        ),
      ]),
      const SizedBox(height: 12),
      Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Expanded(
          child: _StatTile(
            tone: _TileTone.mint,
            icon: Icons.receipt_outlined,
            label: 'Дундаж дүн',
            value: mntCompact(s.orders == 0 ? 0 : s.revenue / s.orders),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _StatTile(
            tone: _TileTone.peach,
            icon: Icons.schedule,
            label: 'Батлахыг хүлээж',
            value: _pending == null ? '—' : '$_pending',
            footer: const Row(mainAxisSize: MainAxisSize.min, children: [
              Text('Харах', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
              SizedBox(width: 4),
              Icon(Icons.arrow_forward, size: 14),
            ]),
            onTap: () => adminTab.value = 'orders',
          ),
        ),
      ]),
      const SizedBox(height: 12),
      _SalesChart(s),
    ];
  }

  Widget _titleRow(String title, {Widget? aside}) => Container(
        decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: AdminColors.border))),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(children: [
          Expanded(child: Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold))),
          ?aside,
        ]),
      );

  Widget _lowStockCard() {
    final low = (_products ?? [])
        .where((p) => p.isActive && p.remain <= lowStockThreshold)
        .toList()
      ..sort((a, b) => a.remain.compareTo(b.remain));
    return AdminCard(
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        _titleRow('Нөөц дуусч байна'),
        if (_products == null && _productsError != null)
          Padding(padding: const EdgeInsets.all(16), child: ErrorView(_productsError!, onRetry: _loadProducts))
        else if (_products == null)
          const Padding(padding: EdgeInsets.all(16), child: Pulse(child: Column(children: [Bone(), SizedBox(height: 14), Bone(), SizedBox(height: 14), Bone()])))
        else if (low.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16, vertical: 24),
            child: Text('Бүх барааны нөөц хангалттай байна.',
                textAlign: TextAlign.center, style: TextStyle(fontSize: 14, color: AdminColors.mutedForeground)),
          )
        else
          for (final (i, p) in low.take(5).indexed) ...[
            if (i > 0) const Divider(height: 1, color: AdminColors.border),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              child: Row(children: [
                Expanded(child: Text(p.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 15))),
                const SizedBox(width: 12),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(color: AdminColors.destructive.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                  child: Text(p.remain <= 0 ? 'Дууссан' : '${p.remain} үлдсэн',
                      style: const TextStyle(fontFamily: mono, fontSize: 12, fontWeight: FontWeight.bold, color: AdminColors.destructive)),
                ),
              ]),
            ),
          ],
      ]),
    );
  }

  Widget _recentCard() => AdminCard(
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          _titleRow(
            'Сүүлийн захиалга',
            aside: GestureDetector(
              onTap: () => adminTab.value = 'orders',
              child: const Text('Бүгд', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AdminColors.primaryInk)),
            ),
          ),
          for (final (i, o) in _recent!.take(4).indexed) ...[
            if (i > 0) const Divider(height: 1, color: AdminColors.border),
            InkWell(
              onTap: () async {
                final changed =
                    await Navigator.of(context).push<bool>(MaterialPageRoute(builder: (_) => AdminOrderPage(orderId: o.id)));
                if (changed == true) _reloadAll();
              },
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Row(children: [
                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(o.customerName.isEmpty ? 'Нэргүй' : o.customerName,
                          maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                      Text('#${o.id} · ${formatWhen(o.createdAt)}',
                          style: const TextStyle(fontFamily: mono, fontSize: 12, color: AdminColors.mutedForeground)),
                    ]),
                  ),
                  Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                    Text(mnt(o.total), style: const TextStyle(fontFamily: mono, fontSize: 14, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    OrderStatusBadge(o.status, orderStatusLabel[o.status] ?? o.status),
                  ]),
                ]),
              ),
            ),
          ],
        ]),
      );
}

enum _TileTone { brand, blue, mint, peach }

class _StatTile extends StatelessWidget {
  final _TileTone tone;
  final IconData icon;
  final String label;
  final String value;
  final ({String text, bool positive})? delta;
  final Widget? footer;
  final VoidCallback? onTap;
  const _StatTile({required this.tone, required this.icon, required this.label, required this.value, this.delta, this.footer, this.onTap});

  @override
  Widget build(BuildContext context) {
    final brand = tone == _TileTone.brand;
    final (Color bg, Color ink) = switch (tone) {
      _TileTone.brand => (AdminColors.primary, Colors.white),
      _TileTone.blue => (AdminColors.tintBlue, AdminColors.tintBlueInk),
      _TileTone.mint => (AdminColors.tintMint, AdminColors.tintMintInk),
      _TileTone.peach => (AdminColors.tintPeach, AdminColors.tintPeachInk),
    };
    final blob = brand ? Colors.white.withValues(alpha: 0.15) : ink.withValues(alpha: 0.1);
    final d = delta;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Container(
          clipBehavior: Clip.antiAlias,
          decoration: BoxDecoration(
            color: brand ? null : bg,
            gradient: brand ? brandGradient : null,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: brand ? Colors.transparent : ink.withValues(alpha: 0.15)),
            boxShadow: const [BoxShadow(color: Color(0x0D000000), blurRadius: 6, offset: Offset(0, 1))],
          ),
          child: Stack(children: [
            Positioned(right: -24, top: -24, child: _circle(96, blob)),
            Positioned(right: 24, bottom: -32, child: _circle(56, blob)),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Expanded(
                    child: Text(label,
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: ink.withValues(alpha: brand ? 0.8 : 0.85))),
                  ),
                  Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: brand ? Colors.white.withValues(alpha: 0.2) : Colors.white,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(icon, size: 16, color: ink),
                  ),
                ]),
                const SizedBox(height: 12),
                FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.centerLeft,
                  child: Text(value,
                      style: TextStyle(fontFamily: mono, fontSize: 24, fontWeight: FontWeight.bold, color: ink, height: 1, letterSpacing: -0.5)),
                ),
                if (d != null) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: brand ? Colors.white.withValues(alpha: 0.2) : Colors.white.withValues(alpha: 0.7),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      Icon(d.positive ? Icons.trending_up : Icons.trending_down,
                          size: 12, color: brand ? Colors.white : (d.positive ? AdminColors.success : AdminColors.destructive)),
                      const SizedBox(width: 4),
                      Flexible(
                        child: Text(d.text,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: brand ? Colors.white : (d.positive ? AdminColors.success : AdminColors.destructive),
                            )),
                      ),
                    ]),
                  ),
                ],
                if (footer != null) ...[
                  const SizedBox(height: 12),
                  DefaultTextStyle.merge(style: TextStyle(color: ink), child: IconTheme.merge(data: IconThemeData(color: ink), child: footer!)),
                ],
              ]),
            ),
          ]),
        ),
      ),
    );
  }

  Widget _circle(double size, Color color) =>
      Container(width: size, height: size, decoration: BoxDecoration(shape: BoxShape.circle, color: color));
}

class _SalesChart extends StatelessWidget {
  final SalesData data;
  const _SalesChart(this.data);

  static const _weekdays = ['Да', 'Мя', 'Лх', 'Пү', 'Ба', 'Бя', 'Ня'];

  String _label(DateTime d) {
    String two(int n) => n.toString().padLeft(2, '0');
    if (data.unit == 'hour') return '${two(d.hour)}:00';
    if (data.series.length <= 7) return _weekdays[d.weekday - 1];
    return '${two(d.month)}-${two(d.day)}';
  }

  @override
  Widget build(BuildContext context) {
    final s = data.series;
    final hourly = data.unit == 'hour';
    final every = hourly ? 6 : (s.length <= 7 ? 1 : 7);
    final max = s.fold<double>(1, (m, p) => p.$2 > m ? p.$2 : m);
    final gap = s.length > 14 ? 3.0 : 6.0;
    return AdminCard(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          const Expanded(child: Text('Борлуулалтын явц', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold))),
          Text(hourly ? 'цагаар' : 'өдрөөр', style: const TextStyle(fontFamily: mono, fontSize: 12, color: AdminColors.mutedForeground)),
        ]),
        const SizedBox(height: 20),
        SizedBox(
          height: 112,
          child: Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
            for (var i = 0; i < s.length; i++) ...[
              if (i > 0) SizedBox(width: gap),
              Expanded(
                child: Tooltip(
                  message: '${_label(s[i].$1)}: ${mnt(s[i].$2)}',
                  child: FractionallySizedBox(
                    heightFactor: (s[i].$2 / max).clamp(0.04, 1.0),
                    child: Container(
                      decoration: BoxDecoration(
                        // Сүүлийнх нь одоогийн цаг / өдөр.
                        color: i == s.length - 1 ? AdminColors.primary : AdminColors.primary.withValues(alpha: 0.25),
                        borderRadius: const BorderRadius.vertical(top: Radius.circular(3)),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ]),
        ),
        const SizedBox(height: 8),
        Row(children: [
          for (var i = 0; i < s.length; i++) ...[
            if (i > 0) SizedBox(width: gap),
            Expanded(
              child: SizedBox(
                height: 14,
                child: OverflowBox(
                alignment: Alignment.centerLeft,
                maxWidth: 60,
                maxHeight: 14,
                child: Text(i % every == 0 ? _label(s[i].$1) : '',
                    softWrap: false, style: const TextStyle(fontFamily: mono, fontSize: 11, color: AdminColors.mutedForeground)),
              ),
              ),
            ),
          ],
        ]),
      ]),
    );
  }
}
