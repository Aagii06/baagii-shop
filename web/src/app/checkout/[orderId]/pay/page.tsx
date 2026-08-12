"use client";

import PaymentForm from "@/components/checkout/PaymentForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { confirmOrder } from "@/store/orderSlice";
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

  const handlePay = async () => {
    if (!order) return;

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    dispatch(confirmOrder(order.id));
    router.push(`/orders/${order.id}`);
  };

  if (!order) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Order not found
        </h1>
        <Button asChild>
          <Link href="/orders">View Orders</Link>
        </Button>
      </div>
    );
  }

  if (order.status === "confirmed") {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Order already paid
        </h1>
        <p className="text-muted-foreground mb-6">
          Order {order.id} has already been confirmed.
        </p>
        <Button asChild>
          <Link href={`/orders/${order.id}`}>View Order</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold text-foreground mb-2">
        Complete Payment
      </h1>
      <p className="text-muted-foreground mb-8">
        Order {order.id} • {order.items.length}{" "}
        {order.items.length === 1 ? "item" : "items"}
      </p>

      <div className="grid gap-6 sm:grid-cols-2">
        <PaymentForm
          total={order.total}
          onSubmit={handlePay}
          isSubmitting={isSubmitting}
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">
                ${order.subtotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping</span>
              <span className="font-medium">
                {order.shipping === 0
                  ? "Free"
                  : `$${order.shipping.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax</span>
              <span className="font-medium">${order.tax.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-lg font-semibold">Total</span>
              <span className="text-lg font-bold text-primary">
                ${order.total.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
