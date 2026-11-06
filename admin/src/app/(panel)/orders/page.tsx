"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useConfirm } from "@/components/common/Confirm";
import ChipTabs from "@/components/common/ChipTabs";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { useToast } from "@/components/common/Toast";
import PageHeader from "@/components/layout/PageHeader";
import OrderListSkeleton from "@/components/orders/OrderListSkeleton";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import OverdueNotice from "@/components/orders/OverdueNotice";
import { ORDER_TONE } from "@/components/orders/orderTone";
import { Button } from "@/components/ui/button";
import {
  canReturnOrder,
  getOrdersPage,
  ORDER_STATUS_LABEL,
  orderTotal,
  setOrderStatus,
  type Order,
  type OrderStatus,
} from "@/lib/api/orders";
import { cn, formatMNT, formatPhone, formatWhen } from "@/lib/utils";
import { Loader2, Phone, Plus, ReceiptText, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";

const TABS: OrderStatus[] = ["pending", "confirmed", "delivered", "returned", "cancelled"];
const PAGE_SIZE = 20;

type Page = { key: string; rows: Order[]; count: number; pending: number; error?: Error };

export default function OrdersPage() {
  // useSearchParams needs a Suspense boundary for the static export.
  return (
    <Suspense fallback={<LoadingState />}>
      <OrdersList />
    </Suspense>
  );
}

function OrdersList() {
  const { t } = useLanguage();
  const router = useRouter();
  // ?phone= — opened from a customer's "Захиалга харах" (Худалдан авагчид).
  const phone = (useSearchParams().get("phone") ?? "").replace(/\D/g, "");
  const { run } = useToast();
  const confirm = useConfirm();
  const [status, setStatus] = useState<OrderStatus | "all">("all");

  // Pages load as the list is scrolled, pending orders first (the backend
  // sorts them). `key` ties the loaded rows to the tab they were fetched
  // for, so a stale page is treated as "loading" until the new one lands.
  const key = `${status}|${phone}`;
  const filter = status === "all" ? undefined : status;
  const [page, setPage] = useState<Page | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreFailed, setMoreFailed] = useState(false);
  const [version, setVersion] = useState(0);
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    getOrdersPage({ skip: 0, take: PAGE_SIZE, status: filter, phone: phone || undefined }).then(
      (result) => {
        if (cancelled) return;
        setMoreFailed(false);
        setPage({ key, ...result });
      },
      (error: unknown) => {
        if (cancelled) return;
        setPage({
          key,
          rows: [],
          count: 0,
          pending: 0,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }
    );
    return () => {
      cancelled = true;
    };
  }, [key, version, filter, phone]);

  const ready = page?.key === key;
  const rows = ready ? page.rows : [];
  const hasMore = ready && !page.error && page.rows.length < page.count;
  const reload = () => setVersion((v) => v + 1);

  const loadMore = useCallback(async () => {
    if (!page || page.key !== key || loadingMore || page.rows.length >= page.count) return;
    setLoadingMore(true);
    setMoreFailed(false);
    try {
      const result = await getOrdersPage({
        skip: page.rows.length,
        take: PAGE_SIZE,
        status: filter,
        phone: phone || undefined,
      });
      setPage((prev) =>
        prev && prev.key === key
          ? {
              ...prev,
              count: result.count,
              pending: result.pending,
              rows: [...prev.rows, ...result.rows.filter((r) => !prev.rows.some((o) => o.id === r.id))],
            }
          : prev
      );
    } catch {
      setMoreFailed(true);
    } finally {
      setLoadingMore(false);
    }
  }, [page, key, loadingMore, filter, phone]);

  // Loads the next page once the bottom of the list nears the screen. A
  // failed page stops the loop; "try again" retries it.
  useEffect(() => {
    const node = sentinel.current;
    if (!node || !hasMore || moreFailed) return;
    const observer = new IntersectionObserver((entries) => entries[0]?.isIntersecting && loadMore(), {
      rootMargin: "600px 0px",
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, moreFailed, loadMore]);

  async function changeStatus(id: number, to: OrderStatus, success: string) {
    if (await run(() => setOrderStatus(id, to), success)) reload();
  }

  async function returnOrder(order: Order) {
    const ok = await confirm({
      title: t("orders.returnTitle", { id: order.id }),
      description: order.paidAt ? t("orders.returnPaidDesc") : t("orders.returnDesc"),
      confirmLabel: t("orders.return"),
      tone: "danger",
    });
    if (ok) changeStatus(order.id, "returned", t("orders.returned"));
  }

  return (
    <>
      <PageHeader
        title={t("orders.title")}
        aside={
          <div className="flex items-center gap-3">
            {ready && !page.error && (
              <span className="shrink-0 font-mono text-sm text-muted-foreground">
                {t("orders.count", { count: page.count })}
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
          options={[
            { value: "all" as const, label: t("common.all") },
            ...TABS.map((s) => ({
              value: s,
              label: ORDER_STATUS_LABEL[s],
              count: s === "pending" ? page?.pending : undefined,
              idleClassName: ORDER_TONE[s].soft,
              activeClassName: ORDER_TONE[s].solid,
              badgeClassName: "bg-warning text-white",
            })),
          ]}
        />
        {phone && (
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-secondary py-1 pl-3 pr-1 text-sm font-semibold text-secondary-foreground">
              <Phone className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate font-mono">{formatPhone(phone)}</span>
              <button
                type="button"
                onClick={() => router.replace("/orders")}
                aria-label={t("orders.phoneClear")}
                title={t("orders.phoneClear")}
                className="grid size-6 shrink-0 place-items-center rounded-full hover:bg-foreground/10"
              >
                <X className="size-3.5" />
              </button>
            </span>
          </div>
        )}
      </PageHeader>

      {!ready ? (
        <OrderListSkeleton />
      ) : page.error ? (
        <div className="pt-4">
          <ErrorState error={page.error} onRetry={reload} />
        </div>
      ) : rows.length === 0 ? (
        <div className="pt-4">
          <EmptyState
            icon={ReceiptText}
            title={
              phone
                ? t("orders.noneForPhone", { phone: formatPhone(phone) })
                : status === "all"
                ? t("orders.empty")
                : t("orders.noneInStatus", { status: ORDER_STATUS_LABEL[status] })
            }
          />
        </div>
      ) : (
        <>
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

                <OverdueNotice order={order} onCancelled={reload} className="mt-3" />

                {canReturnOrder(order) && (
                  <div className={cn("mt-3 grid gap-3", order.status !== "delivered" && "grid-cols-2")}>
                    {order.status === "pending" && (
                      <Button
                        variant="ghost"
                        className={cn("h-10", ORDER_TONE.confirmed.solid)}
                        onClick={() => changeStatus(order.id, "confirmed", t("orders.confirmed"))}
                      >
                        {t("orders.confirm")}
                      </Button>
                    )}
                    {order.status === "confirmed" && (
                      <Button
                        variant="ghost"
                        className={cn("h-10", ORDER_TONE.delivered.solid)}
                        onClick={() => changeStatus(order.id, "delivered", t("orders.statusUpdated"))}
                      >
                        {t("orders.deliver")}
                      </Button>
                    )}
                    <Button variant="danger" className="h-10" onClick={() => returnOrder(order)}>
                      {t("orders.return")}
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>

          {hasMore && (
            <div ref={sentinel}>
              {moreFailed ? (
                <Button variant="outline" className="mt-4 w-full" onClick={loadMore}>
                  {t("common.retry")}
                </Button>
              ) : (
                <div className="flex justify-center py-6" aria-label={t("common.loading")}>
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}
