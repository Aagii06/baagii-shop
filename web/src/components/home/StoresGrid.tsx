"use client";

import SafeImage from "@/components/ui/safe-image";
import { fileThumbnailUrl } from "@/lib/api/files";
import { getStores, type Store } from "@/lib/api/stores";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import Link from "next/link";
import { useEffect, useState } from "react";

const SKELETON_TILES = 10;

const TILE =
  "flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-card p-2 md:size-[72px]";
// Logo tile with the store's name under it.
const ITEM = "flex w-16 shrink-0 flex-col items-center gap-2 md:w-[72px]";

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
      {/* Extra room (offset by negative margins) so the hover zoom and shadow
          aren't clipped by the scrolling row. */}
      <div className="no-scrollbar -mx-4 -my-3 flex gap-3 overflow-x-auto px-4 py-3 sm:-mx-3 sm:px-3">
        {loading &&
          Array.from({ length: SKELETON_TILES }, (_, i) => (
            <div key={i} aria-hidden className={ITEM}>
              <div className={TILE}>
                <div className="size-full animate-pulse rounded-md bg-muted" />
              </div>
              <div className="h-2.5 w-12 animate-pulse rounded-full bg-muted" />
            </div>
          ))}
        {!loading &&
          stores.map((store) => (
            <Link
              key={store.id}
              href={`/search?store=${encodeURIComponent(store.name)}`}
              title={store.name}
              className={`group ${ITEM} focus-visible:outline-none`}
            >
              <span
                className={`${TILE} transition duration-300 ease-out group-hover:scale-110 group-hover:brand-glow group-focus-visible:scale-110 group-focus-visible:brand-glow`}
              >
                <SafeImage
                  src={fileThumbnailUrl(store.logo)}
                  alt=""
                  loading="lazy"
                  fallback="sm"
                  className="size-full rounded-md bg-transparent object-contain opacity-80 grayscale transition group-hover:opacity-100 group-hover:grayscale-0"
                />
              </span>
              <span className="line-clamp-2 w-full text-center text-[11px] font-medium leading-tight text-muted-foreground transition-colors duration-300 group-hover:text-primary group-focus-visible:text-primary">
                {store.name}
              </span>
            </Link>
          ))}
      </div>
    </section>
  );
}
