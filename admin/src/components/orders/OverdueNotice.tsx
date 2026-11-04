"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useConfirm } from "@/components/common/Confirm";
import { useToast } from "@/components/common/Toast";
import { Button } from "@/components/ui/button";
import { cancelOrder, type Order } from "@/lib/api/orders";
import { useAuth } from "@/lib/auth/AuthProvider";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

/**
 * Warns that an order has waited too long unpaid; an admin can cancel it
 * from here, which puts its stock back.
 */
export default function OverdueNotice({
  order,
  onCancelled,
  className,
}: {
  order: Order;
  onCancelled: () => void;
  className?: string;
}) {
  const { t } = useLanguage();
  const { role } = useAuth();
  const { run } = useToast();
  const confirm = useConfirm();

  if (!order.overdue) return null;

  async function onCancel() {
    const ok = await confirm({
      title: t("orders.cancelTitle", { id: order.id }),
      description: t("orders.cancelDesc"),
      confirmLabel: t("orders.cancel"),
      tone: "danger",
    });
    if (ok && (await run(() => cancelOrder(order.id), t("orders.cancelled")))) onCancelled();
  }

  return (
    <div className={cn("flex items-center gap-3 rounded-2xl bg-warning-soft p-3 text-warning", className)}>
      <AlertTriangle className="size-5 shrink-0" />
      <p className="min-w-0 grow text-sm font-semibold">{t("orders.overdue")}</p>
      {role === "admin" && (
        <Button variant="danger" size="sm" className="shrink-0" onClick={onCancel}>
          {t("orders.cancel")}
        </Button>
      )}
    </div>
  );
}
