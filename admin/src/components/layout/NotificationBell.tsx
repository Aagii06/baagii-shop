"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import {
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
  type NotificationType,
} from "@/lib/api/notifications";
import { cn, formatWhen } from "@/lib/utils";
import {
  Bell,
  CircleDollarSign,
  Handshake,
  Loader2,
  MessageSquareText,
  PackageMinus,
  ReceiptText,
  X,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";

/** How often the badge asks for the unread count while the page is visible. */
const POLL_MS = 30_000;
const PAGE_SIZE = 30;

const ICON: Record<NotificationType, { icon: LucideIcon; tone: string }> = {
  order: { icon: ReceiptText, tone: "bg-tint-blue text-tint-blue-ink" },
  order_paid: { icon: CircleDollarSign, tone: "bg-tint-mint text-tint-mint-ink" },
  partner: { icon: Handshake, tone: "bg-tint-peach text-tint-peach-ink" },
  feedback: { icon: MessageSquareText, tone: "bg-primary-soft text-primary-ink" },
  low_stock: { icon: PackageMinus, tone: "bg-destructive/10 text-destructive" },
};

/**
 * The header's bell: a red badge with the unread count (polled), and a sheet
 * listing the signed-in user's notifications. Tapping one marks it read and
 * opens what it is about.
 */
export default function NotificationBell() {
  const { t } = useLanguage();
  const router = useRouter();
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<AppNotification[] | null>(null);
  const [count, setCount] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshCount = useCallback(() => {
    getUnreadCount().then(setUnread, () => {});
  }, []);

  // Poll while the tab is visible; check again as soon as it comes back.
  useEffect(() => {
    refreshCount();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") refreshCount();
    }, POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && refreshCount();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refreshCount]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const page = await getNotifications(0, PAGE_SIZE);
      setRows(page.rows);
      setCount(page.count);
      setUnread(page.unread);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  function show() {
    setOpen(true);
    setRows(null);
    dialogRef.current?.showModal();
    void load();
  }

  function close() {
    dialogRef.current?.close();
    setOpen(false);
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

  function openItem(item: AppNotification) {
    if (!item.read) {
      setRows((prev) => prev?.map((r) => (r.id === item.id ? { ...r, read: true } : r)) ?? prev);
      setUnread((n) => Math.max(0, n - 1));
      void markNotificationRead(item.id).catch(() => {});
    }
    if (item.link) {
      close();
      router.push(item.link);
    }
  }

  async function readAll() {
    setRows((prev) => prev?.map((r) => ({ ...r, read: true })) ?? prev);
    setUnread(0);
    await markAllNotificationsRead().catch(() => refreshCount());
  }

  return (
    <>
      <button
        type="button"
        onClick={show}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={unread > 0 ? t("nt.open", { count: unread }) : t("nt.title")}
        title={t("nt.title")}
        className="relative grid size-10 place-items-center rounded-full border border-border bg-white transition-colors hover:bg-muted"
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 font-mono text-[11px] font-bold leading-none text-white ring-2 ring-background">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        // A tap on the backdrop lands on the dialog itself, not its content.
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
        className="inset-x-0 bottom-0 top-auto mx-auto mb-0 mt-auto max-h-[85dvh] w-full max-w-md overflow-hidden rounded-t-3xl bg-white p-0 text-foreground shadow-soft outline-none transition duration-200 ease-out backdrop:bg-black/40 starting:open:translate-y-8 starting:open:opacity-0"
      >
        <div className="flex max-h-[85dvh] flex-col pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <div className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-border" />
          <div className="flex items-center gap-2 border-b border-border px-5 pb-3">
            <h2 id={titleId} className="grow text-lg font-bold">
              {t("nt.title")}
            </h2>
            {unread > 0 && (
              <button
                type="button"
                onClick={readAll}
                className="rounded-full px-3 py-1.5 text-sm font-semibold text-primary-ink transition-colors hover:bg-primary-soft"
              >
                {t("nt.readAll")}
              </button>
            )}
            <button
              type="button"
              onClick={close}
              aria-label={t("nt.close")}
              className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {error && !rows ? (
              <div className="px-5 py-8 text-center text-sm">
                <p className="text-destructive">{error}</p>
                <button type="button" onClick={load} className="mt-3 font-semibold text-primary-ink hover:underline">
                  {t("common.retry")}
                </button>
              </div>
            ) : !rows ? (
              <div className="grid place-items-center py-12">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : rows.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <Bell className="mx-auto size-10 text-muted-foreground/60" />
                <p className="mt-3 font-semibold">{t("nt.empty")}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t("nt.emptyHint")}</p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {rows.map((item) => {
                  const { icon: Icon, tone } = ICON[item.type] ?? ICON.order;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => openItem(item)}
                        className={cn(
                          "flex w-full items-start gap-3 px-5 py-3.5 text-left transition-colors hover:bg-muted/60",
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
            )}
            {rows && rows.length < count && (
              <div className="p-4">
                <button
                  type="button"
                  onClick={more}
                  disabled={loadingMore}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-border py-2.5 text-sm font-semibold transition-colors hover:bg-muted disabled:opacity-60"
                >
                  {loadingMore && <Loader2 className="size-4 animate-spin" />}
                  {t("nt.more")}
                </button>
              </div>
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}
