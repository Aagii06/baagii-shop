"use client";

import { useEffect, useRef } from "react";
import { useSavedStore } from "./savedStore";

const STORAGE_KEY = "saved_products";

// Saved items are demo-only (no backend yet), so they live in localStorage.
// The read happens after mount to keep the server and first client render
// identical, matching OrderPersistence.
export default function SavedPersistence() {
  const items = useSavedStore((s) => s.items);
  const setItems = useSavedStore((s) => s.setItems);
  const isFirstWrite = useRef(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setItems(JSON.parse(saved));
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // non-fatal
    }
  }, [items]);

  return null;
}
