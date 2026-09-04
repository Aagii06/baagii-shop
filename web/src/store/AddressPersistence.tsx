"use client";

import { useEffect, useRef } from "react";
import { useAddressStore } from "./addressStore";
import { useAuthStore } from "./authStore";

// Delivery addresses are demo-only for now, so they live in the browser.
// Each identity gets its own bucket, keyed by the verified phone (falling
// back to the backend user id, then a shared guest bucket), so signing in
// with a phone brings back that phone's saved addresses.
function bucketKey(phone: string | null, userId?: number) {
  const id = phone ?? (userId != null ? `user-${userId}` : "guest");
  return `delivery_addresses:${id}`;
}

export default function AddressPersistence() {
  const addresses = useAddressStore((s) => s.addresses);
  const setAddresses = useAddressStore((s) => s.setAddresses);
  const phone = useAuthStore((s) => s.phone);
  const userId = useAuthStore((s) => s.user?.id);
  const authLoading = useAuthStore((s) => s.loading);

  const activeKey = useRef<string | null>(null);

  // Swap in the right bucket whenever the identity settles or changes.
  useEffect(() => {
    if (authLoading) return;
    const key = bucketKey(phone, userId);
    if (activeKey.current === key) return;
    activeKey.current = key;
    try {
      const stored = localStorage.getItem(key);
      setAddresses(stored ? JSON.parse(stored) : []);
    } catch {
      setAddresses([]);
    }
  }, [phone, userId, authLoading, setAddresses]);

  // Persist changes to the active bucket.
  useEffect(() => {
    if (!activeKey.current) return;
    try {
      localStorage.setItem(activeKey.current, JSON.stringify(addresses));
    } catch {
      // non-fatal
    }
  }, [addresses]);

  return null;
}
