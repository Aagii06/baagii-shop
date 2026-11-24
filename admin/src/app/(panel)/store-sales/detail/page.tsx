"use client";

import ChipTabs from "@/components/common/ChipTabs";
import { useConfirm } from "@/components/common/Confirm";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import Thumb from "@/components/common/Thumb";
import { useToast } from "@/components/common/Toast";
import DetailHeader from "@/components/layout/DetailHeader";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getStoreSalesDetail, PERIOD_KEYS, periodLabelKey, periodOf, readPeriod, settleStore } from "@/lib/api/storeReport";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useApi } from "@/lib/useApi";
import { cn, formatMNT, formatWhen } from "@/lib/utils";
import { HandCoins, Package, ReceiptText, SearchX } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

/**
 * `/store-sales/detail?id=5&period=month` — one seller store: its sales for the
 * period, its order lines (only its own products), the all-time amount still
 * owed and every payment made to it. "Settle" records a payment.
 */
function StoreSalesDetail() {
  const { t } = useLanguage();
  const router = useRouter();
  const params = useSearchParams();
  const id = Number(params.get("id"));
  const period = readPeriod(params.get("period"));
  const { data, error, loading, reload } = useApi(() => getStoreSalesDetail(id, periodOf(period)), `${id}|${period}`);
  const { run } = useToast();
  const confirm = useConfirm();
  const [settling, setSettling] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  // The period's sales rolled up per product, or order by order.
  const [view, setView] = useState<"items" | "orders">("items");

  const backHref = `/store-sales?period=${period}`;
  if (!data)
    return (
      <>
        <DetailHeader backHref={backHref} title={t("ss.title")} />
        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : loading ? (
          <LoadingState variant="detail" />
        ) : (
          <EmptyState icon={SearchX} title={t("st.notFound")} />
        )}
      </>
    );

  const value = Number(amount.replace(/[^\d.]/g, ""));
  const valid = value > 0 && value <= data.balance;

  async function onSettle() {
    if (!data || !valid) return;
    const ok = await confirm({
      title: t("ss.settleTitle"),
      description: t("ss.settleDesc", { amount: formatMNT(value), store: data.storeName }),
      confirmLabel: t("ss.settle"),
    });
    if (!ok) return;
    setSaving(true);
    try {
      if (await run(() => settleStore(data.storeId, value, note), t("ss.settled"))) {
        setSettling(false);
        setAmount("");
        setNote("");
        reload();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <DetailHeader
        backHref={backHref}
        title={
          <span className="flex min-w-0 items-center gap-2">
            <Thumb id={data.logo} variant="icon" size={28} className="shrink-0 rounded-lg" />
            <span className="truncate">{data.storeName}</span>
          </span>
        }
        subtitle={t("ss.title")}
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
        {!settling ? (
          <Button
            className="mt-4 w-full"
            disabled={data.balance <= 0}
            onClick={() => {
              setAmount(String(Math.round(data.balance)));
              setSettling(true);
            }}
          >
            <HandCoins />
            {t("ss.settle")}
          </Button>
        ) : (
          <div className="mt-4 space-y-3">
            <Input
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
              aria-label={t("ss.amount")}
              placeholder={t("ss.amount")}
              className="font-mono"
            />
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("ss.note")} aria-label={t("ss.note")} maxLength={500} />
            {amount && !valid && <p className="text-xs text-destructive">{t("ss.amountInvalid", { max: formatMNT(data.balance) })}</p>}
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => setSettling(false)} disabled={saving}>
                {t("common.cancel")}
              </Button>
              <Button onClick={onSettle} loading={saving} disabled={!valid}>
                {t("ss.settle")}
              </Button>
            </div>
          </div>
        )}
      </Card>

      <div className="mt-5">
        <ChipTabs
          label={t("ss.period")}
          value={period}
          onChange={(next) => router.replace(`/store-sales/detail?id=${id}&period=${next}`)}
          options={PERIOD_KEYS.map((key) => ({ value: key, label: t(periodLabelKey[key]) }))}
        />
      </div>

      <Card className="mt-3 grid grid-cols-3 divide-x divide-border p-0">
        {[
          { label: t("ss.orders"), value: String(data.orders) },
          { label: t("ss.delivered"), value: formatMNT(data.delivered) },
          { label: t("ss.pending"), value: formatMNT(data.pending) },
        ].map((s) => (
          <div key={s.label} className="flex min-w-0 flex-col items-center px-2 py-3 text-center">
            <span className="truncate font-mono text-[15px] font-bold">{s.value}</span>
            <span className="mt-0.5 text-xs text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </Card>

      <div className="mt-6 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold">{view === "items" ? t("ss.itemList") : t("ss.orderList")}</h2>
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
      </div>
      {view === "items" ? (
        data.items.length === 0 ? (
          <div className="pt-2">
            <EmptyState icon={Package} title={t("ss.noOrders")} />
          </div>
        ) : (
          <ul className="-mx-4 mt-2 divide-y divide-border border-y border-border bg-white">
            {data.items.map((item) => (
              <li key={`${item.variantId}|${item.name}`} className="flex items-center gap-3 px-4 py-3">
                <Thumb id={item.image} variant="icon" size={44} className="shrink-0 rounded-xl" />
                <span className="min-w-0 grow">
                  <span className="block truncate text-[15px] font-semibold">{item.name}</span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {t("ss.itemLine", { orders: item.orders, delivered: item.deliveredQty })}
                    {item.returnedQty > 0 && ` · ${t("ss.itemReturned", { qty: item.returnedQty })}`}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-mono text-sm font-bold">{t("ss.pcs", { qty: item.qty })}</span>
                  <span className="block font-mono text-xs text-muted-foreground">{formatMNT(item.amount)}</span>
                </span>
              </li>
            ))}
            <li className="flex items-center justify-between px-4 py-3 text-sm font-bold">
              <span>{t("ss.itemsTotal")}</span>
              <span className="font-mono">
                {t("ss.pcs", { qty: data.items.reduce((s, i) => s + i.qty, 0) })} ·{" "}
                {formatMNT(data.items.reduce((s, i) => s + i.amount, 0))}
              </span>
            </li>
          </ul>
        )
      ) : data.orders.length === 0 ? (
        <div className="pt-2">
          <EmptyState icon={ReceiptText} title={t("ss.noOrders")} />
        </div>
      ) : (
        <ul className="-mx-4 mt-2 divide-y divide-border border-y border-border bg-white">
          {data.orders.map((order) => (
            <li key={order.id}>
              <Link href={`/orders/${order.id}`} className="block px-4 py-3.5 transition-colors hover:bg-muted/60">
                <span className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold">{order.orderNumber}</span>
                  <OrderStatusBadge status={order.status} />
                  <span className="ml-auto font-mono text-sm font-bold">{formatMNT(order.amount)}</span>
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{formatWhen(order.createdAt)}</span>
                <ul className="mt-2 space-y-1">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex items-center gap-2 text-sm">
                      <Thumb id={item.image} variant="icon" size={28} className="shrink-0 rounded-lg" />
                      <span className={cn("min-w-0 grow truncate", item.returnedQty >= item.qty && "text-muted-foreground line-through")}>
                        {item.name}
                      </span>
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">
                        {item.qty} × {formatMNT(item.price)}
                        {item.returnedQty > 0 && ` (−${item.returnedQty})`}
                      </span>
                    </li>
                  ))}
                </ul>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-6 text-base font-bold">{t("ss.history")}</h2>
      {data.settlements.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">{t("ss.noHistory")}</p>
      ) : (
        <ul className="-mx-4 mt-2 divide-y divide-border border-y border-border bg-white">
          {data.settlements.map((s) => (
            <li key={s.id} className="flex items-center gap-3 px-4 py-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-tint-mint text-tint-mint-ink">
                <HandCoins className="size-5" />
              </span>
              <span className="min-w-0 grow">
                <span className="block text-sm font-semibold">{formatWhen(s.createdAt)}</span>
                {s.note && <span className="block truncate text-xs text-muted-foreground">{s.note}</span>}
              </span>
              <span className="shrink-0 font-mono text-sm font-bold">{formatMNT(s.amount)}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function StoreSalesDetailPage() {
  return (
    <Suspense fallback={<LoadingState variant="detail" />}>
      <StoreSalesDetail />
    </Suspense>
  );
}
