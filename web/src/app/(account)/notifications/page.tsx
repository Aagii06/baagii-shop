"use client";

import { Button } from "@/components/ui/button";
import PageLoader from "@/components/ui/page-loader";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type CustomerNotification,
  type CustomerNotificationType,
} from "@/lib/api/notifications";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { cn, formatDateTime } from "@/lib/utils";
import { useNotificationStore } from "@/store/notificationStore";
import {
  Bell,
  CircleCheck,
  CircleDollarSign,
  CircleX,
  Handshake,
  Loader2,
  Truck,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const PAGE_SIZE = 30;

const ICON: Record<CustomerNotificationType, LucideIcon> = {
  order_paid: CircleDollarSign,
  order_confirmed: CircleCheck,
  order_delivered: Truck,
  order_cancelled: CircleX,
  order_returned: Undo2,
  partner_approved: Handshake,
  partner_rejected: Handshake,
};

/** The signed-in shopper's notifications; tapping one marks it read and opens its order. */
export default function NotificationsPage() {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const unread = useNotificationStore((s) => s.unread);
  const setUnread = useNotificationStore((s) => s.setUnread);
  const [rows, setRows] = useState<CustomerNotification[] | null>(null);
  const [count, setCount] = useState(0);
  const [error, setError] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(() => {
    setError(false);
    getNotifications(0, PAGE_SIZE).then(
      (page) => {
        setRows(page.rows);
        setCount(page.count);
        setUnread(page.unread);
      },
      () => setError(true)
    );
  }, [setUnread]);

  useEffect(load, [load]);

  async function more() {
    if (!rows || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await getNotifications(rows.length, PAGE_SIZE);
      setRows((prev) => [...(prev ?? []), ...page.rows.filter((r) => !prev?.some((p) => p.id === r.id))]);
      setCount(page.count);
    } catch {
      // The button stays; tapping it again retries.
    } finally {
      setLoadingMore(false);
    }
  }

  function open(item: CustomerNotification) {
    if (!item.read) {
      setRows((prev) => prev?.map((r) => (r.id === item.id ? { ...r, read: true } : r)) ?? prev);
      setUnread(unread - 1);
      void markNotificationRead(item.id).catch(() => {});
    }
    if (item.link) router.push(item.link);
  }

  function readAll() {
    setRows((prev) => prev?.map((r) => ({ ...r, read: true })) ?? prev);
    setUnread(0);
    void markAllNotificationsRead().catch(load);
  }

  if (!rows && !error) return <PageLoader className="px-0 py-0 sm:py-0" />;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">{t("notifications.title")}</h1>
        {unread > 0 && (
          <Button variant="outline" size="sm" className="rounded-full" onClick={readAll}>
            {t("notifications.readAll")}
          </Button>
        )}
      </div>

      {error && !rows ? (
        <div className="py-10 text-center">
          <p className="mb-4 text-muted-foreground">{t("notifications.error")}</p>
          <Button variant="outline" onClick={load}>
            {t("notifications.retry")}
          </Button>
        </div>
      ) : rows && rows.length === 0 ? (
        <div className="py-10 text-center">
          <Bell className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 text-xl font-bold text-foreground">{t("notifications.empty")}</h2>
          <p className="text-muted-foreground">{t("notifications.emptyHint")}</p>
        </div>
      ) : (
        <>
          <ul className="overflow-hidden rounded-2xl border border-border bg-card divide-y divide-border">
            {rows?.map((item) => {
              const Icon = ICON[item.type] ?? Bell;
              const bad = item.type === "order_cancelled" || item.type === "partner_rejected";
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => open(item)}
                    className={cn(
                      "flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/60",
                      !item.read && "bg-accent/40"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                        bad ? "bg-destructive/10 text-destructive" : "bg-accent text-accent-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn("block text-[15px] leading-snug", item.read ? "font-medium" : "font-bold")}>
                        {item.title}
                      </span>
                      {item.body && <span className="mt-0.5 block text-sm text-muted-foreground">{item.body}</span>}
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {formatDateTime(item.createdAt, locale)}
                      </span>
                    </span>
                    {!item.read && <span aria-hidden className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />}
                  </button>
                </li>
              );
            })}
          </ul>
          {rows && rows.length < count && (
            <Button variant="outline" className="mt-4 w-full rounded-full" onClick={more} disabled={loadingMore}>
              {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("notifications.more")}
            </Button>
          )}
        </>
      )}
    </>
  );
}
