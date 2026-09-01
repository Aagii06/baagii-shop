"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getCategories } from "@/lib/api/categories";
import { fallbackCategories, type Category } from "@/lib/categories";

interface CategoriesContextValue {
  /** Top-level categories, each with a `children` array. */
  categories: Category[];
  /** True until the live tree has been fetched (or the fetch failed). */
  loading: boolean;
}

const CategoriesContext = createContext<CategoriesContextValue | null>(null);

export default function CategoriesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [categories, setCategories] = useState<Category[]>(fallbackCategories);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getCategories()
      .then((tree) => {
        if (!cancelled && tree.length > 0) setCategories(tree);
      })
      .catch(() => {
        // Keep the fallback tree on failure.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <CategoriesContext.Provider value={{ categories, loading }}>
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
