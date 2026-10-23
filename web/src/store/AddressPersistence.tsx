"use client";

import { phoneDigits } from "@/components/ui/phone-input";
import { useEffect, useRef } from "react";
import { useAddressStore, type Address } from "./addressStore";
import { useAuthStore } from "./authStore";

// Delivery addresses are demo-only for now, so they live in the browser.
// Each identity gets its own bucket, keyed by the verified phone (falling
// back to the backend user id, then a shared guest bucket), so signing in
// with a phone brings back that phone's saved addresses.
const PREFIX = "delivery_addresses:";

// The phone is normalised to its 8 digits so "9911 2345" and "99112345"
// share one bucket.
function bucketKey(phone: string | null, userId?: number) {
  const id = phone
    ? phoneDigits(phone)
    : userId != null
      ? `user-${userId}`
      : "guest";
  return `${PREFIX}${id}`;
}

function parseBucket(raw: string | null): Address[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Buckets were once keyed by the phone exactly as typed (with spaces or
// +976). If the normalised bucket is missing or empty — it may have been
// saved as "[]" before this fallback existed — adopt such an older one.
function readBucket(key: string, phone: string | null): Address[] {
  const current = parseBucket(localStorage.getItem(key));
  if (current.length > 0 || !phone) return current;
  const digits = phoneDigits(phone);
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (
      !k ||
      k === key ||
      !k.startsWith(PREFIX) ||
      phoneDigits(k.slice(PREFIX.length)) !== digits
    ) {
      continue;
    }
    const legacy = parseBucket(localStorage.getItem(k));
    if (legacy.length > 0) return legacy;
  }
  return current;
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
      setAddresses(readBucket(key, phone));
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
