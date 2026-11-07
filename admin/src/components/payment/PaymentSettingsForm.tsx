"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import Field from "@/components/common/Field";
import { useToast } from "@/components/common/Toast";
import DetailHeader from "@/components/layout/DetailHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { savePaymentSettings, type BankSettings, type PaymentSettings } from "@/lib/api/paymentSettings";
import { toNumber } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useState } from "react";

/**
 * The two ways a shopper can pay on the web: a bank transfer (the shop's
 * account is shown; the order counts as paid once an admin confirms it) and
 * QPay (a QR / bank-app invoice, marked paid automatically). Saving with
 * QPay on checks the credentials against QPay first.
 */
export default function PaymentSettingsForm({ settings }: { settings: PaymentSettings }) {
  const { t } = useLanguage();
  const { run } = useToast();

  const [deliveryEnabled, setDeliveryEnabled] = useState(settings.delivery.enabled);
  const [deliveryFee, setDeliveryFee] = useState(String(settings.delivery.fee));
  const [bank, setBank] = useState<BankSettings>(settings.bank);
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
  const bankErrors = {
    bankName: required(bank.enabled, bank.bankName),
    accountName: required(bank.enabled, bank.accountName),
    accountNumber: required(bank.enabled, bank.accountNumber),
  };
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
    if (blank(bank.enabled, [bank.bankName, bank.accountName, bank.accountNumber])) return;
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

  const bankField = (key: keyof typeof bankErrors | "iban", label: string, mono = false) => (
    <Field label={label} error={key === "iban" ? undefined : bankErrors[key]}>
      <Input
        value={bank[key]}
        onChange={(e) => setBank((b) => ({ ...b, [key]: e.target.value }))}
        className={mono ? "font-mono" : undefined}
      />
    </Field>
  );

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
            checked={bank.enabled}
            onChange={(enabled) => setBank((b) => ({ ...b, enabled }))}
          />
          {bank.enabled && (
            <div className="space-y-3">
              {bankField("bankName", t("pay.bankName"))}
              {bankField("accountName", t("pay.accountName"))}
              {bankField("accountNumber", t("pay.accountNumber"), true)}
              {bankField("iban", t("pay.iban"), true)}
            </div>
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
