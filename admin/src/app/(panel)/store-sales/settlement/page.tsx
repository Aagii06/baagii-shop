"use client";

import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import StoreLogo from "@/components/common/StoreLogo";
import OrderBlock from "@/components/stores/OrderBlock";
import DetailHeader from "@/components/layout/DetailHeader";
import { Card } from "@/components/ui/card";
import { getStoreAccount, readPeriod } from "@/lib/api/storeReport";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useApi } from "@/lib/useApi";
import { formatMNT, formatWhen } from "@/lib/utils";
import { SearchX } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

/**
 * `/store-sales/settlement?store=5&id=12` — one past payout to a seller store:
 * when, how much, the note, and every order (with its items) it covered.
 * Read from the store's account (`/storeReport/:storeId`), which already
 * carries each payout's orders.
 */
function SettlementPage() {
  const { t } = useLanguage();
  const params = useSearchParams();
  const storeId = Number(params.get("store"));
  const id = Number(params.get("id"));
  const backHref = `/store-sales/detail?id=${storeId}&period=${readPeriod(params.get("period"))}`;
  const { data, error, loading, reload } = useApi(() => getStoreAccount(storeId), String(storeId));
  const settlement = data?.settlements.find((s) => s.id === id);

  if (!data || !settlement)
    return (
      <>
        <DetailHeader backHref={backHref} title={t("ss.settlementTitle")} />
        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : loading ? (
          <LoadingState variant="detail" />
        ) : (
          <EmptyState icon={SearchX} title={t("ss.settlementNotFound")} />
        )}
      </>
    );

  const orders = settlement.orderList ?? [];

  return (
    <>
      <DetailHeader
        backHref={backHref}
        title={t("ss.settlementTitle")}
        subtitle={
          <span className="flex min-w-0 items-center gap-1.5">
            <StoreLogo id={data.logo} name={data.storeName} size={18} className="rounded" />
            <span className="truncate">{data.storeName}</span>
          </span>
        }
      />

      <Card className="p-4">
        <dl className="space-y-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">{t("ss.paidAt")}</dt>
            <dd className="font-semibold">{formatWhen(settlement.createdAt)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">{t("ss.ordersLabel")}</dt>
            <dd className="font-semibold">{t("ss.historyLine", { orders: settlement.orders, qty: settlement.qty })}</dd>
          </div>
          {settlement.note && (
            <div className="flex items-start justify-between gap-3">
              <dt className="shrink-0 text-muted-foreground">{t("ss.noteLabel")}</dt>
              <dd className="text-right font-semibold break-words">{settlement.note}</dd>
            </div>
          )}
          <div className="flex items-center justify-between gap-3 border-t border-border pt-2">
            <dt className="font-bold">{t("ss.paidAmount")}</dt>
            <dd className="font-mono text-xl font-extrabold text-primary-ink">{formatMNT(settlement.amount)}</dd>
          </div>
        </dl>
      </Card>

      <h2 className="mt-6 text-base font-bold">{t("ss.ordersLabel")}</h2>
      <ul className="-mx-4 mt-2 divide-y divide-border border-y border-border bg-white">
        {orders.map((order) => (
          <li key={order.id}>
            <OrderBlock order={order} />
          </li>
        ))}
        <li className="flex items-center justify-between px-4 py-3 text-sm font-bold">
          <span>{t("ss.itemsTotal")}</span>
          <span className="font-mono">{formatMNT(settlement.amount)}</span>
        </li>
      </ul>
    </>
  );
}

export default function SettlementRoute() {
  return (
    <Suspense fallback={<LoadingState variant="detail" />}>
      <SettlementPage />
    </Suspense>
  );
}
