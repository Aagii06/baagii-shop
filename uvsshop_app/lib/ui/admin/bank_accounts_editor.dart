import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../api/admin_manage_models.dart' show banks, bankAccountRe;
import 'admin_widgets.dart';
import 'package:uvsshop_app/i18n.dart';

/// Засаж буй нэг данс. iban — хуучин хадгалсан дансных, өөрчлөхгүй дамжуулна.
class BankDraft {
  String? name;
  final TextEditingController account;
  final TextEditingController holder;
  final String? iban;
  BankDraft({this.name, String account = '', String holder = '', this.iban})
      : account = TextEditingController(text: account),
        holder = TextEditingController(text: holder);

  bool get isEmpty => account.text.isEmpty && name == null && holder.text.trim().isEmpty;

  /// Бүрэн хоосон мөр алдаа биш (хадгалахгүй). requireAll — банк, нэр бас заавал.
  String? error({bool requireAll = false}) {
    if (isEmpty) return null;
    final v = account.text;
    if (v.isEmpty) return tr('Дансны дугаар оруулна уу');
    if (!bankAccountRe.hasMatch(v)) return tr('Дансны дугаар буруу байна (6–20 орон, эсвэл MN-ээр эхэлсэн IBAN)');
    if (requireAll && (name == null || holder.text.trim().isEmpty)) return tr('Банк, дансны дугаар, нэрийг бүгдийг оруулна уу');
    return null;
  }

  void dispose() {
    account.dispose();
    holder.dispose();
  }
}

/// Олон данс (max хүртэл, эхнийх нь үндсэн): банк сонгох, дансны дугаар, нэр. Нэмэх / хасах.
/// Админы вебийн components/stores/BankAccounts.tsx-тэй адил.
class BankAccountsEditor extends StatelessWidget {
  final List<BankDraft> drafts;
  final VoidCallback onChanged;
  final bool showErrors;
  final bool requireAll;
  final String holderLabel;
  final int max;
  const BankAccountsEditor({
    super.key,
    required this.drafts,
    required this.onChanged,
    required this.showErrors,
    required this.holderLabel,
    this.requireAll = false,
    this.max = 5,
  });

  Widget _card(int i, BankDraft b) => Card(
        margin: const EdgeInsets.only(top: 12),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(12, 4, 4, 12),
          child: Column(children: [
            Row(children: [
              Expanded(
                child: Text(i == 0 ? tr('Үндсэн данс') : tr('Данс {n}', {'n': i + 1}),
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.black54)),
              ),
              IconButton(
                tooltip: tr('Дансыг хасах'),
                icon: const Icon(Icons.delete_outline),
                onPressed: () {
                  drafts.remove(b);
                  b.dispose();
                  onChanged();
                },
              ),
            ]),
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: Column(children: [
                DropdownButtonFormField<String?>(
                  initialValue: b.name,
                  isExpanded: true,
                  decoration: fieldDecoration(tr('Банк')),
                  items: [
                    DropdownMenuItem(value: null, child: Text(tr('Сонгоогүй'))),
                    // Жагсаалтад байхгүй хадгалсан банкыг алдахгүй
                    if (b.name != null && !banks.contains(b.name)) DropdownMenuItem(value: b.name, child: Text(b.name!)),
                    for (final n in banks) DropdownMenuItem(value: n, child: Text(n)),
                  ],
                  onChanged: (v) {
                    b.name = v;
                    onChanged();
                  },
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: b.account,
                  maxLength: 20,
                  autocorrect: false,
                  style: const TextStyle(fontFamily: 'monospace'),
                  inputFormatters: [
                    FilteringTextInputFormatter.deny(RegExp(r'\s')),
                    TextInputFormatter.withFunction((_, v) => v.copyWith(text: v.text.toUpperCase())),
                  ],
                  onChanged: (_) => onChanged(),
                  decoration: fieldDecoration(tr('Дансны дугаар'),
                          hint: tr('Дансны дугаар'), error: showErrors ? b.error(requireAll: requireAll) : null)
                      .copyWith(counterText: ''),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: b.holder,
                  maxLength: 150,
                  onChanged: (_) => onChanged(),
                  decoration: fieldDecoration(holderLabel).copyWith(counterText: ''),
                ),
              ]),
            ),
          ]),
        ),
      );

  @override
  Widget build(BuildContext context) => Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        for (final (i, b) in drafts.indexed) _card(i, b),
        if (drafts.isEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(tr('Данс нэмээгүй байна'), style: const TextStyle(color: Colors.black54)),
          ),
        if (drafts.length < max)
          Align(
            alignment: Alignment.centerLeft,
            child: TextButton.icon(
              onPressed: () {
                drafts.add(BankDraft());
                onChanged();
              },
              icon: const Icon(Icons.add),
              label: Text(tr('Данс нэмэх')),
            ),
          ),
      ]);
}
