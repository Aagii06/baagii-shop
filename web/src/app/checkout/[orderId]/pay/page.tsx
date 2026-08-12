"use client";

import PaymentForm from "@/components/checkout/PaymentForm";
import { Button } from "@/components/ui/button";
import { formatMNT } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { confirmOrder } from "@/store/orderSlice";
import type { PaymentMethod } from "@/types/order";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function PayOrderPage() {
  const { orderId } = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const order = useAppSelector((state) =>
    state.orders.find((order) => order.id === orderId)
  );

  const handlePay = async (method: PaymentMethod) => {
    if (!order) return;

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    dispatch(confirmOrder({ id: order.id, paymentMethod: method }));
    router.push(`/orders/${order.id}`);
  };

  if (!order) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Захиалга олдсонгүй
        </h1>
        <Button asChild>
          <Link href="/orders">Захиалгууд руу очих</Link>
        </Button>
      </div>
    );
  }

  if (order.status === "confirmed") {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Захиалга төлөгдсөн байна
        </h1>
        <p className="text-muted-foreground mb-6">
          {order.id} захиалга аль хэдийн баталгаажсан.
        </p>
        <Button asChild>
          <Link href={`/orders/${order.id}`}>Захиалга харах</Link>
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
              Захиалгын дүн
            </h2>

            <div className="space-y-3">
              {order.items.map((item) => (
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
                <span className="font-medium">
                  {formatMNT(order.subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Хүргэлт</span>
                <span className="font-medium">
                  {order.shipping === 0
                    ? "Үнэгүй"
                    : formatMNT(order.shipping)}
                </span>
              </div>
              {order.coupon > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Купон</span>
                  <span className="font-medium text-emerald-600">
                    -{formatMNT(order.coupon)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-border">
              <span className="font-semibold text-foreground">
                Төлөх дүн
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
