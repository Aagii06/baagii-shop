import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../api/admin_manage_models.dart';
import '../../state/admin_state.dart';
import '../common.dart';
import 'admin_widgets.dart';

/// web-ийн /delivery-notes: захиалгад сонгох хүргэлтийн заавар (зөвхөн харах).
class DeliveryNotesPage extends StatefulWidget {
  const DeliveryNotesPage({super.key});
  @override
  State<DeliveryNotesPage> createState() => _DeliveryNotesPageState();
}

class _DeliveryNotesPageState extends State<DeliveryNotesPage> {
  List<DoNote>? _data;
  Object? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final rows = await context.read<AdminState>().doNotes();
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

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(
          title: const Text('Хүргэлтийн тэмдэглэл'),
          actions: [
            if (_data != null)
              Padding(
                padding: const EdgeInsets.only(right: 16),
                child: Center(child: Text('${_data!.length}', style: TextStyle(fontFamily: 'monospace', color: Colors.grey.shade600))),
              ),
          ],
        ),
        body: Column(children: [
          Container(
            width: double.infinity,
            color: Colors.white,
            padding: const EdgeInsets.all(16),
            child: Text('Худалдан авагч захиалга хийхдээ сонгох боломжтой хүргэлтийн заавар.',
                style: TextStyle(color: Colors.grey.shade600)),
          ),
          const Divider(height: 1),
          Expanded(
            child: RefreshIndicator(
              onRefresh: _load,
              child: AsyncList<DoNote>(
                data: _data,
                error: _error,
                onRetry: _load,
                emptyIcon: Icons.edit_note,
                emptyText: 'Тэмдэглэл алга',
                builder: (rows) => ListView.separated(
                  itemCount: rows.length,
                  separatorBuilder: (_, _) => const Divider(height: 1),
                  itemBuilder: (_, i) {
                    final n = rows[i];
                    return Container(
                      color: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Expanded(child: Text(n.name, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600))),
                          const SizedBox(width: 12),
                          Text(formatDate(n.createdAt, time: false),
                              style: TextStyle(fontSize: 12, fontFamily: 'monospace', color: Colors.grey.shade600)),
                        ]),
                        if (n.description != null)
                          Padding(
                            padding: const EdgeInsets.only(top: 2),
                            child: Text(n.description!, style: TextStyle(fontSize: 13, color: Colors.grey.shade600)),
                          ),
                      ]),
                    );
                  },
                ),
              ),
            ),
          ),
        ]),
      );
}
