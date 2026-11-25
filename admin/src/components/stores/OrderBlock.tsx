"use client";

import Thumb from "@/components/common/Thumb";
import type { SettlementOrder } from "@/lib/api/storeReport";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { cn, formatDate, formatMNT } from "@/lib/utils";
import Link from "next/link";

/** An order with its lines — order number links to the order. */
export default function OrderBlock({ order, deliveredAt }: { order: SettlementOrder; deliveredAt?: string | null }) {
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
