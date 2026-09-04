"use client";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { cn, formatMNT } from "@/lib/utils";
import type { PaymentMethod, ShippingInfo } from "@/types/order";
import { Landmark, Lock, Smartphone } from "lucide-react";
import { useState } from "react";

/* --- Картаар төлөх түр хаалттай (дараа сэргээх) ---------------------------
import { Input } from "@/components/ui/input";
import {
  formatCardNumber,
  formatCvv,
  formatExpiry,
  isValidCardNumber,
  isValidCvv,
  isValidExpiry,
} from "@/lib/card";
import { CreditCard } from "lucide-react";
------------------------------------------------------------------------- */

interface PaymentFormProps {
  total: number;
  shippingInfo: ShippingInfo;
  onSubmit: (method: PaymentMethod) => void;
  isSubmitting: boolean;
}

// Demo account the shopper transfers to — sample values, not a real account.
const BANK_DETAILS = {
  accountName: "GOLDEN UVS ХХК",
  bankName: "Худалдаа хөгжлийн банк",
  accountNumber: "499 123 4567",
  iban: "MN23 0004 9912 3456 7890",
};

export default function PaymentForm({
  total,
  shippingInfo,
  onSubmit,
  isSubmitting,
}: PaymentFormProps) {
  const { t } = useLanguage();

  const methods: {
    id: PaymentMethod;
    labelKey: string;
    icon: typeof Landmark;
  }[] = [
    { id: "bank", labelKey: "checkout.payment.bank", icon: Landmark },
    { id: "qpay", labelKey: "checkout.payment.qpay", icon: Smartphone },
    // Картаар болон бэлнээр төлөх түр хаалттай — дараа сэргээнэ:
    // { id: "card", labelKey: "checkout.payment.card", icon: CreditCard },
    // { id: "cash", labelKey: "checkout.payment.cash", icon: Landmark },
  ];

  const [method, setMethod] = useState<PaymentMethod>("bank");

  /* --- Картаар төлөх түр хаалттай ---------------------------------------
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [saveCard, setSaveCard] = useState(true);
  const [touched, setTouched] = useState({
    cardNumber: false,
    expiry: false,
    cvv: false,
  });

  const cardErrors = {
    cardNumber: !isValidCardNumber(cardNumber),
    expiry: !isValidExpiry(expiry),
    cvv: !isValidCvv(cvv),
  };
  const cardIsValid =
    !cardErrors.cardNumber && !cardErrors.expiry && !cardErrors.cvv;
  --------------------------------------------------------------------- */

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(method);
  };

  const deliveryLabel =
    shippingInfo.deliveryMethod === "city"
      ? t("orders.delivery.city")
      : t("orders.delivery.region");

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          {t("checkout.payment.methodsTitle")}
        </h2>
        <div className="grid grid-cols-2 gap-3 mb-5">
          {methods.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMethod(m.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-xl border-2 py-4 transition-colors",
                method === m.id
                  ? "border-primary bg-accent/40"
                  : "border-border hover:border-primary/40"
              )}
            >
              <m.icon className="h-5 w-5 text-foreground" />
              <span className="text-sm font-medium text-foreground">
                {t(m.labelKey)}
              </span>
            </button>
          ))}
        </div>

        {method === "bank" && (
          <div className="space-y-3">
            <div className="rounded-xl border border-border divide-y divide-border">
              {[
                {
                  label: t("checkout.payment.bank.accountName"),
                  value: BANK_DETAILS.accountName,
                },
                {
                  label: t("checkout.payment.bank.bankName"),
                  value: BANK_DETAILS.bankName,
                },
                {
                  label: t("checkout.payment.bank.accountNumber"),
                  value: BANK_DETAILS.accountNumber,
                },
                {
                  label: t("checkout.payment.bank.iban"),
                  value: BANK_DETAILS.iban,
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-3 px-4 py-2.5"
                >
                  <span className="text-sm text-muted-foreground">
                    {row.label}
                  </span>
                  <span className="text-sm font-semibold text-foreground tabular-nums">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("checkout.payment.bank.note")}
            </p>
          </div>
        )}

        {method === "qpay" && (
          <p className="text-sm text-muted-foreground">
            {t("checkout.payment.redirectNote", {
              method: t(methods.find((m) => m.id === method)?.labelKey ?? ""),
            })}
          </p>
        )}

        {/* --- Картаар төлөх маягт түр хаалттай --------------------------
        {method === "card" && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                {t("checkout.payment.cardNumber")}
              </label>
              <Input
                required
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="0000 0000 0000 0000"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                onBlur={() => setTouched((s) => ({ ...s, cardNumber: true }))}
                aria-invalid={touched.cardNumber && cardErrors.cardNumber}
                className={cn(
                  touched.cardNumber &&
                    cardErrors.cardNumber &&
                    "border-destructive focus-visible:ring-destructive"
                )}
              />
              {touched.cardNumber && cardErrors.cardNumber && (
                <p className="text-xs text-destructive">
                  {t("checkout.payment.error.cardNumber")}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  {t("checkout.payment.expiry")}
                </label>
                <Input
                  required
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  placeholder="MM / YY"
                  value={expiry}
                  onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  onBlur={() => setTouched((s) => ({ ...s, expiry: true }))}
                  aria-invalid={touched.expiry && cardErrors.expiry}
                  className={cn(
                    touched.expiry &&
                      cardErrors.expiry &&
                      "border-destructive focus-visible:ring-destructive"
                  )}
                />
                {touched.expiry && cardErrors.expiry && (
                  <p className="text-xs text-destructive">
                    {t("checkout.payment.error.expiry")}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  {t("checkout.payment.cvv")}
                </label>
                <Input
                  required
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  placeholder="•••"
                  value={cvv}
                  onChange={(e) => setCvv(formatCvv(e.target.value))}
                  onBlur={() => setTouched((s) => ({ ...s, cvv: true }))}
                  aria-invalid={touched.cvv && cardErrors.cvv}
                  className={cn(
                    touched.cvv &&
                      cardErrors.cvv &&
                      "border-destructive focus-visible:ring-destructive"
                  )}
                />
                {touched.cvv && cardErrors.cvv && (
                  <p className="text-xs text-destructive">
                    {t("checkout.payment.error.cvv")}
                  </p>
                )}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={saveCard}
                onChange={(e) => setSaveCard(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              {t("checkout.payment.saveCard")}
            </label>
          </div>
        )}
        --------------------------------------------------------------- */}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-foreground">
            {t("checkout.payment.deliveryTitle")}
          </h2>
        </div>
        <p className="text-sm text-foreground">
          {shippingInfo.fullName} · {shippingInfo.phone}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {shippingInfo.address} · {deliveryLabel}
        </p>
      </div>

      <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 flex items-start gap-2.5">
        <Lock className="h-4 w-4 text-emerald-700 mt-0.5 shrink-0" />
        <p className="text-xs text-emerald-800">
          {t("checkout.payment.secureNote")}
        </p>
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full brand-gradient text-white"
        disabled={isSubmitting}
      >
        {isSubmitting
          ? t("checkout.summary.processing")
          : t("checkout.payment.pay", { amount: formatMNT(total) })}
      </Button>
    </form>
  );
}
