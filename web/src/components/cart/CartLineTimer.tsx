"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import { Timer } from "lucide-react";
import { useEffect, useState } from "react";

/** Under this much time left the countdown turns red. */
const WARN_MS = 5 * 60 * 1000;

function format(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

/**
 * Live countdown until the backend drops a cart line (1 h after it was
 * added). CartSync refreshes the cart when it hits zero.
 */
export default function CartLineTimer({ expiresAt }: { expiresAt: number }) {
  const { t } = useLanguage();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const left = expiresAt - now;
  const expired = left <= 0;

  return (
    <p
      className={cn(
        "mt-1 inline-flex items-center gap-1 text-xs font-medium",
        left < WARN_MS ? "text-destructive" : "text-muted-foreground"
      )}
      title={t("cart.timer.hint")}
    >
      <Timer className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {expired ? (
        t("cart.timer.expired")
      ) : (
        <span>
          {t("cart.timer.left")}{" "}
          <span className="font-mono tabular-nums" suppressHydrationWarning>
            {format(left)}
          </span>
        </span>
      )}
    </p>
  );
}
