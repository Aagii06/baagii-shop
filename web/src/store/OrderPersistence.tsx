"use client";

import { useEffect, useRef } from "react";
import { useOrderStore } from "./orderStore";

// Orders are demo-only and never hit a backend, so they live in localStorage.
// The read happens after mount (not in the store initializer) to keep the
// server-rendered and first client render identical.
export default function OrderPersistence() {
  const orders = useOrderStore((s) => s.orders);
  const setOrders = useOrderStore((s) => s.setOrders);
  const isFirstWrite = useRef(true);

  useEffect(() => {
    const saved = localStorage.getItem("orders");
    if (saved) {
      setOrders(JSON.parse(saved));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isFirstWrite.current) {
      isFirstWrite.current = false;
      return;
    }
    localStorage.setItem("orders", JSON.stringify(orders));
  }, [orders]);

  return null;
}
