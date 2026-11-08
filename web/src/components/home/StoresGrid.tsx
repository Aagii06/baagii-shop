"use client";

import StoreAvatar from "@/components/ui/store-avatar";
import { fileUrl } from "@/lib/api/files";
import { getStores, storeHref, type Store } from "@/lib/api/stores";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import Link from "next/link";
import { useEffect, useState } from "react";

const SKELETON_TILES = 10;

// One card per store: logo on top, then its name and product count. Fixed
// height (the name always gets two lines' room) so every card lines up.
const CARD =
  "flex h-40 w-28 shrink-0 flex-col items-center gap-2 rounded-2xl border border-border bg-card p-3 md:h-44 md:w-32";
const LOGO = "flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl md:size-20";
const NAME = "line-clamp-2 min-h-[2.5em] w-full text-center text-xs font-semibold leading-tight md:text-[13px]";

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
        <Link href="/stores" className="text-sm font-medium text-primary hover:underline">
          {t("home.allProducts.viewAll")}
        </Link>
      </div>
      {/* Extra room (offset by negative margins) so the hover zoom and shadow
          aren't clipped by the scrolling row. */}
      <div className="no-scrollbar -mx-4 -my-3 flex gap-3 overflow-x-auto px-4 py-3 sm:-mx-3 sm:px-3">
        {loading &&
          Array.from({ length: SKELETON_TILES }, (_, i) => (
            <div key={i} aria-hidden className={CARD}>
              <div className={LOGO}>
                <div className="size-full animate-pulse rounded-md bg-muted" />
              </div>
              <div className="h-3 w-16 animate-pulse rounded-full bg-muted" />
              <div className="h-2.5 w-10 animate-pulse rounded-full bg-muted" />
            </div>
          ))}
        {!loading &&
          stores.map((store) => (
            <Link
              key={store.id}
              href={storeHref(store.id, "/")}
              title={store.name}
              className={`group ${CARD} transition duration-300 ease-out hover:-translate-y-1 hover:border-primary/40 hover:brand-glow focus-visible:-translate-y-1 focus-visible:border-primary/40 focus-visible:brand-glow focus-visible:outline-none`}
            >
              <span className={LOGO}>
                <StoreAvatar
                  name={store.name}
                  src={fileUrl(store.logo, "thumbnail")}
                  className="size-full rounded-md bg-transparent object-contain"
                  initialsClassName="text-xl md:text-2xl"
                />
              </span>
              <span className={`${NAME} text-foreground transition-colors duration-300 group-hover:text-primary group-focus-visible:text-primary`}>
                {store.name}
              </span>
              <span className="-mt-1 text-[11px] text-muted-foreground">
                {t("stores.productCount", { count: store.productCount })}
              </span>
            </Link>
          ))}
      </div>
    </section>
  );
}
