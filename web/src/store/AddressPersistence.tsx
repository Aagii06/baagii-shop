"use client";

import { useEffect, useRef } from "react";
import { useAddressStore } from "./addressStore";

const STORAGE_KEY = "delivery_addresses";

// Delivery addresses are demo-only for now, so they live in localStorage.
// Read after mount to keep the server and first client render identical.
export default function AddressPersistence() {
  const addresses = useAddressStore((s) => s.addresses);
  const setAddresses = useAddressStore((s) => s.setAddresses);
  const isFirstWrite = useRef(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setAddresses(JSON.parse(saved));
    } catch {
      // ignore malformed storage
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isFirstWrite.current) {
      isFirstWrite.current = false;
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(addresses));
    } catch {
      // non-fatal
    }
  }, [addresses]);

  return null;
}
