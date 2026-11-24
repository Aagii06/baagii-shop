"use client";

import ChipTabs from "@/components/common/ChipTabs";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import Thumb from "@/components/common/Thumb";
import DetailHeader from "@/components/layout/DetailHeader";
import { Card } from "@/components/ui/card";
import { getStoreSales, PERIOD_KEYS, periodLabelKey, periodOf, readPeriod } from "@/lib/api/storeReport";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useApi } from "@/lib/useApi";
import { cn, formatMNT } from "@/lib/utils";
import { ChevronRight, Store } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

/**
 * Each seller store's sales for the chosen period, and what the shop still
 * owes it (all-time). A row opens the store's orders and its settlements.
 */
function StoreSalesList() {
  const { t } = useLanguage();
  const router = useRouter();
  const period = readPeriod(useSearchParams().get("period"));
  const { data, error, loading, reload } = useApi(() => getStoreSales(periodOf(period)), period);

  return (
    <>
      <DetailHeader backHref="/profile" title={t("ss.title")} subtitle={t("ss.subtitle")} />

      <ChipTabs
        label={t("ss.period")}
        value={period}
        onChange={(next) => router.replace(`/store-sales?period=${next}`)}
        options={PERIOD_KEYS.map((key) => ({ value: key, label: t(periodLabelKey[key]) }))}
      />

      {error ? (
        <div className="pt-4">
          <ErrorState error={error} onRetry={reload} />
        </div>
      ) : loading || !data ? (
        <LoadingState className="pt-4" />
      ) : data.rows.length === 0 ? (
        <div className="pt-4">
          <EmptyState icon={Store} title={t("ss.empty")} />
        </div>
      ) : (
        <>
          <Card className="mt-4 grid grid-cols-3 divide-x divide-border p-0">
            {[
              { label: t("ss.delivered"), value: data.total.delivered, tone: "text-foreground" },
              { label: t("ss.pending"), value: data.total.pending, tone: "text-muted-foreground" },
              { label: t("ss.balance"), value: data.total.balance, tone: "text-primary-ink" },
            ].map((s) => (
              <div key={s.label} className="flex min-w-0 flex-col items-center px-2 py-3 text-center">
                <span className={cn("truncate font-mono text-[15px] font-bold", s.tone)}>{formatMNT(s.value)}</span>
                <span className="mt-0.5 text-xs text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </Card>

          <ul className="-mx-4 mt-4 divide-y divide-border border-y border-border bg-white">
            {data.rows.map((row) => (
              <li key={row.storeId}>
                <Link
                  href={`/store-sales/detail?id=${row.storeId}&period=${period}`}
                  className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/60"
                >
                  <Thumb id={row.logo} variant="icon" size={44} className="rounded-xl" />
                  <span className="min-w-0 grow">
                    <span className="block truncate text-[15px] font-semibold">{row.storeName}</span>
                    <span className="mt-0.5 block truncate font-mono text-xs text-muted-foreground">
                      {t("ss.rowLine", { orders: row.orders, delivered: formatMNT(row.delivered) })}
                      {row.pending > 0 && ` · ${t("ss.rowPending", { amount: formatMNT(row.pending) })}`}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className={cn("block font-mono text-sm font-bold", row.balance > 0 ? "text-primary-ink" : "text-muted-foreground")}>
                      {formatMNT(row.balance)}
                    </span>
                    <span className="block text-[11px] text-muted-foreground">{t("ss.balance")}</span>
                  </span>
                  <ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

export default function StoreSalesPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <StoreSalesList />
    </Suspense>
  );
}
