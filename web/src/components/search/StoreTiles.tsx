"use client";

import { fileUrl } from "@/lib/api/files";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import StoreAvatar from "@/components/ui/store-avatar";
import { useMemo } from "react";

interface StoreTile {
  name: string;
  logo?: string;
  count: number;
}

/** Every store, most products in these results first. */
function storesOf(counts: {
  brand: Record<string, number>;
  brandLogo?: Record<string, string | undefined>;
}): StoreTile[] {
  return Object.entries(counts.brand)
    .map(([name, count]) => ({ name, count, logo: counts.brandLogo?.[name] }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/**
 * Row of store tiles above the results — logo with the name under it. Picks
 * one store at a time; tapping it again clears the filter.
 */
export default function StoreTiles({
  counts,
  selected,
  onSelect,
}: {
  /** Products per store in the results (0 for stores with none), and logos. */
  counts: {
    brand: Record<string, number>;
    brandLogo?: Record<string, string | undefined>;
  };
  /** The store filtered to, if one. */
  selected?: string;
  onSelect: (store: string | undefined) => void;
}) {
  const { t } = useLanguage();
  const stores = useMemo(() => storesOf(counts), [counts]);
  if (stores.length === 0) return null;

  return (
    <section aria-label={t("search.filters.stores")}>
      {/* One scrolling row at every width, like the category row on the home page. */}
      <div className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {stores.map((store) => {
          const active = store.name === selected;
          const logo = fileUrl(store.logo, "thumbnail");
          return (
              <button
                key={store.name}
                type="button"
                aria-pressed={active}
                aria-label={t("search.storeCount", { name: store.name, count: store.count })}
                onClick={() => onSelect(active ? undefined : store.name)}
                className={cn(
                  "group flex w-24 shrink-0 flex-col items-center gap-1.5 rounded-2xl border-2 bg-card p-2.5 transition-colors sm:w-28",
                  active ? "border-primary" : "border-border hover:border-primary/40"
                )}
              >
                <span className="grid size-14 place-items-center overflow-hidden rounded-xl bg-muted sm:size-16">
                  {/* No logo, or it fails to load: the store's initials. */}
                  <StoreAvatar
                    name={store.name}
                    src={logo}
                    className={cn(
                      "size-full object-contain transition",
                      active ? "" : "opacity-85 grayscale group-hover:opacity-100 group-hover:grayscale-0"
                    )}
                  />
                </span>
                <span className={cn("w-full truncate text-center text-xs font-semibold", active ? "text-primary" : "text-foreground")}>
                  {store.name}
                </span>
                <span className="-mt-1 text-[11px] text-muted-foreground">{store.count}</span>
              </button>
          );
        })}
      </div>
    </section>
  );
}
