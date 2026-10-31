"use client";

import { useEffect } from "react";
import { getMyOrders } from "@/lib/api/orders";
import { useAuthStore } from "./authStore";
import { useOrderStore } from "./orderStore";

// Orders live on the backend under the phone-signed-in shopper; a guest has
// none. Reloaded whenever the signed-in phone changes.
export default function OrderPersistence() {
  const setOrders = useOrderStore((s) => s.setOrders);
  const setLoaded = useOrderStore((s) => s.setLoaded);
  const phone = useAuthStore((s) => s.phone);
  const authLoading = useAuthStore((s) => s.loading);

  useEffect(() => {
    if (authLoading) return;
    if (!phone) {
      setOrders([]);
      return;
    }
    let cancelled = false;
    setLoaded(false);
    getMyOrders().then(
      (orders) => {
        if (!cancelled) setOrders(orders);
      },
      () => {
        // keep what's shown; the next sign-in or reload tries again
        if (!cancelled) setLoaded(true);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [phone, authLoading, setOrders, setLoaded]);

  return null;
}
