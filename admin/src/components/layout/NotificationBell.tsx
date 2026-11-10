"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { getUnreadCount } from "@/lib/api/notifications";
import { Bell } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

/** How often the badge asks for the unread count while the page is visible. */
const POLL_MS = 30_000;

/**
 * The header's bell: a red badge with the unread count (polled), opening the
 * full-screen /notifications page. The header comes back on each tab page,
 * so the count is fresh again after reading there.
 */
export default function NotificationBell() {
  const { t } = useLanguage();
  const [unread, setUnread] = useState(0);

  const refresh = useCallback(() => {
    getUnreadCount().then(setUnread, () => {});
  }, []);

  // Poll while the tab is visible; check again as soon as it comes back.
  useEffect(() => {
    refresh();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  return (
    <Link
      href="/notifications"
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
    </Link>
  );
}
