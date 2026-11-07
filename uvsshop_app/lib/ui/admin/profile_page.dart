import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../state/admin_state.dart';
import '../../state/app_state.dart';

class AdminProfilePage extends StatelessWidget {
  const AdminProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    final u = context.watch<AdminState>().user;
    return Scaffold(
      appBar: AppBar(title: const Text('Профайл')),
      body: ListView(padding: const EdgeInsets.all(12), children: [
        Card(
          child: ListTile(
            leading: const CircleAvatar(child: Icon(Icons.person)),
            title: Text(u?.name ?? ''),
            subtitle: Text([
              u?.userName,
              if (u?.email != null) u!.email,
              u?.isAdmin == true ? 'Админ' : 'Худалдагч${u?.storeName != null ? ' · ${u!.storeName}' : ''}',
            ].whereType<String>().join('\n')),
            isThreeLine: true,
          ),
        ),
        const SizedBox(height: 12),
        Card(
          child: Column(children: [
            ListTile(
              leading: const Icon(Icons.storefront_outlined),
              title: const Text('Дэлгүүр үзэх'),
              subtitle: const Text('Худалдан авагчийн хэсэг рүү зочлох'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => context.read<AppState>().openShop(),
            ),
            ListTile(
              leading: const Icon(Icons.logout, color: Colors.red),
              title: const Text('Админаас гарах', style: TextStyle(color: Colors.red)),
              onTap: () async {
                final ok = await showDialog<bool>(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    content: const Text('Админ хэсгээс гарах уу?'),
                    actions: [
                      TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Болих')),
                      FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Гарах')),
                    ],
                  ),
                );
                if (ok == true && context.mounted) await context.read<AdminState>().signOut();
              },
            ),
          ]),
        ),
      ]),
    );
  }
}
