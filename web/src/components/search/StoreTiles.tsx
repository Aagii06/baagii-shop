"use client";

import { fileThumbnailUrl } from "@/lib/api/files";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/product";
import { useMemo } from "react";

interface StoreTile {
  name: string;
  logo?: string;
  count: number;
}

/** The stores selling the products found, most products first. */
function storesOf(products: Product[]): StoreTile[] {
  const byName = new Map<string, StoreTile>();
  for (const p of products) {
    if (!p.brand) continue;
    const tile = byName.get(p.brand) ?? { name: p.brand, logo: p.brandLogo, count: 0 };
    tile.count += 1;
    byName.set(p.brand, tile);
  }
  return [...byName.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/**
 * Row of store tiles above the results — logo with the name under it. Picks
 * one store at a time; tapping it again clears the filter.
 */
export default function StoreTiles({
  products,
  selected,
  onSelect,
}: {
  products: Product[];
  /** The store filtered to, if one. */
  selected?: string;
  onSelect: (store: string | undefined) => void;
}) {
  const { t } = useLanguage();
  const stores = useMemo(() => storesOf(products), [products]);
  if (stores.length === 0) return null;

  return (
    <section aria-label={t("search.filters.stores")}>
      {/* One scrolling row at every width, like the category row on the home page. */}
      <div className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {stores.map((store) => {
          const active = store.name === selected;
          const logo = fileThumbnailUrl(store.logo);
          return (
            <button
              key={store.name}
              type="button"
              aria-pressed={active}
              title={t("search.storeCount", { name: store.name, count: store.count })}
              onClick={() => onSelect(active ? undefined : store.name)}
              className={cn(
                "group flex w-24 shrink-0 flex-col items-center gap-1.5 rounded-2xl border-2 bg-card p-2.5 transition-colors sm:w-28",
                active ? "border-primary" : "border-border hover:border-primary/40"
              )}
            >
              <span className="grid size-14 place-items-center overflow-hidden rounded-xl bg-muted sm:size-16">
                {logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logo}
                    alt=""
                    loading="lazy"
                    className={cn(
                      "size-full object-contain transition",
                      active ? "" : "opacity-85 grayscale group-hover:opacity-100 group-hover:grayscale-0"
                    )}
                  />
                ) : (
                  // No logo: the store's first letter.
                  <span className="text-xl font-bold text-muted-foreground">{store.name.charAt(0).toUpperCase()}</span>
                )}
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
