"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  formatCardNumber,
  formatCvv,
  formatExpiry,
  isValidCardNumber,
  isValidCvv,
  isValidExpiry,
} from "@/lib/card";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { cn, formatMNT } from "@/lib/utils";
import type { PaymentMethod, ShippingInfo } from "@/types/order";
import { CreditCard, Landmark, Lock, Smartphone, Wallet } from "lucide-react";
import { useState } from "react";

interface PaymentFormProps {
  total: number;
  shippingInfo: ShippingInfo;
  onSubmit: (method: PaymentMethod) => void;
  isSubmitting: boolean;
}

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
    icon: typeof CreditCard;
  }[] = [
    { id: "card", labelKey: "checkout.payment.card", icon: CreditCard },
    { id: "qpay", labelKey: "checkout.payment.qpay", icon: Smartphone },
    { id: "socialpay", labelKey: "checkout.payment.socialpay", icon: Wallet },
    { id: "cash", labelKey: "checkout.payment.cash", icon: Landmark },
  ];

  const [method, setMethod] = useState<PaymentMethod>("card");
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (method === "card" && !cardIsValid) {
      setTouched({ cardNumber: true, expiry: true, cvv: true });
      return;
    }
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
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
                onBlur={() =>
                  setTouched((s) => ({ ...s, cardNumber: true }))
                }
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

        {method !== "card" && (
          <p className="text-sm text-muted-foreground">
            {t("checkout.payment.redirectNote", {
              method: t(methods.find((m) => m.id === method)?.labelKey ?? ""),
            })}
          </p>
        )}
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
