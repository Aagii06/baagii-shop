"use client";

import SampleNotice from "@/components/common/SampleNotice";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { useToast } from "@/components/common/Toast";
import DetailHeader from "@/components/layout/DetailHeader";
import OrderItemsCard from "@/components/orders/OrderItemsCard";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  getOrder,
  NEXT_ORDER_ACTION,
  ORDER_STEP_LABEL,
  setOrderStatus,
  type Order,
  type OrderStatus,
} from "@/lib/api/orders";
import { useApi } from "@/lib/useApi";
import { cn, formatDate, formatPhone, formatTime } from "@/lib/utils";
import { ReceiptText } from "lucide-react";
import { useParams } from "next/navigation";

/** The happy path, plus "returned" only for orders that were sent back. */
function timelineSteps(order: Order): OrderStatus[] {
  const steps: OrderStatus[] = ["pending", "confirmed", "delivered"];
  return order.timeline.returned ? [...steps, "returned"] : steps;
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, error, reload } = useApi(() => getOrder(Number(id)), id);
  const { run } = useToast();

  if (!order) {
    return (
      <>
        <DetailHeader backHref="/orders" title={`#${id}`} />
        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : order === undefined ? (
          <LoadingState />
        ) : (
          <EmptyState
            icon={ReceiptText}
            title="Захиалга олдсонгүй"
            description={`#${id} дугаартай захиалга байхгүй байна.`}
          />
        )}
      </>
    );
  }

  const action = NEXT_ORDER_ACTION[order.status];

  return (
    <>
      <DetailHeader
        backHref="/orders"
        title={<span className="font-mono">#{order.id}</span>}
        subtitle={`${formatDate(order.createdAt)} · ${formatTime(order.createdAt)}`}
        aside={<OrderStatusBadge status={order.status} className="px-3 py-1 text-sm" />}
      />

      <div className="space-y-3">
        <SampleNotice>Захиалгын API холбогдоогүй тул жишээ захиалга харуулж байна.</SampleNotice>

        <Card className="p-4">
          <p className="text-[15px] font-bold">{order.customer.name}</p>
          <a
            href={`tel:${order.customer.phone}`}
            className="mt-1 inline-block font-mono text-sm text-muted-foreground hover:text-foreground"
          >
            {formatPhone(order.customer.phone)}
          </a>
          <p className="mt-1.5 text-sm text-foreground/80">{order.customer.address}</p>
        </Card>

        <OrderItemsCard order={order} onChanged={reload} />

        <Card className="p-4">
          <h2 className="text-[15px] font-bold">Төлөв</h2>
          <ol className="mt-3 space-y-3">
            {timelineSteps(order).map((step) => {
              const reachedAt = order.timeline[step];
              return (
                <li key={step} className="flex items-center gap-3 text-[15px]">
                  <span
                    aria-hidden
                    className={cn("size-2.5 shrink-0 rounded-full", reachedAt ? "bg-primary" : "bg-input")}
                  />
                  <span className={cn("grow", !reachedAt && "text-muted-foreground")}>
                    {ORDER_STEP_LABEL[step]}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {reachedAt ? formatTime(reachedAt) : "—"}
                  </span>
                </li>
              );
            })}
          </ol>
        </Card>
      </div>

      {action && (
        <>
          {/* Keeps the last card clear of the fixed action bar. */}
          <div aria-hidden className="h-20" />
          <div className="fixed inset-x-0 bottom-0 z-30">
            <div className="mx-auto max-w-md border-t border-border bg-background/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:border-x">
              <Button
                size="lg"
                className="w-full"
                onClick={async () => {
                  if (await run(() => setOrderStatus(order.id, action.to), "Төлөв шинэчлэгдлээ")) {
                    reload();
                  }
                }}
              >
                {action.label}
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
