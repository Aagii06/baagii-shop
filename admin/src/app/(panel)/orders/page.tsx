"use client";

import ChipTabs from "@/components/common/ChipTabs";
import SampleNotice from "@/components/common/SampleNotice";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { useToast } from "@/components/common/Toast";
import PageHeader from "@/components/layout/PageHeader";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import { Button } from "@/components/ui/button";
import {
  getOrders,
  ORDER_STATUS_LABEL,
  orderTotal,
  setOrderStatus,
  type OrderStatus,
} from "@/lib/api/orders";
import { useApi } from "@/lib/useApi";
import { formatMNT, formatWhen } from "@/lib/utils";
import { ReceiptText } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const TABS: OrderStatus[] = ["pending", "confirmed", "delivered", "returned"];

export default function OrdersPage() {
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
        title="Захиалга"
        aside={
          data && (
            <span className="shrink-0 font-mono text-sm text-muted-foreground">
              {rows.length} захиалга
            </span>
          )
        }
      >
        <ChipTabs
          label="Төлөв"
          value={status}
          onChange={setStatus}
          options={TABS.map((s) => ({
            value: s,
            label: ORDER_STATUS_LABEL[s],
            count: s === "pending" ? pendingCount : undefined,
          }))}
        />
      </PageHeader>

      <SampleNotice className="mt-4">
        Захиалгын API холбогдоогүй тул жишээ захиалга харуулж байна.
      </SampleNotice>

      {error && !data ? (
        <div className="pt-4">
          <ErrorState error={error} onRetry={reload} />
        </div>
      ) : !data ? (
        <LoadingState />
      ) : rows.length === 0 ? (
        <div className="pt-4">
          <EmptyState icon={ReceiptText} title={`“${ORDER_STATUS_LABEL[status]}” захиалга алга`} />
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
                    {formatWhen(order.createdAt)} · {order.items.length} бараа
                  </span>
                </span>
                <span className="shrink-0 font-mono text-[15px] font-bold">
                  {formatMNT(orderTotal(order))}
                </span>
              </Link>

              {order.status === "pending" && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Button
                    className="h-10"
                    onClick={() => changeStatus(order.id, "confirmed", "Захиалгыг баталлаа")}
                  >
                    Батлах
                  </Button>
                  <Button
                    variant="danger"
                    className="h-10"
                    onClick={() => changeStatus(order.id, "returned", "Захиалгыг буцаалаа")}
                  >
                    Буцаалт
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
