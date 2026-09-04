"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "./authStore";
import { useSavedStore } from "./savedStore";

// Saved items are demo-only (no backend yet), so they live in the browser.
// Each identity gets its own bucket, keyed by the verified phone (falling
// back to the backend user id, then a shared guest bucket), so signing in
// with a phone brings back that phone's saved items.
function bucketKey(phone: string | null, userId?: number) {
  const id = phone ?? (userId != null ? `user-${userId}` : "guest");
  return `saved_products:${id}`;
}

export default function SavedPersistence() {
  const items = useSavedStore((s) => s.items);
  const setItems = useSavedStore((s) => s.setItems);
  const phone = useAuthStore((s) => s.phone);
  const userId = useAuthStore((s) => s.user?.id);
  const authLoading = useAuthStore((s) => s.loading);

  // The bucket the store is currently backed by; null until the identity
  // settles so early writes don't land in the wrong bucket.
  const activeKey = useRef<string | null>(null);

  // Swap in the right bucket whenever the identity settles or changes.
  useEffect(() => {
    if (authLoading) return;
    const key = bucketKey(phone, userId);
    if (activeKey.current === key) return;
    activeKey.current = key;
    try {
      const stored = localStorage.getItem(key);
      setItems(stored ? JSON.parse(stored) : []);
    } catch {
      setItems([]);
    }
  }, [phone, userId, authLoading, setItems]);

  // Persist changes to the active bucket.
  useEffect(() => {
    if (!activeKey.current) return;
    try {
      localStorage.setItem(activeKey.current, JSON.stringify(items));
    } catch {
      // non-fatal
    }
  }, [items]);

  return null;
}
