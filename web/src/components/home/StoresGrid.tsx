"use client";

import SafeImage from "@/components/ui/safe-image";
import { fileThumbnailUrl } from "@/lib/api/files";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { Product } from "@/types/product";
import Link from "next/link";
import { useMemo } from "react";

const SKELETON_TILES = 10;

interface Store {
  name: string;
  logo?: string;
  count: number;
}

/** The stores selling the products, most products first. */
function storesOf(products: Product[]): Store[] {
  const byName = new Map<string, Store>();
  for (const p of products) {
    if (!p.brand) continue;
    const store = byName.get(p.brand) ?? { name: p.brand, logo: p.brandLogo, count: 0 };
    store.logo ??= p.brandLogo;
    store.count += 1;
    byName.set(p.brand, store);
  }
  return [...byName.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

const TILE =
  "flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 bg-card p-2 md:size-[72px]";

/** Row of store logo tiles under the hero; each opens search filtered to it. */
export default function StoresGrid({
  products,
  loading,
}: {
  products: Product[];
  loading: boolean;
}) {
  const { t } = useLanguage();
  const stores = useMemo(() => storesOf(products), [products]);
  if (!loading && stores.length === 0) return null;

  return (
    <section aria-busy={loading}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">{t("home.stores.title")}</h2>
        <Link href="/search" className="text-sm font-medium text-primary hover:underline">
          {t("home.allProducts.viewAll")}
        </Link>
      </div>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {loading &&
          Array.from({ length: SKELETON_TILES }, (_, i) => (
            <div key={i} aria-hidden className={`${TILE} border-transparent`}>
              <div className="size-full animate-pulse rounded-md bg-muted" />
            </div>
          ))}
        {!loading &&
          stores.map((store) => (
            <Link
              key={store.name}
              href={`/search?store=${encodeURIComponent(store.name)}`}
              aria-label={store.name}
              title={store.name}
              className={`group ${TILE} border-transparent transition-colors hover:border-border`}
            >
              <SafeImage
                src={fileThumbnailUrl(store.logo)}
                alt=""
                loading="lazy"
                fallback="sm"
                className="size-full rounded-md bg-transparent object-contain opacity-80 grayscale transition group-hover:opacity-100 group-hover:grayscale-0"
              />
            </Link>
          ))}
      </div>
    </section>
  );
}
