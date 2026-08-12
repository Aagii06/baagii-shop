"use client";

import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAppSelector } from "@/store/hooks";
import { Package } from "lucide-react";
import Link from "next/link";

export default function OrdersPage() {
  const orders = useAppSelector((state) => state.orders);

  if (orders.length === 0) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">
          No orders yet
        </h1>
        <p className="text-muted-foreground mb-6">
          Your placed orders will show up here.
        </p>
        <Button asChild>
          <Link href="/">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-foreground mb-8">My Orders</h1>

      <div className="space-y-4 max-w-3xl">
        {orders.map((order) => (
          <Link key={order.id} href={`/orders/${order.id}`}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 sm:p-6 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-semibold text-foreground">
                      {order.id}
                    </span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString()} •{" "}
                    {order.items.length}{" "}
                    {order.items.length === 1 ? "item" : "items"}
                  </p>
                </div>
                <span className="text-lg font-bold text-foreground shrink-0">
                  ${order.total.toFixed(2)}
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
