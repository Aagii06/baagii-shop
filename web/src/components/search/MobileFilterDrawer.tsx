"use client";

import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { FilterPanelContent, type SearchFilters } from "./FilterSidebar";

interface MobileFilterDrawerProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  priceBounds: [number, number];
  counts: {
    category: Record<string, number>;
    brand: Record<string, number>;
    freeDelivery: number;
  };
  activeCount: number;
}

export default function MobileFilterDrawer({
  filters,
  onChange,
  priceBounds,
  counts,
  activeCount,
}: MobileFilterDrawerProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        className="relative flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground"
      >
        <SlidersHorizontal className="h-4 w-4" />
        {t("search.filters.button")}
        {activeCount > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-semibold text-primary-foreground">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40 animate-in fade-in duration-200"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] flex flex-col rounded-t-2xl bg-background animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-border px-4 py-3 shrink-0">
              <h2 className="text-base font-semibold text-foreground">
                {t("search.filters.title")}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("search.filters.close")}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              <FilterPanelContent
                filters={filters}
                onChange={onChange}
                priceBounds={priceBounds}
                counts={counts}
              />
            </div>

            <div className="border-t border-border p-4 shrink-0">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground"
              >
                {t("search.filters.apply")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
