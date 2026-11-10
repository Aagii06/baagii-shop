"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import ChipTabs from "@/components/common/ChipTabs";
import { ErrorState } from "@/components/common/States";
import {
  ListCardSkeleton,
  ListRowsSkeleton,
  SalesSectionSkeleton,
} from "@/components/dashboard/DashboardSkeleton";
import PageHeader from "@/components/layout/PageHeader";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import { Card } from "@/components/ui/card";
import {
  getOrders,
  getSalesSummary,
  orderTotal,
  type Order,
  type SalesRange,
  type SalesSummary,
} from "@/lib/api/orders";
import { getPosts, isPublished, LOW_STOCK_THRESHOLD } from "@/lib/api/posts";
import { useApi } from "@/lib/useApi";
import {
  cn,
  formatMNT,
  formatMNTCompact,
  formatQty,
  formatWhen,
  toNumber,
} from "@/lib/utils";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  Receipt,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

const RANGES: { value: SalesRange; labelKey: string }[] = [
  { value: "today", labelKey: "dash.range.today" },
  { value: "yesterday", labelKey: "dash.range.yesterday" },
  { value: "week", labelKey: "dash.range.week" },
  { value: "month", labelKey: "dash.range.month" },
];

function CardTitleRow({ title, aside }: { title: string; aside?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3.5">
      <h2 className="text-[15px] font-bold">{title}</h2>
      {aside}
    </div>
  );
}

type Tone = "brand" | "blue" | "mint" | "peach";

const TONES: Record<Tone, { card: string; icon: string; label: string; blob: string }> = {
  // Brand gradient: the headline number (revenue).
  brand: {
    card: "brand-gradient text-white border-transparent",
    icon: "bg-white/20 text-white",
    label: "text-white/80",
    blob: "bg-white/15",
  },
  blue: {
    card: "bg-tint-blue border-tint-blue-ink/15 text-tint-blue-ink",
    icon: "bg-white text-tint-blue-ink",
    label: "text-tint-blue-ink/80",
    blob: "bg-tint-blue-ink/10",
  },
  mint: {
    card: "bg-tint-mint border-tint-mint-ink/15 text-tint-mint-ink",
    icon: "bg-white text-tint-mint-ink",
    label: "text-tint-mint-ink/80",
    blob: "bg-tint-mint-ink/10",
  },
  peach: {
    card: "bg-tint-peach border-tint-peach-ink/20 text-tint-peach-ink",
    icon: "bg-white text-tint-peach-ink",
    label: "text-tint-peach-ink/85",
    blob: "bg-tint-peach-ink/10",
  },
};

function StatTile({
  label,
  value,
  icon: Icon,
  tone,
  delta,
  footer,
  href,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone: Tone;
  delta?: SalesSummary["ordersDelta"];
  footer?: React.ReactNode;
  href?: string;
}) {
  const c = TONES[tone];
  const body = (
    <>
      <span aria-hidden className={cn("pointer-events-none absolute -right-6 -top-6 size-24 rounded-full", c.blob)} />
      <span aria-hidden className={cn("pointer-events-none absolute -bottom-8 right-6 size-14 rounded-full", c.blob)} />
      <div className="relative flex items-start justify-between gap-2">
        <p className={cn("text-sm font-medium", c.label)}>{label}</p>
        <span className={cn("grid size-8 shrink-0 place-items-center rounded-xl shadow-sm", c.icon)}>
          <Icon className="size-4" strokeWidth={2.25} />
        </span>
      </div>
      <p className="relative mt-3 truncate font-mono text-2xl font-bold leading-none tracking-tight">{value}</p>
      {delta && (
        <span
          className={cn(
            "relative mt-3 inline-flex max-w-full items-center gap-1 truncate rounded-full px-2 py-0.5 text-[11px] font-semibold",
            tone === "brand"
              ? "bg-white/20 text-white"
              : delta.positive
                ? "bg-white/70 text-success"
                : "bg-white/70 text-destructive"
          )}
        >
          {delta.positive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
          {delta.text}
        </span>
      )}
      {footer && <div className="relative mt-3 text-xs font-semibold">{footer}</div>}
    </>
  );
  const cls = cn(
    "relative block overflow-hidden rounded-2xl border p-4 shadow-[var(--shadow-card)]",
    c.card,
    href && "transition-transform hover:-translate-y-0.5 active:translate-y-0"
  );
  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

function SalesChart({ summary }: { summary: SalesSummary }) {
  const { t } = useLanguage();
  const { series } = summary;
  const max = Math.max(1, ...series.map((point) => point.value));
  const gap = series.length > 14 ? "gap-[3px]" : "gap-1.5";

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-bold">{t("dash.salesTrend")}</h2>
        <span className="font-mono text-xs text-muted-foreground">{summary.seriesUnit}</span>
      </div>
      <div
        role="img"
        aria-label={t("dash.salesTrendAria", { unit: summary.seriesUnit, max: formatMNT(max) })}
        className="mt-5"
      >
        <div className={cn("flex h-28 items-end", gap)}>
          {series.map((point, i) => (
            <div
              key={point.label}
              title={`${point.label}: ${formatMNT(point.value)}`}
              // The last bucket is the current hour / day.
              className={cn(
                "flex-1 rounded-t-[3px]",
                i === series.length - 1 ? "bg-primary" : "bg-primary/25"
              )}
              style={{ height: `${Math.max(4, (point.value / max) * 100)}%` }}
            />
          ))}
        </div>
        <div className={cn("mt-2 flex font-mono text-[11px] text-muted-foreground", gap)}>
          {series.map((point) => (
            <span key={point.label} className="min-w-0 flex-1 overflow-visible whitespace-nowrap">
              {point.tick}
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}

function SalesSection({ range, pending }: { range: SalesRange; pending?: number }) {
  const { t } = useLanguage();
  const sales = useApi(() => getSalesSummary(range), range);

  if (sales.error && !sales.data) return <ErrorState error={sales.error} onRetry={sales.reload} />;
  if (!sales.data) return <SalesSectionSkeleton />;

  const { data: summary } = sales;

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <StatTile
          tone="blue"
          icon={ShoppingBag}
          label={t("dash.orders")}
          value={formatQty(summary.orders)}
          delta={summary.ordersDelta}
        />
        <StatTile
          tone="brand"
          icon={Wallet}
          label={t("dash.revenue")}
          value={formatMNTCompact(summary.revenue)}
          delta={summary.revenueDelta}
        />
        <StatTile
          tone="mint"
          icon={Receipt}
          label={t("dash.avg")}
          value={formatMNTCompact(summary.orders ? summary.revenue / summary.orders : 0)}
        />
        <StatTile
          tone="peach"
          icon={Clock}
          href="/orders"
          label={t("dash.pending")}
          value={pending == null ? "—" : String(pending)}
          footer={
            <span className="inline-flex items-center gap-1">
              {t("dash.view")} <ArrowRight className="size-3.5" />
            </span>
          }
        />
      </div>

      <SalesChart summary={summary} />
    </>
  );
}

function RecentOrdersCard({ orders }: { orders: Order[] }) {
  const { t } = useLanguage();
  return (
    <Card className="overflow-hidden">
      <CardTitleRow
        title={t("dash.recentOrders")}
        aside={
          <Link href="/orders" className="text-sm font-semibold text-primary-ink hover:underline">
            {t("dash.seeAll")}
          </Link>
        }
      />
      <ul className="divide-y divide-border">
        {orders.slice(0, 4).map((order) => (
          <li key={order.id}>
            <Link
              href={`/orders/${order.id}`}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/60"
            >
              <span className="min-w-0 grow">
                <span className="block truncate text-[15px] font-semibold">
                  {order.customer.name}
                </span>
                <span className="block font-mono text-xs text-muted-foreground">
                  #{order.id} · {formatWhen(order.createdAt)}
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block font-mono text-sm font-bold">
                  {formatMNT(orderTotal(order))}
                </span>
                <OrderStatusBadge status={order.status} className="mt-1" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function LowStockCard() {
  const { t } = useLanguage();
  const { data, error, reload } = useApi(getPosts);

  const lowStock = (data ?? [])
    .filter((post) => isPublished(post) && toNumber(post.remain) <= LOW_STOCK_THRESHOLD)
    .sort((a, b) => toNumber(a.remain) - toNumber(b.remain))
    .slice(0, 5);

  return (
    <Card className="overflow-hidden">
      <CardTitleRow title={t("dash.lowStock")} />
      {error && !data ? (
        <div className="p-4">
          <ErrorState error={error} onRetry={reload} />
        </div>
      ) : !data ? (
        <ListRowsSkeleton rows={5} />
      ) : lowStock.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground">
          {t("dash.stockOk")}
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {lowStock.map((post) => {
            const remain = toNumber(post.remain);
            return (
              <li key={post.id}>
                <Link
                  href={`/products/${post.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-muted/60"
                >
                  <span className="min-w-0 truncate text-[15px]">
                    {post.name}
                  </span>
                  <span className="shrink-0 rounded-lg bg-destructive/10 px-2.5 py-1 font-mono text-xs font-bold text-destructive">
                    {remain <= 0 ? t("dash.soldOut") : t("dash.left", { qty: formatQty(remain) })}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

export default function DashboardPage() {
  const { t } = useLanguage();
  const [range, setRange] = useState<SalesRange>("today");
  // One fetch feeds both the "awaiting confirmation" tile and the recent list.
  const { data: orders, error: ordersError } = useApi(getOrders);

  return (
    <>
      <PageHeader
        title={t("dash.title")}
        hideTitle
      >
        <ChipTabs label={t("dash.range.label")} value={range} options={RANGES.map((r) => ({ value: r.value, label: t(r.labelKey) }))} onChange={setRange} />
      </PageHeader>

      <div className="space-y-3 pt-4">
        <SalesSection
          range={range}
          pending={orders?.filter((order) => order.status === "pending").length}
        />
        <LowStockCard />
        {!orders && !ordersError && <ListCardSkeleton twoLine />}
        {orders && orders.length > 0 && <RecentOrdersCard orders={orders} />}
      </div>
    </>
  );
}
