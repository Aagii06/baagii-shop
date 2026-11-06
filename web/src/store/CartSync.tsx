"use client";

import { useEffect, useRef } from "react";
import { GUEST_SESSION_CHANGED_EVENT } from "@/lib/api/auth";
import { useCartStore } from "./cartStore";

const MIN_REFRESH_GAP_MS = 10_000;

// The cart lives on the server (keyed by the guest token). We pull it on
// mount, whenever the tab regains focus, and right after the soonest line
// runs out (each line lives 1 h from when it was added), so an expired line
// disappears from the UI without a manual reload.
export default function CartSync() {
  const refreshCart = useCartStore((s) => s.refreshCart);
  const resetCart = useCartStore((s) => s.resetCart);
  const lastRefresh = useRef(0);
  const nextExpiry = useCartStore((s) =>
    s.items.reduce<number | null>(
      (soonest, item) =>
        item.expiresAt != null && (soonest == null || item.expiresAt < soonest) ? item.expiresAt : soonest,
      null
    )
  );

  useEffect(() => {
    if (nextExpiry == null) return;
    // A second of slack so the backend sees the line as expired too.
    const timer = window.setTimeout(() => {
      lastRefresh.current = Date.now();
      refreshCart();
    }, Math.max(0, nextExpiry - Date.now()) + 1000);
    return () => window.clearTimeout(timer);
  }, [nextExpiry, refreshCart]);

  useEffect(() => {
    const refresh = () => {
      const now = Date.now();
      if (now - lastRefresh.current < MIN_REFRESH_GAP_MS) return;
      lastRefresh.current = now;
      refreshCart();
    };

    refresh();

    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    // A replaced guest session took its server cart with it — drop the
    // local one immediately, then pull the (empty) cart for the new token.
    const onGuestChanged = () => {
      resetCart();
      lastRefresh.current = 0;
      refresh();
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener(GUEST_SESSION_CHANGED_EVENT, onGuestChanged);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener(GUEST_SESSION_CHANGED_EVENT, onGuestChanged);
    };
  }, [refreshCart, resetCart]);

  return null;
}
