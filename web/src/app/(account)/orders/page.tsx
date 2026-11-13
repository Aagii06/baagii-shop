"use client";

import OrderProgress from "@/components/orders/OrderProgress";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import { Button } from "@/components/ui/button";
import PlaceholderImage from "@/components/ui/placeholder-image";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatDate, formatMNT } from "@/lib/utils";
import { useOrderStore } from "@/store/orderStore";
import PageLoader from "@/components/ui/page-loader";
import { Package } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type Tab = "all" | "active" | "delivered" | "cancelled" | "returned";

export default function OrdersPage() {
  const { t, locale } = useLanguage();
  const orders = useOrderStore((s) => s.orders);
  const ordersLoaded = useOrderStore((s) => s.loaded);
  const [tab, setTab] = useState<Tab>("all");

  const tabs: { id: Tab; label: string }[] = [
    { id: "all", label: t("orders.tabs.all") },
    { id: "active", label: t("orders.tabs.active") },
    { id: "delivered", label: t("orders.tabs.delivered") },
    { id: "cancelled", label: t("orders.tabs.cancelled") },
    { id: "returned", label: t("orders.tabs.returned") },
  ];

  const filtered = orders.filter((order) =>
    tab === "all"
      ? true
      : tab === "active"
      ? order.status === "pending"
      : tab === "delivered"
      ? order.status === "confirmed"
      : tab === "cancelled"
      ? order.status === "cancelled"
      : order.status === "returned"
  );

  if (!ordersLoaded) {
    return <PageLoader className="px-0 py-0 sm:py-0" />;
  }

  if (orders.length === 0) {
    return (
      <div className="py-10 text-center">
        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {t("orders.empty.title")}
        </h1>
        <p className="text-muted-foreground mb-6">{t("orders.empty.desc")}</p>
        <Button asChild>
          <Link href="/search">{t("orders.empty.cta")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          {t("orders.title")}
        </h1>
        <div className="flex flex-wrap items-center gap-1 rounded-full bg-muted p-1">
          {tabs.map((tabOption) => (
            <button
              key={tabOption.id}
              onClick={() => setTab(tabOption.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                tab === tabOption.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              {tabOption.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground">
          {t("orders.emptyTab")}
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
                    {t("orders.items", { count: order.items.length })} ·{" "}
                    {formatDate(order.createdAt, locale)}
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
                    t(`orders.caption.${order.status}`)
                  }
                />
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/orders/${order.id}`}>
                      {t("orders.detail")}
                    </Link>
                  </Button>
                  {order.status === "pending" ? (
                    <Button
                      size="sm"
                      className="brand-gradient text-white"
                      asChild
                    >
                      <Link href={`/checkout/${order.id}/pay`}>
                        {t("orders.pay")}
                      </Link>
                    </Button>
                  ) : order.status === "confirmed" ? (
                    <Button
                      size="sm"
                      className="brand-gradient text-white"
                      asChild
                    >
                      <Link href={`/orders/${order.id}`}>
                        {t("orders.track")}
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
