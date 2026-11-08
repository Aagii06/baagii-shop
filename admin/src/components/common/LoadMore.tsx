"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Loader2 } from "lucide-react";

/**
 * Infinite lists load their next page once this row at the bottom comes on
 * screen — when the reader reaches the end, not before.
 */
export const LOAD_MORE_MARGIN = "0px 0px 40px 0px";

/** Waits at least `ms` for `promise`, so a fast page still shows its spinner. */
export async function atLeast<T>(promise: Promise<T>, ms = 400): Promise<T> {
  const [value] = await Promise.all([promise, new Promise((resolve) => setTimeout(resolve, ms))]);
  return value;
}

/** The spinner row under an infinite list while its next page loads. */
export function LoadingMore() {
  const { t } = useLanguage();
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-6 text-sm font-medium text-muted-foreground">
      <Loader2 className="size-5 animate-spin text-primary" />
      {t("common.loading")}
    </div>
  );
}
