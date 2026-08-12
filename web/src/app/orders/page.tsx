"use client";

import OrderProgress from "@/components/orders/OrderProgress";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import OrdersSidebar from "@/components/orders/OrdersSidebar";
import { Button } from "@/components/ui/button";
import PlaceholderImage from "@/components/ui/placeholder-image";
import { formatMNT } from "@/lib/utils";
import { useAppSelector } from "@/store/hooks";
import { Package } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type Tab = "active" | "delivered" | "cancelled";

const tabs: { id: Tab; label: string }[] = [
  { id: "active", label: "Идэвхтэй" },
  { id: "delivered", label: "Хүргэгдсэн" },
  { id: "cancelled", label: "Цуцлагдсан" },
];

export default function OrdersPage() {
  const orders = useAppSelector((state) => state.orders);
  const [tab, setTab] = useState<Tab>("active");

  const filtered = orders.filter((order) =>
    tab === "active"
      ? order.status === "pending"
      : tab === "delivered"
      ? order.status === "confirmed"
      : false
  );

  if (orders.length === 0) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Захиалга алга байна
        </h1>
        <p className="text-muted-foreground mb-6">
          Таны хийсэн захиалгууд энд харагдана.
        </p>
        <Button asChild>
          <Link href="/">Худалдан авалт хийх</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex gap-6">
        <OrdersSidebar />

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h1 className="text-2xl font-bold text-foreground">
              Миний захиалга
            </h1>
            <div className="flex items-center gap-1 rounded-full bg-muted p-1">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    tab === t.id
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground">
              Энэ ангилалд захиалга алга байна
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl border border-border bg-card p-4 sm:p-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-foreground">
                        #{order.id}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {order.items.length} бараа ·{" "}
                        {new Date(order.createdAt).toLocaleDateString("mn-MN", {
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <span className="text-lg font-bold text-foreground">
                      {formatMNT(order.total)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    {order.items.slice(0, 4).map((item) => (
                      <PlaceholderImage
                        key={item.id}
                        className="w-12 h-12 rounded-lg shrink-0"
                      />
                    ))}
                  </div>

                  <div className="grid sm:grid-cols-[1fr_auto] gap-4 items-center">
                    <OrderProgress
                      status={order.status}
                      caption={
                        order.status === "confirmed"
                          ? "Удахгүй хүргэгдэнэ"
                          : "Төлбөр хүлээгдэж байна"
                      }
                    />
                    <div className="flex gap-2 shrink-0">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/orders/${order.id}`}>Дэлгэрэнгүй</Link>
                      </Button>
                      {order.status === "pending" ? (
                        <Button
                          size="sm"
                          className="brand-gradient text-white"
                          asChild
                        >
                          <Link href={`/checkout/${order.id}/pay`}>
                            Төлөх
                          </Link>
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="brand-gradient text-white"
                          asChild
                        >
                          <Link href={`/orders/${order.id}`}>Хянах</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
