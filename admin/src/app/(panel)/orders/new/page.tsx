"use client";

import Field from "@/components/common/Field";
import SampleNotice from "@/components/common/SampleNotice";
import Thumb from "@/components/common/Thumb";
import { useToast } from "@/components/common/Toast";
import DetailHeader from "@/components/layout/DetailHeader";
import OrderProductPicker from "@/components/orders/OrderProductPicker";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createOrder } from "@/lib/api/orders";
import type { PostDetail, PostProduct } from "@/lib/api/posts";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatMNT, toNumber } from "@/lib/utils";
import { Minus, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const DEFAULT_DELIVERY_FEE = "6000";

interface Line {
  /** `PostProduct.id`, or `p<productId>` for a product with no variants. */
  key: string;
  variantId: number;
  name: string;
  image: string | null;
  price: number;
  qty: number;
  /** Stock left; `null` when unknown. */
  max: number | null;
}

export default function NewOrderPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { run } = useToast();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [deliveryFee, setDeliveryFee] = useState(DEFAULT_DELIVERY_FEE);
  const [lines, setLines] = useState<Line[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const subtotal = lines.reduce((sum, line) => sum + line.qty * line.price, 0);
  const total = subtotal + toNumber(deliveryFee);

  const errors = {
    name: !name.trim() ? t("on.nameRequired") : undefined,
    phone: phone.length < 8 ? t("checkout.phoneInvalid") : undefined,
    address: !address.trim() ? t("on.addressRequired") : undefined,
    items: lines.length === 0 ? t("on.noneSelected") : undefined,
  };
  const show = (field: keyof typeof errors) => (submitted ? errors[field] : undefined);

  function addLine(post: PostDetail, variant: PostProduct | null) {
    const key = variant ? String(variant.id) : `p${post.id}`;
    const max = variant ? toNumber(variant.remain) : toNumber(post.remain);
    setLines((prev) => {
      const existing = prev.find((line) => line.key === key);
      if (existing) {
        return prev.map((line) =>
          line.key === key ? { ...line, qty: line.max != null ? Math.min(line.qty + 1, line.max) : line.qty + 1 } : line
        );
      }
      const variantName = variant?.variantName;
      return [
        ...prev,
        {
          key,
          variantId: variant?.id ?? post.id,
          name: variantName && variantName !== post.name ? `${post.name} · ${variantName}` : post.name,
          image: post.images?.[0] ?? null,
          price: toNumber(variant?.price ?? post.price),
          qty: 1,
          max,
        },
      ];
    });
  }

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
    setSubmitted(true);
    if (Object.values(errors).some(Boolean)) return;
    const saved = await run(
      () =>
        createOrder({
          customer: { name: name.trim(), phone, address: address.trim() },
          items: lines.map((line) => ({ variantId: line.variantId, name: line.name, qty: line.qty, price: line.price })),
          deliveryFee: toNumber(deliveryFee),
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
          <Button type="submit" className="h-10 px-5">
            {t("on.create")}
          </Button>
        }
      />

      <div className="space-y-5">
        <SampleNotice>{t("common.sampleOrders")}</SampleNotice>

        <section className="space-y-3">
          <h2 className="px-1 text-[15px] font-bold">{t("on.customer")}</h2>
          <Field label={t("common.name")} error={show("name")}>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" aria-invalid={Boolean(show("name"))} />
          </Field>
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
          <h2 className="px-1 text-[15px] font-bold">{t("on.products")}</h2>
          <OrderProductPicker onAdd={addLine} />
        </section>

        <section className="space-y-3">
          <h2 className="px-1 text-[15px] font-bold">{t("on.selected")}</h2>
          {lines.length === 0 ? (
            <p className={submitted ? "px-1 text-sm text-destructive" : "px-1 text-sm text-muted-foreground"}>
              {t("on.noneSelected")}
            </p>
          ) : (
            <Card className="divide-y divide-border">
              {lines.map((line) => (
                <div key={line.key} className="flex items-center gap-3 p-3">
                  <Thumb id={line.image} size={44} className="rounded-xl" />
                  <span className="min-w-0 grow">
                    <span className="block truncate text-sm font-bold">{line.name}</span>
                    <span className="block font-mono text-xs text-muted-foreground">{formatMNT(line.price)}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1">
                    <Button type="button" variant="outline" size="icon-sm" aria-label={t("common.remove")} onClick={() => setQty(line.key, line.qty - 1)}>
                      <Minus />
                    </Button>
                    <span aria-live="polite" className="w-8 text-center font-mono text-[15px] font-bold">
                      {line.qty}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      aria-label={t("common.add")}
                      disabled={line.max != null && line.qty >= line.max}
                      onClick={() => setQty(line.key, line.qty + 1)}
                    >
                      <Plus />
                    </Button>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("on.removeAria", { name: line.name })}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => setQty(line.key, 0)}
                  >
                    <X />
                  </Button>
                </div>
              ))}
            </Card>
          )}
        </section>

        <section className="space-y-3">
          <Field label={t("on.deliveryFee")}>
            <Input
              inputMode="numeric"
              className="font-mono"
              value={deliveryFee}
              onFocus={(e) => e.currentTarget.select()}
              onChange={(e) => setDeliveryFee(e.target.value.replace(/\D/g, ""))}
            />
          </Field>
          <dl className="space-y-1 rounded-2xl bg-muted/60 px-4 py-3 text-[15px]">
            <div className="flex items-center justify-between text-muted-foreground">
              <dt>{t("oi.subtotal")}</dt>
              <dd className="font-mono">{formatMNT(subtotal)}</dd>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <dt>{t("oi.delivery")}</dt>
              <dd className="font-mono">{formatMNT(toNumber(deliveryFee))}</dd>
            </div>
            <div className="flex items-center justify-between pt-1 text-base font-extrabold">
              <dt>{t("oi.total")}</dt>
              <dd className="font-mono">{formatMNT(total)}</dd>
            </div>
          </dl>
        </section>
      </div>
    </form>
  );
}
