"use client";

import { useEffect, useRef } from "react";
import { useCartStore } from "./cartStore";

const MIN_REFRESH_GAP_MS = 10_000;

// The cart lives on the server (keyed by the guest token). We pull it on
// mount and whenever the tab regains focus, so a cart the backend has
// expired (30 min TTL) disappears from the UI without a manual reload.
export default function CartSync() {
  const refreshCart = useCartStore((s) => s.refreshCart);
  const lastRefresh = useRef(0);

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
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refreshCart]);

  return null;
}
