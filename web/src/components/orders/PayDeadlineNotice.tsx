"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";
import { useEffect, useState } from "react";

/** "02:41:07" — hours:minutes:seconds left, never below zero. */
function formatLeft(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
}

/**
 * Warns that an unpaid order is cancelled automatically, with a live countdown
 * to `deadline` (from the backend's `payDeadline`). Renders nothing without one.
 */
export default function PayDeadlineNotice({
  deadline,
  hours,
  className,
}: {
  deadline?: string | null;
  /** The window, for the text ("3 цагийн дотор"). */
  hours?: number;
  className?: string;
}) {
  const { t } = useLanguage();
  const end = deadline ? Date.parse(deadline) : NaN;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (Number.isNaN(end)) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [end]);

  if (Number.isNaN(end)) return null;
  const left = end - now;
  const expired = left <= 0;
  // Under 30 minutes left: red, to hurry.
  const urgent = left < 30 * 60 * 1000;

  return (
    <div
      role="timer"
      aria-live="off"
      className={cn(
        "flex items-center gap-3 rounded-2xl border p-4",
        urgent ? "border-destructive/30 bg-destructive/5 text-destructive" : "border-amber-200 bg-amber-50 text-amber-800",
        className
      )}
    >
      <Clock className="h-5 w-5 shrink-0" />
      <p className="min-w-0 grow text-sm">
        {expired
          ? t("orders.deadline.expired")
          : t("orders.deadline.warning", { hours: hours ?? 3 })}
      </p>
      {!expired && (
        <span className="shrink-0 rounded-lg bg-white/70 px-2.5 py-1 font-mono text-lg font-bold tabular-nums">
          {formatLeft(left)}
        </span>
      )}
    </div>
  );
}
