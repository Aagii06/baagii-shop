"use client";

import ShippingForm from "@/components/checkout/ShippingForm";
import { Button } from "@/components/ui/button";
import { calculatePricing } from "@/lib/pricing";
import { formatMNT } from "@/lib/utils";
import { clearCart } from "@/store/cartSlice";
import { clearCoupon } from "@/store/couponSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createOrder } from "@/store/orderSlice";
import type { ShippingInfo } from "@/types/order";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CheckoutPage() {
  const cart = useAppSelector((state) => state.cart);
  const coupon = useAppSelector((state) => state.coupon);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0);

  const { subtotal, shipping, coupon: couponAmount, total } = calculatePricing(
    cart,
    { shippingFee: deliveryFee || undefined, couponAmount: coupon.amount }
  );

  const handlePlaceOrder = (shippingInfo: ShippingInfo) => {
    setIsSubmitting(true);
    setDeliveryFee(shippingInfo.deliveryFee);

    const pricing = calculatePricing(cart, {
      shippingFee: shippingInfo.deliveryFee,
      couponAmount: coupon.amount,
    });

    const orderId = `UVS-${Date.now().toString(36).toUpperCase()}`;

    dispatch(
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
      })
    );
    dispatch(clearCart());
    dispatch(clearCoupon());

    router.push(`/checkout/${orderId}/pay`);
  };

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Таны сагс хоосон байна
        </h1>
        <p className="text-muted-foreground mb-6">
          Захиалга хийхийн өмнө сагсандаа бараа нэмнэ үү.
        </p>
        <Button asChild>
          <Link href="/">Худалдан авалт хийх</Link>
        </Button>
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
          />
        </div>

        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-24 rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">
              Захиалгын дүн
            </h2>

            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between gap-3 text-sm">
                  <span className="text-muted-foreground line-clamp-1">
                    {item.name}
                    <span className="text-xs"> · {item.quantity}ш</span>
                  </span>
                  <span className="font-medium shrink-0">
                    {formatMNT(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-3 border-t border-border">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Барааны дүн</span>
                <span className="font-medium">{formatMNT(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Хүргэлт</span>
                <span className="font-medium">
                  {shipping === 0 ? "Үнэгүй" : formatMNT(shipping)}
                </span>
              </div>
              {couponAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Купон {coupon.code}
                  </span>
                  <span className="font-medium text-emerald-600">
                    -{formatMNT(couponAmount)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-border">
              <span className="font-semibold text-foreground">
                Төлөх дүн
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
              {isSubmitting ? "Боловсруулж байна..." : "Үргэлжлүүлэх →"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
