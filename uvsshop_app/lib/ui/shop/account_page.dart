import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../state/admin_state.dart';
import '../../state/app_state.dart';
import '../../state/shop_state.dart';
import 'sign_in_page.dart';

class AccountPage extends StatelessWidget {
  const AccountPage({super.key});

  Future<void> _editName(BuildContext context, String? current) async {
    final ctrl = TextEditingController(text: current ?? '');
    final name = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Нэр солих'),
        content: TextField(controller: ctrl, autofocus: true, decoration: const InputDecoration(labelText: 'Нэр')),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Болих')),
          FilledButton(onPressed: () => Navigator.pop(ctx, ctrl.text.trim()), child: const Text('Хадгалах')),
        ],
      ),
    );
    if (name != null && name.isNotEmpty && context.mounted) {
      await context.read<ShopState>().updateName(name);
    }
  }

  @override
  Widget build(BuildContext context) {
    final shop = context.watch<ShopState>();
    final admin = context.watch<AdminState>();
    final c = shop.customer;
    return Scaffold(
      appBar: AppBar(title: const Text('Миний')),
      body: ListView(padding: const EdgeInsets.all(12), children: [
        Card(
          child: c == null
              ? ListTile(
                  leading: const CircleAvatar(child: Icon(Icons.person_outline)),
                  title: const Text('Зочин'),
                  subtitle: const Text('Утасны дугаараараа нэвтэрнэ үү'),
                  trailing: FilledButton(
                    onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SignInPage())),
                    child: const Text('Нэвтрэх'),
                  ),
                )
              : ListTile(
                  leading: const CircleAvatar(child: Icon(Icons.person)),
                  title: Text(c.name?.isNotEmpty == true ? c.name! : 'Нэргүй'),
                  subtitle: Text(c.phone),
                  trailing: IconButton(icon: const Icon(Icons.edit_outlined), onPressed: () => _editName(context, c.name)),
                ),
        ),
        const SizedBox(height: 12),
        Card(
          child: Column(children: [
            if (admin.signedIn)
              ListTile(
                leading: const Icon(Icons.admin_panel_settings_outlined),
                title: const Text('Админ хэсэг рүү орох'),
                subtitle: Text(admin.user?.name ?? ''),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => context.read<AppState>().openAdmin(),
              )
            else
              ListTile(
                leading: const Icon(Icons.admin_panel_settings_outlined),
                title: const Text('Админ / Худалдагч нэвтрэх'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SignInPage(initialTab: 1))),
              ),
            if (c != null)
              ListTile(
                leading: const Icon(Icons.logout, color: Colors.red),
                title: const Text('Гарах', style: TextStyle(color: Colors.red)),
                onTap: () => context.read<ShopState>().signOut(),
              ),
          ]),
        ),
      ]),
    );
  }
}
