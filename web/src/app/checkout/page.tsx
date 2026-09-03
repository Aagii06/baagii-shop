"use client";

import PhoneAuthGate from "@/components/checkout/PhoneAuthGate";
import ShippingForm from "@/components/checkout/ShippingForm";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { calculatePricing } from "@/lib/pricing";
import { formatMNT } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useCouponStore } from "@/store/couponStore";
import { useOrderStore } from "@/store/orderStore";
import type { ShippingInfo } from "@/types/order";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CheckoutPage() {
  const { t } = useLanguage();
  const cart = useCartStore((s) => s.items);
  const cartHydrated = useCartStore((s) => s.hydrated);
  const clearServerCart = useCartStore((s) => s.clearServerCart);
  const couponCode = useCouponStore((s) => s.code);
  const couponValue = useCouponStore((s) => s.amount);
  const clearCoupon = useCouponStore((s) => s.clearCoupon);
  const createOrder = useOrderStore((s) => s.createOrder);
  const authLoading = useAuthStore((s) => s.loading);
  const isAuthed = useAuthStore((s) => s.user != null || s.phone != null);
  const verifiedPhone = useAuthStore((s) => s.phone);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0);

  const { subtotal, shipping, coupon: couponAmount, total } = calculatePricing(
    cart,
    { shippingFee: deliveryFee || undefined, couponAmount: couponValue }
  );

  const handlePlaceOrder = (shippingInfo: ShippingInfo) => {
    setIsSubmitting(true);
    setDeliveryFee(shippingInfo.deliveryFee);

    const pricing = calculatePricing(cart, {
      shippingFee: shippingInfo.deliveryFee,
      couponAmount: couponValue,
    });

    const orderId = `UVS-${Date.now().toString(36).toUpperCase()}`;

    createOrder({
      id: orderId,
      items: cart,
      shippingInfo,
      subtotal: pricing.subtotal,
      shipping: pricing.shipping,
      coupon: pricing.coupon,
      total: pricing.total,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
    clearServerCart();
    clearCoupon();

    router.push(`/checkout/${orderId}/pay`);
  };

  if (cart.length === 0 && !cartHydrated) {
    return null;
  }

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {t("cart.emptyCheckout.title")}
        </h1>
        <p className="text-muted-foreground mb-6">
          {t("cart.emptyCheckout.desc")}
        </p>
        <Button asChild>
          <Link href="/">{t("cart.empty.cta")}</Link>
        </Button>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-24 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // A guest token is enough to build a cart, but confirming the order needs a
  // phone-verified session — the cart stays attached once the phone is added.
  if (!isAuthed) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <PhoneAuthGate />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2">
          <ShippingForm
            onSubmit={handlePlaceOrder}
            isSubmitting={isSubmitting}
            defaultPhone={verifiedPhone ?? ""}
          />
        </div>

        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-24 rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">
              {t("checkout.summary.title")}
            </h2>

            <div className="space-y-3">
              {cart.map((item) => (
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
                <span className="font-medium">{formatMNT(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {t("cart.summary.shipping")}
                </span>
                <span className="font-medium">
                  {shipping === 0 ? t("cart.summary.free") : formatMNT(shipping)}
                </span>
              </div>
              {couponAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t("cart.summary.coupon", { code: couponCode ?? "" })}
                  </span>
                  <span className="font-medium text-emerald-600">
                    -{formatMNT(couponAmount)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-border">
              <span className="font-semibold text-foreground">
                {t("checkout.summary.payable")}
              </span>
              <span className="text-xl font-bold text-primary">
                {formatMNT(total)}
              </span>
            </div>

            <Button
              type="submit"
              form="shipping-form"
              size="lg"
              className="w-full brand-gradient text-white"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? t("checkout.summary.processing")
                : `${t("checkout.summary.continue")} →`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
