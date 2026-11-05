"use client";

import SafeImage from "@/components/ui/safe-image";
import { fileThumbnailUrl } from "@/lib/api/files";
import { getStores, type Store } from "@/lib/api/stores";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import Link from "next/link";
import { useEffect, useState } from "react";

const SKELETON_TILES = 10;

const TILE =
  "flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 bg-card p-2 md:size-[72px]";

/**
 * Row of store logo tiles under the hero, most products first; stores with
 * no products yet are listed too. Each opens search filtered to it.
 */
export default function StoresGrid() {
  const { t } = useLanguage();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getStores()
      .then((rows) => !cancelled && setStores(rows))
      .catch(() => !cancelled && setStores([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loading && stores.length === 0) return null;

  return (
    <section aria-busy={loading}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("home.stores.title")}
        </h2>
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
              key={store.id}
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
