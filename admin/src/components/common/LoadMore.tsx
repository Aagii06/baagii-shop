"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";

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

/** The spinner row under an infinite list while its next page loads: a brand-gradient ring. */
export function LoadingMore() {
  const { t } = useLanguage();
  return (
    <div role="status" aria-label={t("common.loading")} className="flex justify-center py-6">
      <span
        className="size-8 animate-spin rounded-full"
        style={{
          background: "conic-gradient(from 0deg, transparent 0deg, var(--gradient-to) 120deg, var(--gradient-from) 300deg, transparent 360deg)",
          // Hollow out the middle so only a ring is left.
          mask: "radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 3px))",
          WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 3px))",
        }}
      />
    </div>
  );
}
