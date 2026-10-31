"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import ChipTabs from "@/components/common/ChipTabs";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { useToast } from "@/components/common/Toast";
import PageHeader from "@/components/layout/PageHeader";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import { ORDER_TONE } from "@/components/orders/orderTone";
import { Button } from "@/components/ui/button";
import {
  getOrders,
  ORDER_STATUS_LABEL,
  orderTotal,
  setOrderStatus,
  type OrderStatus,
} from "@/lib/api/orders";
import { useApi } from "@/lib/useApi";
import { cn, formatMNT, formatWhen } from "@/lib/utils";
import { Plus, ReceiptText } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const TABS: OrderStatus[] = ["pending", "confirmed", "delivered", "returned"];

export default function OrdersPage() {
  const { t } = useLanguage();
  const { data, error, reload } = useApi(getOrders);
  const { run } = useToast();
  const [status, setStatus] = useState<OrderStatus>("pending");

  const rows = data?.filter((order) => order.status === status) ?? [];
  const pendingCount = data?.filter((order) => order.status === "pending").length ?? 0;

  async function changeStatus(id: number, to: OrderStatus, success: string) {
    if (await run(() => setOrderStatus(id, to), success)) reload();
  }

  return (
    <>
      <PageHeader
        title={t("orders.title")}
        aside={
          <div className="flex items-center gap-3">
            {data && (
              <span className="shrink-0 font-mono text-sm text-muted-foreground">
                {t("orders.count", { count: rows.length })}
              </span>
            )}
            <Button asChild size="sm" className="px-4">
              <Link href="/orders/new">
                <Plus />
                {t("common.add")}
              </Link>
            </Button>
          </div>
        }
      >
        <ChipTabs
          label={t("orders.status")}
          value={status}
          onChange={setStatus}
          options={TABS.map((s) => ({
            value: s,
            label: ORDER_STATUS_LABEL[s],
            count: s === "pending" ? pendingCount : undefined,
            idleClassName: ORDER_TONE[s].soft,
            activeClassName: ORDER_TONE[s].solid,
            badgeClassName: "bg-warning text-white",
          }))}
        />
      </PageHeader>

      {error && !data ? (
        <div className="pt-4">
          <ErrorState error={error} onRetry={reload} />
        </div>
      ) : !data ? (
        <LoadingState />
      ) : rows.length === 0 ? (
        <div className="pt-4">
          <EmptyState icon={ReceiptText} title={t("orders.noneInStatus", { status: ORDER_STATUS_LABEL[status] })} />
        </div>
      ) : (
        <ul className="divide-y divide-border border-b border-border">
          {rows.map((order) => (
            <li key={order.id} className="py-4">
              <Link href={`/orders/${order.id}`} className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-sm text-muted-foreground">#{order.id}</span>
                    <OrderStatusBadge status={order.status} />
                  </span>
                  <span className="mt-1.5 block truncate text-[15px] font-bold">
                    {order.customer.name}
                  </span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">
                    {formatWhen(order.createdAt)} · {t("orders.itemsCount", { count: order.items.length })}
                  </span>
                </span>
                <span className="shrink-0 font-mono text-[15px] font-bold">
                  {formatMNT(orderTotal(order))}
                </span>
              </Link>

              {order.status === "pending" && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Button
                    variant="ghost"
                    className={cn("h-10", ORDER_TONE.confirmed.solid)}
                    onClick={() => changeStatus(order.id, "confirmed", t("orders.confirmed"))}
                  >
                    {t("orders.confirm")}
                  </Button>
                  <Button
                    variant="danger"
                    className="h-10"
                    onClick={() => changeStatus(order.id, "returned", t("orders.returned"))}
                  >
                    {t("orders.return")}
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
