"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types/order";

export default function OrderProgress({
  status,
  caption,
}: {
  status: OrderStatus;
  caption: string;
}) {
  const { t } = useLanguage();
  const stageLabels = [
    t("orders.progress.received"),
    t("orders.progress.paid"),
    t("orders.progress.delivering"),
  ];
  const filled = status === "confirmed" ? 2 : 1;

  return (
    <div>
      <div className="flex items-center gap-1.5">
        {stageLabels.map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              i < filled ? "bg-emerald-500" : "bg-muted"
            )}
          />
        ))}
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-muted-foreground">
          {stageLabels[filled - 1]}
        </span>
        <span className="text-xs text-muted-foreground">{caption}</span>
      </div>
    </div>
  );
}
