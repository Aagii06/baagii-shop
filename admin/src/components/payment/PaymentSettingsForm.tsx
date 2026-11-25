"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import Field from "@/components/common/Field";
import { useToast } from "@/components/common/Toast";
import DetailHeader from "@/components/layout/DetailHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { MAX_SHOP_BANKS, savePaymentSettings, type PaymentSettings, type ShopBankAccount } from "@/lib/api/paymentSettings";
import BankAccounts, { bankProblem, type BankDraft } from "@/components/stores/BankAccounts";
import { toNumber } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useState } from "react";

/**
 * The two ways a shopper can pay on the web: a bank transfer (the shop's
 * account is shown; the order counts as paid once an admin confirms it) and
 * QPay (a QR / bank-app invoice, marked paid automatically). Saving with
 * QPay on checks the credentials against QPay first.
 */
const draftOfAccount = (a: ShopBankAccount): BankDraft => ({
  key: `${a.accountNumber}-${Math.random()}`,
  name: a.bankName,
  account: a.accountNumber,
  holder: a.accountName,
  iban: a.iban ?? null,
});

/** Filled rows in order (the first is the main account); a saved IBAN is kept. */
const accountsOf = (list: BankDraft[]): ShopBankAccount[] =>
  list
    .filter((a) => a.account)
    .map((a) => ({ bankName: a.name, accountNumber: a.account, accountName: a.holder.trim(), iban: a.iban ?? null }));

export default function PaymentSettingsForm({ settings }: { settings: PaymentSettings }) {
  const { t } = useLanguage();
  const { run } = useToast();

  const [deliveryEnabled, setDeliveryEnabled] = useState(settings.delivery.enabled);
  const [deliveryFee, setDeliveryFee] = useState(String(settings.delivery.fee));
  const [bankEnabled, setBankEnabled] = useState(settings.bank.enabled);
  const [accounts, setAccounts] = useState<BankDraft[]>(() => (settings.bank.accounts ?? []).map(draftOfAccount));
  const bank = { enabled: bankEnabled, accounts: accountsOf(accounts) };
  const [qpay, setQpay] = useState({ ...settings.qpay, password: "" });
  const [hasPassword, setHasPassword] = useState(settings.qpay.hasPassword);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  // What the form holds, to tell whether anything changed since the last save.
  // A typed QPay password counts as a change; an empty one keeps the stored one.
  const current = JSON.stringify({
    deliveryEnabled,
    deliveryFee,
    bank,
    qpay: { ...qpay, hasPassword: undefined },
  });
  const [baseline, setBaseline] = useState(current);
  const dirty = current !== baseline;

  const required = (on: boolean, v: string) => (submitted && on && !v.trim() ? t("pay.required") : undefined);
  const bankEmpty = submitted && bankEnabled && bank.accounts.length === 0 ? t("pay.bankNone") : undefined;
  const qpayErrors = {
    username: required(qpay.enabled, qpay.username),
    password: hasPassword ? undefined : required(qpay.enabled, qpay.password),
    invoiceCode: required(qpay.enabled, qpay.invoiceCode),
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving || !dirty) return;
    setSubmitted(true);
    const blank = (on: boolean, values: string[]) => on && values.some((v) => !v.trim());
    if (bankEnabled && (bank.accounts.length === 0 || accounts.some((a) => bankProblem(a, t, true)))) return;
    if (blank(qpay.enabled, [qpay.username, qpay.invoiceCode, hasPassword ? "x" : qpay.password])) return;
    if (deliveryEnabled && !deliveryFee) return;

    setSaving(true);
    try {
      await run(async () => {
        const { enabled, sandbox, username, password, invoiceCode } = qpay;
        const saved = await savePaymentSettings({
          delivery: { enabled: deliveryEnabled, fee: toNumber(deliveryFee) },
          bank,
          qpay: { enabled, sandbox, username, password, invoiceCode },
        });
        setHasPassword(saved.qpay.hasPassword);
        setQpay((q) => ({ ...q, password: "" }));
        setBaseline(JSON.stringify({ deliveryEnabled, deliveryFee, bank, qpay: { ...qpay, password: "", hasPassword: undefined } }));
      }, t("common.saved"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <DetailHeader
        backHref="/settings"
        title={t("pay.title")}
        aside={
          <Button type="submit" className="relative h-10 px-5" disabled={saving || !dirty} aria-busy={saving}>
            {/* The label keeps the button's width; the spinner sits over it while saving. */}
            <span className={saving ? "invisible" : undefined}>{t("common.save")}</span>
            {saving && <Loader2 className="absolute inset-0 m-auto animate-spin" />}
          </Button>
        }
      />

      <div className="space-y-4">
        <Card className="space-y-4 p-4">
          <Toggle
            title={t("pay.delivery")}
            desc={t("pay.deliveryDesc")}
            checked={deliveryEnabled}
            onChange={setDeliveryEnabled}
          />
          {deliveryEnabled && (
            <Field label={t("on.deliveryFee")} error={submitted && !deliveryFee ? t("pay.required") : undefined}>
              <Input
                inputMode="numeric"
                className="font-mono"
                value={deliveryFee}
                onFocus={(e) => e.currentTarget.select()}
                onChange={(e) => setDeliveryFee(e.target.value.replace(/\D/g, ""))}
              />
            </Field>
          )}
        </Card>

        <Card className="space-y-4 p-4">
          <Toggle
            title={t("pay.bank")}
            desc={t("pay.bankDesc")}
            checked={bankEnabled}
            onChange={setBankEnabled}
          />
          {bankEnabled && (
            <>
              <p className="text-xs text-muted-foreground">{t("pay.bankAccountsHint", { max: MAX_SHOP_BANKS })}</p>
              <BankAccounts
                bare
                value={accounts}
                onChange={setAccounts}
                showErrors={submitted}
                requireAll
                holderLabel={t("pay.accountName")}
              />
              {bankEmpty && <p className="text-sm text-destructive">{bankEmpty}</p>}
            </>
          )}
        </Card>

        <Card className="space-y-4 p-4">
          <Toggle
            title="QPay"
            desc={t("pay.qpayDesc")}
            checked={qpay.enabled}
            onChange={(enabled) => setQpay((q) => ({ ...q, enabled }))}
          />
          {qpay.enabled && (
            <div className="space-y-3">
              <Field label={t("pay.qpayUsername")} error={qpayErrors.username}>
                <Input
                  value={qpay.username}
                  autoComplete="off"
                  onChange={(e) => setQpay((q) => ({ ...q, username: e.target.value }))}
                  className="font-mono"
                />
              </Field>
              <Field
                label={t("pay.qpayPassword")}
                hint={hasPassword ? t("pay.qpayPasswordKeep") : undefined}
                error={qpayErrors.password}
              >
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={qpay.password}
                  placeholder={hasPassword ? "••••••••" : undefined}
                  onChange={(e) => setQpay((q) => ({ ...q, password: e.target.value }))}
                />
              </Field>
              <Field label={t("pay.qpayInvoiceCode")} error={qpayErrors.invoiceCode}>
                <Input
                  value={qpay.invoiceCode}
                  autoComplete="off"
                  onChange={(e) => setQpay((q) => ({ ...q, invoiceCode: e.target.value }))}
                  className="font-mono"
                />
              </Field>
              <Toggle
                title={t("pay.qpaySandbox")}
                desc={t("pay.qpaySandboxDesc")}
                checked={qpay.sandbox}
                onChange={(sandbox) => setQpay((q) => ({ ...q, sandbox }))}
              />
            </div>
          )}
        </Card>
      </div>
    </form>
  );
}

function Toggle({
  title,
  desc,
  checked,
  onChange,
}: {
  title: string;
  desc: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="min-w-0 grow">
        <span className="block text-[15px] font-bold">{title}</span>
        <span className="block text-sm text-muted-foreground">{desc}</span>
      </span>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={title} />
    </div>
  );
}
