import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../state/admin_state.dart';
import '../../state/app_state.dart';
import '../common.dart';
import 'admin_widgets.dart';
import 'customers_page.dart';
import 'delivery_notes_page.dart';
import 'feedbacks_page.dart';
import 'partner_requests_page.dart';
import 'password_page.dart';
import 'profile_edit_page.dart';
import 'settings_page.dart';
import 'stores_page.dart';
import 'users_page.dart';

void _open(BuildContext context, Widget page) => Navigator.of(context).push(MaterialPageRoute(builder: (_) => page));

/// web-ийн /profile: бүртгэлийн карт, засах/нууц үг, админы цэс, хамтран ажиллах, гарах.
class AdminProfilePage extends StatelessWidget {
  const AdminProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    final u = context.watch<AdminState>().user;
    final isAdmin = u?.isAdmin ?? false;
    final name = (u?.name.isNotEmpty ?? false) ? u!.name : 'Хэрэглэгч';

    final menu = [
      (
        Icons.storefront_outlined,
        Colors.lightBlue.shade600,
        'Дэлгүүрүүд',
        'Борлуулагч дэлгүүрүүдийг бүртгэх, засах',
        const StoresPage(),
      ),
      (Icons.group_outlined, Colors.deepPurple.shade400, 'Хэрэглэгчид', 'Админ, дэлгүүрийн хэрэглэгчид', const UsersPage()),
      (
        Icons.person_outline,
        Colors.green.shade600,
        'Худалдан авагчид',
        'Вэбээр нэвтэрч захиалга өгсөн хэрэглэгчид',
        const CustomersPage(),
      ),
      (
        Icons.settings_outlined,
        Colors.blueGrey.shade600,
        'Тохиргоо',
        'Категори, үзүүлэлт, төлбөрийн тохиргоо',
        const SettingsPage(),
      ),
      (
        Icons.edit_note,
        Colors.indigo.shade500,
        'Хүргэлтийн тэмдэглэл',
        'Захиалгад сонгох хүргэлтийн заавар',
        const DeliveryNotesPage(),
      ),
      (
        Icons.chat_outlined,
        Colors.pink.shade500,
        'Санал хүсэлт',
        'Вэбийн “Бидэнд бичнэ үү” маягтаар ирсэн захидал',
        const FeedbacksPage(),
      ),
    ];

    return Scaffold(
      appBar: AppBar(title: const Text('Профайл')),
      body: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          // Брэндийн градиенттай бүртгэлийн карт.
          Container(
            clipBehavior: Clip.antiAlias,
            decoration: BoxDecoration(
              gradient: brandGradient,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [BoxShadow(color: brandColor.withValues(alpha: 0.25), blurRadius: 16, offset: const Offset(0, 6))],
            ),
            child: Stack(
              children: [
                // web-ийн картын зөөлөн цайвар тойргууд.
                const Positioned(right: -40, top: -48, child: _Blob(160, 0.15)),
                const Positioned(bottom: -64, left: 120, child: _Blob(144, 0.10)),
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: Row(
                    children: [
                      Container(
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white60, width: 3),
                        ),
                        child: u?.logo != null
                            ? ImageBox(fileId: u!.logo, size: 64, circle: true)
                            : CircleAvatar(
                                radius: 32,
                                backgroundColor: Colors.white24,
                                child: Text(
                                  name.characters.first.toUpperCase(),
                                  style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
                                ),
                              ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: DefaultTextStyle(
                          style: const TextStyle(color: Colors.white),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                name,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                              ),
                              if (u?.userName.isNotEmpty ?? false)
                                Text(
                                  u!.userName,
                                  style: const TextStyle(fontFamily: 'monospace', color: Colors.white70),
                                ),
                              const SizedBox(height: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                                decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(20)),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    if (!isAdmin) ...[
                                      const Icon(Icons.storefront_outlined, size: 14, color: Colors.white),
                                      const SizedBox(width: 4),
                                    ],
                                    Flexible(
                                      child: Text(
                                        isAdmin ? 'Админ' : (u?.storeName ?? 'Дэлгүүр оноогоогүй'),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      Column(
                        children: [
                          _RoundButton(
                            icon: Icons.edit_outlined,
                            tooltip: 'Мэдээлэл засах',
                            onTap: () => _open(context, const ProfileEditPage()),
                          ),
                          const SizedBox(height: 8),
                          _RoundButton(
                            icon: Icons.key_outlined,
                            tooltip: 'Нууц үг солих',
                            onTap: () => _open(context, const PasswordPage()),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          if (isAdmin) ...[
            Panel(
              child: Column(
                children: [
                  for (var i = 0; i < menu.length; i++) ...[
                    if (i > 0) const Divider(height: 1),
                    MenuTile(
                      icon: menu[i].$1,
                      color: menu[i].$2,
                      title: menu[i].$3,
                      subtitle: menu[i].$4,
                      onTap: () => _open(context, menu[i].$5),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 12),
            // Хамтран ажиллах хүсэлт — улбар шар өнгөөр тодруулна.
            Material(
              color: Colors.orange.shade50,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: BorderSide(color: Colors.orange.shade200),
              ),
              clipBehavior: Clip.antiAlias,
              child: InkWell(
                onTap: () => _open(context, const PartnerRequestsPage()),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  child: Row(
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(colors: [Colors.orange.shade500, Colors.amber.shade500]),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: const Icon(Icons.handshake_outlined, color: Colors.white, size: 22),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Хамтран ажиллах', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                            Text(
                              'Ирсэн хүсэлтүүдийг харах, батлах',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
                            ),
                          ],
                        ),
                      ),
                      Icon(Icons.chevron_right, color: Colors.orange.shade400),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 12),
          ],
          Panel(
            child: ListTile(
              leading: const Icon(Icons.storefront_outlined),
              title: const Text('Дэлгүүр үзэх'),
              subtitle: const Text('Худалдан авагчийн хэсэг рүү зочлох'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => context.read<AppState>().openShop(),
            ),
          ),
          const SizedBox(height: 16),
          FilledButton.icon(
            style: FilledButton.styleFrom(
              backgroundColor: Colors.red.shade50,
              foregroundColor: Colors.red.shade700,
              minimumSize: const Size.fromHeight(50),
            ),
            icon: const Icon(Icons.logout),
            label: const Text('Гарах'),
            onPressed: () async {
              final ok = await confirmAction(context, title: 'Админ хэсгээс гарах уу?', confirmLabel: 'Гарах', danger: true);
              if (ok && context.mounted) await context.read<AdminState>().signOut();
            },
          ),
        ],
      ),
    );
  }
}

class _RoundButton extends StatelessWidget {
  final IconData icon;
  final String tooltip;
  final VoidCallback onTap;
  const _RoundButton({required this.icon, required this.tooltip, required this.onTap});

  @override
  Widget build(BuildContext context) => Tooltip(
    message: tooltip,
    child: Material(
      color: Colors.white24,
      shape: const CircleBorder(),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onTap,
        child: SizedBox(width: 36, height: 36, child: Icon(icon, size: 18, color: Colors.white)),
      ),
    ),
  );
}

class _Blob extends StatelessWidget {
  final double size;
  final double alpha;
  const _Blob(this.size, this.alpha);

  @override
  Widget build(BuildContext context) => Container(
    width: size,
    height: size,
    decoration: BoxDecoration(
      shape: BoxShape.circle,
      color: Colors.white.withValues(alpha: alpha),
    ),
  );
}
