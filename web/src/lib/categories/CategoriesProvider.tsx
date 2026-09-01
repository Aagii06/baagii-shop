"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getCategories } from "@/lib/api/categories";
import type { Category } from "@/lib/categories";

interface CategoriesContextValue {
  /** Top-level categories, each with a `children` array. */
  categories: Category[];
  /** True until the live tree has been fetched (or the fetch failed). */
  loading: boolean;
  /** Set when the category fetch failed. */
  error: boolean;
}

const CategoriesContext = createContext<CategoriesContextValue | null>(null);

export default function CategoriesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCategories()
      .then((tree) => {
        if (!cancelled) setCategories(tree);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <CategoriesContext.Provider value={{ categories, loading, error }}>
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories() {
  const ctx = useContext(CategoriesContext);
  if (!ctx) {
    throw new Error("useCategories must be used within CategoriesProvider");
  }
  return ctx;
}
