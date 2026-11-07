"use client";

import ProductList from "@/components/home/ProductList";
import ProductListSkeleton from "@/components/home/ProductListSkeleton";
import { Button } from "@/components/ui/button";
import StoreAvatar from "@/components/ui/store-avatar";
import { fileUrl } from "@/lib/api/files";
import { getProducts } from "@/lib/api/products";
import { getStores, tierRank, type Store, type StoreTier } from "@/lib/api/stores";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { byNewest, cn } from "@/lib/utils";
import type { Product } from "@/types/product";
import { Crown } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const PAGE_SIZE = 40;
const SKELETON_TILES = 12;

const TIER_BADGE: Record<Exclude<StoreTier, "normal">, string> = {
  gold: "bg-gradient-to-r from-amber-300 to-yellow-500 text-amber-950",
  silver: "bg-gradient-to-r from-slate-200 to-slate-400 text-slate-900",
  bronze: "bg-gradient-to-r from-orange-300 to-amber-700 text-orange-950",
};

const TIER_RING: Record<StoreTier, string> = {
  gold: "border-amber-400",
  silver: "border-slate-300",
  bronze: "border-orange-300",
  normal: "border-border",
};

function TierBadge({ tier }: { tier: StoreTier }) {
  const { t } = useLanguage();
  if (tier === "normal") return null;
  return (
    <span
      className={cn(
        "absolute -top-2 left-1/2 inline-flex -translate-x-1/2 items-center gap-0.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide shadow-sm",
        TIER_BADGE[tier]
      )}
    >
      <Crown className="size-3" aria-hidden />
      {t(`stores.tier.${tier}`)}
    </span>
  );
}

/**
 * Every store of the shop as a grid (highest tier first), then their
 * products: gold stores' first, then silver, bronze and the rest, newest
 * first within a tier.
 */
export default function StoresPage() {
  const { t } = useLanguage();
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [storesLoading, setStoresLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [shown, setShown] = useState(PAGE_SIZE);

  useEffect(() => {
    let cancelled = false;
    getStores()
      .then((rows) => !cancelled && setStores(rows))
      .catch(() => !cancelled && setStores([]))
      .finally(() => !cancelled && setStoresLoading(false));
    getProducts()
      .then((rows) => !cancelled && setProducts(rows))
      .catch(() => !cancelled && setProducts([]))
      .finally(() => !cancelled && setProductsLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // Products carry their store's name, not its tier: look it up by name.
  const sorted = useMemo(() => {
    const rankOf = new Map(stores.map((s) => [s.name, tierRank(s.tier)]));
    const rank = (p: Product) => (p.brand ? rankOf.get(p.brand) ?? 3 : 3);
    return [...products].sort((a, b) => rank(a) - rank(b) || byNewest(a, b));
  }, [products, stores]);

  const loading = storesLoading || productsLoading;

  return (
    <div className="container mx-auto space-y-10 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <section aria-busy={storesLoading}>
        <h1 className="mb-5 text-2xl font-bold text-foreground">
          {t("stores.title")}{" "}
          {!storesLoading && (
            <span className="text-base font-normal text-muted-foreground">
              {t("stores.count", { count: stores.length })}
            </span>
          )}
        </h1>

        <div className="grid grid-cols-3 gap-3 pt-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
          {storesLoading &&
            Array.from({ length: SKELETON_TILES }, (_, i) => (
              <div
                key={i}
                aria-hidden
                className="flex flex-col items-center gap-2.5 rounded-2xl border border-border bg-card p-3"
              >
                <div className="size-16 animate-pulse rounded-xl bg-muted md:size-20" />
                <div className="h-3 w-16 animate-pulse rounded-full bg-muted" />
              </div>
            ))}
          {stores.map((store) => (
            <Link
              key={store.id}
              href={`/search?store=${encodeURIComponent(store.name)}`}
              className={cn(
                "group relative flex flex-col items-center gap-2 rounded-2xl border-2 bg-card p-3 transition duration-300 ease-out hover:-translate-y-1 hover:brand-glow focus-visible:-translate-y-1 focus-visible:brand-glow focus-visible:outline-none",
                TIER_RING[store.tier] ?? TIER_RING.normal
              )}
            >
              <TierBadge tier={store.tier} />
              <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl md:size-20">
                <StoreAvatar
                  name={store.name}
                  src={fileUrl(store.logo, "grid")}
                  className="size-full rounded-md bg-transparent object-contain"
                  initialsClassName="text-xl md:text-2xl"
                />
              </span>
              <span className="line-clamp-2 min-h-[2.5em] w-full text-center text-xs font-semibold leading-tight text-foreground transition-colors group-hover:text-primary md:text-[13px]">
                {store.name}
              </span>
              <span className="-mt-1 text-[11px] text-muted-foreground">
                {t("stores.productCount", { count: store.productCount })}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section aria-busy={loading}>
        <div className="mb-4">
          <h2 className="text-2xl font-semibold text-foreground">{t("stores.products")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("stores.productsSub")}</p>
        </div>
        {loading ? <ProductListSkeleton /> : <ProductList products={sorted.slice(0, shown)} />}
        {!loading && sorted.length > shown && (
          <div className="mt-8 flex justify-center">
            <Button
              variant="outline"
              size="lg"
              className="min-w-48"
              onClick={() => setShown((n) => n + PAGE_SIZE)}
            >
              {t("home.recommended.more")}
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
