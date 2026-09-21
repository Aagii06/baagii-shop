"use client";

import ChipTabs from "@/components/common/ChipTabs";
import SampleNotice from "@/components/common/SampleNotice";
import { ErrorState, LoadingState } from "@/components/common/States";
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
import { getPosts, LOW_STOCK_THRESHOLD } from "@/lib/api/posts";
import { useApi } from "@/lib/useApi";
import {
  cn,
  formatDate,
  formatMNT,
  formatMNTCompact,
  formatQty,
  formatWhen,
  toNumber,
} from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";

const RANGES: { value: SalesRange; label: string }[] = [
  { value: "today", label: "Өнөөдөр" },
  { value: "yesterday", label: "Өчигдөр" },
  { value: "week", label: "7 хоног" },
  { value: "month", label: "30 хоног" },
];

function CardTitleRow({ title, aside }: { title: string; aside?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3.5">
      <h2 className="text-[15px] font-bold">{title}</h2>
      {aside}
    </div>
  );
}

function StatTile({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta?: SalesSummary["ordersDelta"];
}) {
  return (
    <Card className="p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2.5 truncate font-mono text-2xl font-bold leading-none tracking-tight">
        {value}
      </p>
      {delta && (
        <p
          className={cn(
            "mt-2.5 truncate text-xs font-semibold",
            delta.positive ? "text-success" : "text-destructive"
          )}
        >
          {delta.text}
        </p>
      )}
    </Card>
  );
}

function SalesChart({ summary }: { summary: SalesSummary }) {
  const { series } = summary;
  const max = Math.max(1, ...series.map((point) => point.value));
  const gap = series.length > 14 ? "gap-[3px]" : "gap-1.5";

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-bold">Борлуулалтын явц</h2>
        <span className="font-mono text-xs text-muted-foreground">{summary.seriesUnit}</span>
      </div>
      <div
        role="img"
        aria-label={`Борлуулалтын явц ${summary.seriesUnit}, хамгийн их нь ${formatMNT(max)}`}
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
  const sales = useApi(() => getSalesSummary(range), range);

  if (sales.error && !sales.data) return <ErrorState error={sales.error} onRetry={sales.reload} />;
  if (!sales.data) return <LoadingState />;

  const { data: summary } = sales;

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Захиалга" value={formatQty(summary.orders)} delta={summary.ordersDelta} />
        <StatTile
          label="Борлуулалт"
          value={formatMNTCompact(summary.revenue)}
          delta={summary.revenueDelta}
        />
        <StatTile
          label="Дундаж дүн"
          value={formatMNTCompact(summary.orders ? summary.revenue / summary.orders : 0)}
        />
        <Link
          href="/orders"
          className="rounded-2xl border border-primary/25 bg-primary-soft/60 p-4 text-primary-ink transition-colors hover:bg-primary-soft"
        >
          <p className="text-sm">Батлахыг хүлээж</p>
          <p className="mt-2.5 font-mono text-2xl font-bold leading-none">{pending ?? "—"}</p>
          <p className="mt-2.5 text-xs font-semibold">Харах →</p>
        </Link>
      </div>

      <SalesChart summary={summary} />
    </>
  );
}

function RecentOrdersCard({ orders }: { orders: Order[] }) {
  return (
    <Card className="overflow-hidden">
      <CardTitleRow
        title="Сүүлийн захиалга"
        aside={
          <Link href="/orders" className="text-sm font-semibold text-primary-ink hover:underline">
            Бүгд
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
  const { data, error, reload } = useApi(getPosts);

  const lowStock = (data ?? [])
    .filter((post) => post.isActive && toNumber(post.remain) <= LOW_STOCK_THRESHOLD)
    .sort((a, b) => toNumber(a.remain) - toNumber(b.remain))
    .slice(0, 5);

  return (
    <Card className="overflow-hidden">
      <CardTitleRow title="Нөөц дуусч байна" />
      {error && !data ? (
        <div className="p-4">
          <ErrorState error={error} onRetry={reload} />
        </div>
      ) : !data ? (
        <LoadingState className="py-8" />
      ) : lowStock.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground">
          Бүх барааны нөөц хангалттай байна.
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
                    {post.productName || post.name}
                  </span>
                  <span className="shrink-0 rounded-lg bg-destructive/10 px-2.5 py-1 font-mono text-xs font-bold text-destructive">
                    {remain <= 0 ? "Дууссан" : `${formatQty(remain)} үлдсэн`}
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
  const [range, setRange] = useState<SalesRange>("today");
  // One fetch feeds both the "awaiting confirmation" tile and the recent list.
  const { data: orders } = useApi(getOrders);

  return (
    <>
      <PageHeader
        title="Хяналтын самбар"
        aside={
          <span className="shrink-0 font-mono text-sm text-muted-foreground">
            {formatDate(new Date())}
          </span>
        }
      >
        <ChipTabs label="Хугацаа" value={range} options={RANGES} onChange={setRange} />
      </PageHeader>

      <div className="space-y-3 pt-4">
        <SampleNotice>
          Захиалга, борлуулалтын API холбогдоогүй тул тэдгээрийн тоо жишээ өгөгдөл.
        </SampleNotice>
        <SalesSection
          range={range}
          pending={orders?.filter((order) => order.status === "pending").length}
        />
        <LowStockCard />
        {orders && orders.length > 0 && <RecentOrdersCard orders={orders} />}
      </div>
    </>
  );
}
