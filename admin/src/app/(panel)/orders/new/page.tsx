"use client";

import Field from "@/components/common/Field";
import Thumb from "@/components/common/Thumb";
import { useToast } from "@/components/common/Toast";
import DetailHeader from "@/components/layout/DetailHeader";
import OrderProductPicker, { Stepper, type OrderLine } from "@/components/orders/OrderProductPicker";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createOrder } from "@/lib/api/orders";
import { getDeliverySettings } from "@/lib/api/paymentSettings";
import { useApi } from "@/lib/useApi";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatMNT, toNumber } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useDirty } from "@/lib/useDirty";

export default function NewOrderPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { run } = useToast();

  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  // Тохиргоо (Төлбөрийн тохиргоо): хүргэлтийн төлбөр авах эсэх, анхдагч үнэ.
  const { data: delivery } = useApi(getDeliverySettings);
  const [deliveryFee, setDeliveryFee] = useState<string | null>(null);
  const chargeDelivery = delivery?.enabled ?? false;
  const fee = chargeDelivery ? toNumber(deliveryFee ?? String(delivery?.fee ?? 0)) : 0;
  const [lines, setLines] = useState<OrderLine[]>([]);
  const [picking, setPicking] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  // The save button stays off until something changes.
  const { dirty } = useDirty({ phone, address, deliveryFee, lines });

  const subtotal = lines.reduce((sum, line) => sum + line.qty * line.price, 0);
  const total = subtotal + fee;

  const errors = {
    phone: phone.length < 8 ? t("checkout.phoneInvalid") : undefined,
    address: !address.trim() ? t("on.addressRequired") : undefined,
    items: lines.length === 0 ? t("on.noneSelected") : undefined,
  };
  const show = (field: keyof typeof errors) => (submitted ? errors[field] : undefined);

  function setQty(key: string, qty: number) {
    setLines((prev) =>
      prev.flatMap((line) => {
        if (line.key !== key) return [line];
        const next = line.max != null ? Math.min(qty, line.max) : qty;
        return next < 1 ? [] : [{ ...line, qty: next }];
      })
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!dirty) return;
    setSubmitted(true);
    if (Object.values(errors).some(Boolean)) return;
    const saved = await run(
      () =>
        createOrder({
          customer: { phone, address: address.trim() },
          items: lines.map((line) => ({ variantId: line.variantId, name: line.name, qty: line.qty, price: line.price })),
          deliveryFee: fee,
        }),
      t("on.created")
    );
    if (saved) router.replace("/orders");
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <DetailHeader
        backHref="/orders"
        title={t("on.title")}
        aside={
          <Button type="submit" className="h-10 px-5" disabled={!dirty}>
            {t("on.create")}
          </Button>
        }
      />

      <div className="space-y-5">
        <section className="space-y-3">
          <h2 className="px-1 text-[15px] font-bold">{t("on.customer")}</h2>
          <Field label={t("pr.phone")} error={show("phone")}>
            <Input
              type="tel"
              inputMode="numeric"
              maxLength={8}
              className="font-mono"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              aria-invalid={Boolean(show("phone"))}
            />
          </Field>
          <Field label={t("on.address")} error={show("address")}>
            <Textarea
              value={address}
              className="min-h-24"
              onChange={(e) => setAddress(e.target.value)}
              aria-invalid={Boolean(show("address"))}
            />
          </Field>
        </section>

        <section className="space-y-3">
          <h2 className="px-1 text-[15px] font-bold">{t("on.selected")}</h2>
          {lines.length > 0 && (
            <Card className="divide-y divide-border">
              {lines.map((line) => (
                <div key={line.key} className="flex items-center gap-3 p-3">
                  <Thumb id={line.image} variant="icon" size={44} className="rounded-xl" />
                  <span className="min-w-0 grow">
                    <span className="block truncate text-sm font-bold">{line.name}</span>
                    <span className="block font-mono text-xs text-muted-foreground">{formatMNT(line.price)}</span>
                  </span>
                  <Stepper qty={line.qty} max={line.max} onChange={(qty) => setQty(line.key, qty)} />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("on.removeAria", { name: line.name })}
                    title={t("common.delete")}
                    className="shrink-0 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive"
                    onClick={() => setQty(line.key, 0)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))}
            </Card>
          )}
          {show("items") && <p className="px-1 text-sm text-destructive">{errors.items}</p>}
          <Button type="button" variant="soft" size="lg" className="w-full" onClick={() => setPicking(true)}>
            <Plus />
            {t("on.pick")}
          </Button>
        </section>

        <section className="space-y-3">
          {chargeDelivery && (
            <Field label={t("on.deliveryFee")}>
              <Input
                inputMode="numeric"
                className="font-mono"
                value={deliveryFee ?? String(delivery?.fee ?? 0)}
                onFocus={(e) => e.currentTarget.select()}
                onChange={(e) => setDeliveryFee(e.target.value.replace(/\D/g, ""))}
              />
            </Field>
          )}
          <dl className="space-y-1 rounded-2xl bg-muted/60 px-4 py-3 text-[15px]">
            <div className="flex items-center justify-between text-muted-foreground">
              <dt>{t("oi.subtotal")}</dt>
              <dd className="font-mono">{formatMNT(subtotal)}</dd>
            </div>
            {chargeDelivery && (
              <div className="flex items-center justify-between text-muted-foreground">
                <dt>{t("oi.delivery")}</dt>
                <dd className="font-mono">{formatMNT(fee)}</dd>
              </div>
            )}
            <div className="flex items-center justify-between pt-1 text-base font-extrabold">
              <dt>{t("oi.total")}</dt>
              <dd className="font-mono">{formatMNT(total)}</dd>
            </div>
          </dl>
        </section>
      </div>

      {picking && (
        <OrderProductPicker
          initial={lines}
          onClose={() => setPicking(false)}
          onConfirm={(picked) => {
            setLines(picked);
            setPicking(false);
          }}
        />
      )}
    </form>
  );
}
