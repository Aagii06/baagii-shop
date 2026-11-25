"use client";

import { useConfirm } from "@/components/common/Confirm";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import StoreLogo from "@/components/common/StoreLogo";
import Thumb from "@/components/common/Thumb";
import { useToast } from "@/components/common/Toast";
import DetailHeader from "@/components/layout/DetailHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getStoreAccount, readPeriod, settleStore, type SettlementOrder, type StoreSettlement, type StoreSoldItem } from "@/lib/api/storeReport";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useApi } from "@/lib/useApi";
import { cn, formatDate, formatMNT, formatWhen } from "@/lib/utils";
import { ChevronDown, CircleCheck, HandCoins, SearchX } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";

/** One product line: image, name, how many orders, units and amount. */
function ItemRow({ item }: { item: StoreSoldItem }) {
  const { t } = useLanguage();
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <Thumb id={item.image} variant="icon" size={44} className="shrink-0 rounded-xl" />
      <span className="min-w-0 grow">
        <span className="block truncate text-[15px] font-semibold">{item.name}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {item.qty < 0 ? t("ss.returnedAfter") : t("ss.inOrders", { orders: item.orders })}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className={cn("block font-mono text-sm font-bold", item.qty < 0 && "text-destructive")}>{t("ss.pcs", { qty: item.qty })}</span>
        <span className={cn("block font-mono text-xs", item.qty < 0 ? "text-destructive" : "text-muted-foreground")}>
          {formatMNT(item.amount)}
        </span>
      </span>
    </li>
  );
}

/** An order with its lines — order number links to the order. */
function OrderBlock({ order, deliveredAt }: { order: SettlementOrder; deliveredAt?: string | null }) {
  const { t } = useLanguage();
  return (
    <Link href={`/orders/${order.id}`} className="block px-4 py-3.5 transition-colors hover:bg-muted/60">
      <span className="flex items-center gap-2">
        <span className="font-mono text-sm font-semibold">{order.orderNumber}</span>
        <span className="ml-auto font-mono text-sm font-bold">{formatMNT(order.amount)}</span>
      </span>
      {deliveredAt && (
        <span className="mt-0.5 block text-xs text-muted-foreground">{t("ss.deliveredAt", { date: formatDate(deliveredAt) })}</span>
      )}
      <ul className="mt-2 space-y-1">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-center gap-2 text-sm">
            <Thumb id={item.image} variant="icon" size={28} className="shrink-0 rounded-lg" />
            <span className="min-w-0 grow truncate">{item.name}</span>
            <span className={cn("shrink-0 font-mono text-xs", item.qty < 0 ? "text-destructive" : "text-muted-foreground")}>
              {item.qty} × {formatMNT(item.price)}
            </span>
          </li>
        ))}
      </ul>
    </Link>
  );
}

/** A past payout; tapping it opens the orders and items it covered. */
function SettlementRow({ s }: { s: StoreSettlement }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const orders = s.orderList ?? [];
  return (
    <li>
      <button
        type="button"
        aria-expanded={open}
        disabled={orders.length === 0}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60 disabled:hover:bg-transparent"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-tint-mint text-tint-mint-ink">
          <HandCoins className="size-5" />
        </span>
        <span className="min-w-0 grow">
          <span className="block text-sm font-semibold">{formatWhen(s.createdAt)}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {t("ss.historyLine", { orders: s.orders, qty: s.qty })}
            {s.note && ` · ${s.note}`}
          </span>
        </span>
        <span className="shrink-0 font-mono text-sm font-bold">{formatMNT(s.amount)}</span>
        {orders.length > 0 && (
          <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
        )}
      </button>
      {open && (
        <ul className="divide-y divide-border border-t border-border bg-muted/30">
          {orders.map((order) => (
            <li key={order.id}>
              <OrderBlock order={order} />
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

/**
 * `/store-sales/detail?id=5` — one seller store's account: what it has sold
 * and been paid all time, the delivered items not paid yet (by item or by
 * order) with the button that pays them all, items still on their way, and
 * past payouts. Payouts happen once a week.
 */
function StoreAccountPage() {
  const { t } = useLanguage();
  const params = useSearchParams();
  const id = Number(params.get("id"));
  // A shopper only has their own store (the list redirects here), so "back" goes to their products.
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const backHref = isAdmin ? `/store-sales?period=${readPeriod(params.get("period"))}` : "/products";
  const { data, error, loading, reload } = useApi(() => getStoreAccount(id), String(id));
  const { run } = useToast();
  const confirm = useConfirm();
  const [view, setView] = useState<"items" | "orders">("items");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  if (!data)
    return (
      <>
        <DetailHeader backHref={backHref} title={t("nav.settlements")} />
        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : loading ? (
          <LoadingState variant="detail" />
        ) : (
          <EmptyState icon={SearchX} title={t("st.notFound")} />
        )}
      </>
    );

  async function onSettle() {
    if (!data || data.balance <= 0) return;
    const ok = await confirm({
      title: t("ss.settleTitle"),
      description: t("ss.settleDesc", { amount: formatMNT(data.balance), store: data.storeName }),
      confirmLabel: t("ss.settle"),
    });
    if (!ok) return;
    setSaving(true);
    try {
      if (await run(() => settleStore(data.storeId, data.balance, note), t("ss.settled"))) {
        setNote("");
      }
      // Also after a refusal (the amount changed): show the fresh account.
      reload();
    } finally {
      setSaving(false);
    }
  }

  const unsettled = data.unsettled;

  return (
    <>
      <DetailHeader
        backHref={backHref}
        title={
          <span className="flex min-w-0 items-center gap-2">
            <StoreLogo id={data.logo} name={data.storeName} size={28} className="rounded-lg" />
            <span className="truncate">{data.storeName}</span>
          </span>
        }
        subtitle={t("nav.settlements")}
      />

      {/* All-time account with this store: delivered sales − paid = still owed. */}
      <Card className="p-4">
        <h2 className="text-sm font-bold">{t("ss.account")}</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">{t("ss.totalDelivered")}</dt>
            <dd className="font-mono font-semibold">{formatMNT(data.allTime.delivered)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">{t("ss.totalPaid")}</dt>
            <dd className="font-mono font-semibold">− {formatMNT(data.settled)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-border pt-2">
            <dt className="font-bold">{t("ss.balance")}</dt>
            <dd className={cn("font-mono text-xl font-extrabold", data.balance > 0 ? "text-primary-ink" : "text-foreground")}>
              {formatMNT(data.balance)}
            </dd>
          </div>
          {data.allTime.pending > 0 && (
            <div className="flex items-center justify-between gap-3 text-xs">
              <dt className="text-muted-foreground">{t("ss.totalPending")}</dt>
              <dd className="font-mono text-muted-foreground">{formatMNT(data.allTime.pending)}</dd>
            </div>
          )}
        </dl>
      </Card>

      {/* What the next payout covers. */}
      <div className="mt-6 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold">{t("ss.unsettledTitle")}</h2>
        {unsettled.items.length > 0 && (
          <div role="group" aria-label={t("ss.view")} className="flex rounded-full bg-muted p-1 text-sm font-semibold">
            {(["items", "orders"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => setView(v)}
                className={cn("rounded-full px-3 py-1.5", view === v ? "bg-white shadow-sm" : "text-muted-foreground")}
              >
                {v === "items" ? t("ss.byItem") : t("ss.byOrder")}
              </button>
            ))}
          </div>
        )}
      </div>

      {unsettled.items.length === 0 ? (
        <div className="pt-2">
          <EmptyState icon={CircleCheck} title={t("ss.allSettled")} description={t("ss.allSettledHint")} />
        </div>
      ) : (
        <>
          <ul className="-mx-4 mt-2 divide-y divide-border border-y border-border bg-white">
            {view === "items"
              ? unsettled.items.map((item) => <ItemRow key={`${item.variantId}|${item.name}`} item={item} />)
              : unsettled.orders.map((order) => (
                  <li key={order.id}>
                    <OrderBlock order={order} deliveredAt={order.deliveredAt} />
                  </li>
                ))}
            <li className="flex items-center justify-between px-4 py-3 text-sm font-bold">
              <span>{t("ss.itemsTotal")}</span>
              <span className="font-mono">{formatMNT(data.balance)}</span>
            </li>
          </ul>

          {/* Paying out is the admin's; a shopper only sees what they are owed. */}
          {isAdmin && data.balance > 0 && (
            <div className="mt-4 space-y-3">
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("ss.note")} aria-label={t("ss.note")} maxLength={500} />
              <Button size="lg" className="w-full" loading={saving} onClick={onSettle}>
                <HandCoins />
                {t("ss.settleAmount", { amount: formatMNT(data.balance) })}
              </Button>
            </div>
          )}
        </>
      )}

      {data.pendingItems.length > 0 && (
        <>
          <h2 className="mt-6 text-base font-bold">{t("ss.pendingTitle")}</h2>
          <p className="text-xs text-muted-foreground">{t("ss.pendingHint")}</p>
          <ul className="-mx-4 mt-2 divide-y divide-border border-y border-border bg-white opacity-80">
            {data.pendingItems.map((item) => (
              <ItemRow key={`${item.variantId}|${item.name}`} item={item} />
            ))}
          </ul>
        </>
      )}

      <h2 className="mt-6 text-base font-bold">{t("ss.history")}</h2>
      {data.settlements.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">{t("ss.noHistory")}</p>
      ) : (
        <ul className="-mx-4 mt-2 divide-y divide-border border-y border-border bg-white">
          {data.settlements.map((s) => (
            <SettlementRow key={s.id} s={s} />
          ))}
        </ul>
      )}
    </>
  );
}

export default function StoreAccountRoute() {
  return (
    <Suspense fallback={<LoadingState variant="detail" />}>
      <StoreAccountPage />
    </Suspense>
  );
}
