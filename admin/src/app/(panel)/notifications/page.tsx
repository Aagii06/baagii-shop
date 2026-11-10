"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { EmptyState, ErrorState } from "@/components/common/States";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
  type NotificationType,
} from "@/lib/api/notifications";
import { cn, formatWhen } from "@/lib/utils";
import {
  ArrowLeft,
  Bell,
  CircleDollarSign,
  Handshake,
  Loader2,
  MessageSquareText,
  PackageMinus,
  ReceiptText,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const PAGE_SIZE = 30;

const ICON: Record<NotificationType, { icon: LucideIcon; tone: string }> = {
  order: { icon: ReceiptText, tone: "bg-tint-blue text-tint-blue-ink" },
  order_paid: { icon: CircleDollarSign, tone: "bg-tint-mint text-tint-mint-ink" },
  partner: { icon: Handshake, tone: "bg-tint-peach text-tint-peach-ink" },
  feedback: { icon: MessageSquareText, tone: "bg-primary-soft text-primary-ink" },
  low_stock: { icon: PackageMinus, tone: "bg-destructive/10 text-destructive" },
};

/**
 * The bell's page: the signed-in user's notifications, full screen with a
 * back button. Tapping one marks it read and opens what it is about.
 */
export default function NotificationsPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [rows, setRows] = useState<AppNotification[] | null>(null);
  const [count, setCount] = useState(0);
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchFirst = useCallback(
    () =>
      getNotifications(0, PAGE_SIZE).then(
        (page) => {
          setRows(page.rows);
          setCount(page.count);
          setUnread(page.unread);
        },
        (err: unknown) => setError(err instanceof Error ? err : new Error(String(err)))
      ),
    []
  );

  useEffect(() => {
    void fetchFirst();
  }, [fetchFirst]);

  function load() {
    setError(null);
    void fetchFirst();
  }

  // Back to wherever the bell was tapped; the dashboard if opened directly.
  function back() {
    if (window.history.length > 1) router.back();
    else router.replace("/");
  }

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

  function open(item: AppNotification) {
    if (!item.read) {
      setRows((prev) => prev?.map((r) => (r.id === item.id ? { ...r, read: true } : r)) ?? prev);
      setUnread((n) => Math.max(0, n - 1));
      void markNotificationRead(item.id).catch(() => {});
    }
    if (item.link) router.push(item.link);
  }

  async function readAll() {
    setRows((prev) => prev?.map((r) => ({ ...r, read: true })) ?? prev);
    setUnread(0);
    await markAllNotificationsRead().catch(() => load());
  }

  return (
    <>
      <header className="sticky top-0 z-30 -mx-4 flex min-h-[4.25rem] items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <button
          type="button"
          onClick={back}
          aria-label={t("common.back")}
          className="grid size-11 shrink-0 place-items-center rounded-full border border-border bg-white transition-colors hover:bg-muted"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="min-w-0 grow truncate text-lg font-extrabold leading-tight">{t("nt.title")}</h1>
        {unread > 0 && (
          <button
            type="button"
            onClick={readAll}
            className="shrink-0 rounded-full px-3 py-2 text-sm font-semibold text-primary-ink transition-colors hover:bg-primary-soft"
          >
            {t("nt.readAll")}
          </button>
        )}
      </header>

      {error && !rows ? (
        <div className="pt-4">
          <ErrorState error={error} onRetry={load} />
        </div>
      ) : !rows ? (
        <div className="grid place-items-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <div className="pt-4">
          <EmptyState icon={Bell} title={t("nt.empty")} description={t("nt.emptyHint")} />
        </div>
      ) : (
        <>
          <ul className="-mx-4 divide-y divide-border border-b border-border bg-white">
            {rows.map((item) => {
              const { icon: Icon, tone } = ICON[item.type] ?? ICON.order;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => open(item)}
                    className={cn(
                      "flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/60",
                      !item.read && "bg-primary-soft/40"
                    )}
                  >
                    <span className={cn("grid size-10 shrink-0 place-items-center rounded-full", tone)}>
                      <Icon className="size-5" />
                    </span>
                    <span className="min-w-0 grow">
                      <span className={cn("block text-[15px] leading-snug", item.read ? "font-medium" : "font-bold")}>
                        {item.title}
                      </span>
                      {item.body && (
                        <span className="mt-0.5 line-clamp-2 block text-sm text-muted-foreground">{item.body}</span>
                      )}
                      <span className="mt-1 block font-mono text-xs text-muted-foreground">
                        {formatWhen(item.createdAt)}
                      </span>
                    </span>
                    {!item.read && <span aria-hidden className="mt-2 size-2.5 shrink-0 rounded-full bg-primary" />}
                  </button>
                </li>
              );
            })}
          </ul>
          {rows.length < count && (
            <button
              type="button"
              onClick={more}
              disabled={loadingMore}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-border bg-white py-2.5 text-sm font-semibold transition-colors hover:bg-muted disabled:opacity-60"
            >
              {loadingMore && <Loader2 className="size-4 animate-spin" />}
              {t("nt.more")}
            </button>
          )}
        </>
      )}
    </>
  );
}
