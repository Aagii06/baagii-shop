"use client";

import PaymentForm from "@/components/checkout/PaymentForm";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatMNT } from "@/lib/utils";
import { useOrderStore } from "@/store/orderStore";
import type { PaymentMethod } from "@/types/order";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function PayOrderPage() {
  const { t } = useLanguage();
  const { orderId } = useParams();
  const router = useRouter();
  const confirmOrder = useOrderStore((s) => s.confirmOrder);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const order = useOrderStore((s) =>
    s.orders.find((order) => order.id === orderId)
  );

  const handlePay = async (method: PaymentMethod) => {
    if (!order) return;

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    confirmOrder({ id: order.id, paymentMethod: method });
    router.push(`/orders/${order.id}`);
  };

  if (!order) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {t("checkout.payment.notFound.title")}
        </h1>
        <Button asChild>
          <Link href="/orders">{t("checkout.payment.notFound.cta")}</Link>
        </Button>
      </div>
    );
  }

  if (order.status === "confirmed") {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {t("checkout.payment.alreadyPaid.title")}
        </h1>
        <p className="text-muted-foreground mb-6">
          {t("checkout.payment.alreadyPaid.desc", { id: order.id })}
        </p>
        <Button asChild>
          <Link href={`/orders/${order.id}`}>
            {t("checkout.payment.alreadyPaid.cta")}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2">
          <PaymentForm
            total={order.total}
            shippingInfo={order.shippingInfo}
            onSubmit={handlePay}
            isSubmitting={isSubmitting}
          />
        </div>

        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-24 rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">
              {t("checkout.summary.title")}
            </h2>

            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between gap-3 text-sm">
                  <span className="text-muted-foreground line-clamp-1">
                    {item.name}
                    <span className="text-xs"> × {item.quantity}</span>
                  </span>
                  <span className="font-medium shrink-0">
                    {formatMNT(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-3 border-t border-border">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {t("cart.summary.subtotal")}
                </span>
                <span className="font-medium">
                  {formatMNT(order.subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {t("cart.summary.shipping")}
                </span>
                <span className="font-medium">
                  {order.shipping === 0
                    ? t("cart.summary.free")
                    : formatMNT(order.shipping)}
                </span>
              </div>
              {order.coupon > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t("cart.summary.couponGeneric")}
                  </span>
                  <span className="font-medium text-emerald-600">
                    -{formatMNT(order.coupon)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-border">
              <span className="font-semibold text-foreground">
                {t("checkout.summary.payable")}
              </span>
              <span className="text-xl font-bold text-primary">
                {formatMNT(order.total)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
