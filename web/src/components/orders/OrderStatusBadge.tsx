"use client";

import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { OrderStatus } from "@/types/order";

export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useLanguage();

  if (status === "confirmed") {
    return (
      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-transparent">
        {t("orders.status.confirmedBadge")}
      </Badge>
    );
  }

  return (
    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-transparent">
      {t("orders.status.pendingBadge")}
    </Badge>
  );
}
