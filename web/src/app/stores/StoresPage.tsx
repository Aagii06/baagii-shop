"use client";

import ProductList from "@/components/home/ProductList";
import FilterSidebar, {
  type SearchFilters,
} from "@/components/search/FilterSidebar";
import MobileFilterDrawer from "@/components/search/MobileFilterDrawer";
import { useCategories } from "@/lib/categories/CategoriesProvider";
import { findCategoryById, subtreeIds } from "@/lib/categories";
import ProductListSkeleton from "@/components/home/ProductListSkeleton";
import { Button } from "@/components/ui/button";
import StoreAvatar from "@/components/ui/store-avatar";
import { fileUrl } from "@/lib/api/files";
import { getProducts } from "@/lib/api/products";
import {
  getStores,
  storeHref,
  tierRank,
  type Store,
  type StoreTier,
} from "@/lib/api/stores";
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
        TIER_BADGE[tier],
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
  const { categories } = useCategories();
  // Sidebar filters over the products (category, store, price), like the search page's.
  // `priceRange` null = the whole range.
  const [filterCats, setFilterCats] = useState<number[]>([]);
  const [filterStores, setFilterStores] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);

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

  const loading = storesLoading || productsLoading;

  const priceBounds = useMemo<[number, number]>(() => {
    if (products.length === 0) return [0, 0];
    const prices = products.map((p) => p.price);
    return [
      Math.floor(Math.min(...prices) / 1000) * 1000,
      Math.ceil(Math.max(...prices) / 1000) * 1000,
    ];
  }, [products]);

  // Every store with its product count and logo; only categories that have products.
  const filterCounts = useMemo(() => {
    const brand: Record<string, number> = {};
    const brandLogo: Record<string, string | undefined> = {};
    for (const s of stores) {
      brand[s.name] = 0;
      brandLogo[s.name] = s.logo ?? undefined;
    }
    for (const p of products) {
      if (p.brand) brand[p.brand] = (brand[p.brand] ?? 0) + 1;
    }
    const categoryIds = [
      ...new Set(products.flatMap((p) => (p.categoryId ? [p.categoryId] : []))),
    ];
    return { brand, brandLogo, categoryIds, loading };
  }, [stores, products, loading]);

  const filters: SearchFilters = {
    categories: filterCats,
    brands: filterStores,
    priceRange: priceRange ?? priceBounds,
  };
  const setFilters = (next: SearchFilters) => {
    setFilterCats(next.categories);
    setFilterStores(next.brands);
    const [lo, hi] = next.priceRange;
    setPriceRange(
      lo === priceBounds[0] && hi === priceBounds[1] ? null : next.priceRange,
    );
    setShown(PAGE_SIZE);
  };
  const activeFilters =
    filterCats.length + filterStores.length + (priceRange ? 1 : 0);

  // Filtered, then higher-tier stores' products first. Products carry their
  // store's name, not its tier: look it up by name.
  const sorted = useMemo(() => {
    // A picked category counts with all its subcategories.
    const catIds = new Set(
      filterCats.flatMap((id) => {
        const category = findCategoryById(categories, id);
        return category ? subtreeIds(category) : [id];
      }),
    );
    const rankOf = new Map(stores.map((s) => [s.name, tierRank(s.tier)]));
    const rank = (p: Product) => (p.brand ? (rankOf.get(p.brand) ?? 3) : 3);
    return products
      .filter(
        (p) =>
          (catIds.size === 0 ||
            (p.categoryId !== undefined && catIds.has(p.categoryId))) &&
          (filterStores.length === 0 ||
            (p.brand !== undefined && filterStores.includes(p.brand))) &&
          (!priceRange ||
            (p.price >= priceRange[0] && p.price <= priceRange[1])),
      )
      .sort((a, b) => rank(a) - rank(b) || byNewest(a, b));
  }, [products, stores, filterCats, filterStores, priceRange, categories]);

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
              href={storeHref(store.id, "/stores")}
              className={cn(
                "group relative flex flex-col items-center gap-2 rounded-2xl border-2 bg-card p-3 transition duration-300 ease-out hover:-translate-y-1 hover:brand-glow focus-visible:-translate-y-1 focus-visible:brand-glow focus-visible:outline-none",
                TIER_RING[store.tier] ?? TIER_RING.normal,
              )}
            >
              <TierBadge tier={store.tier} />
              <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl md:size-20">
                <StoreAvatar
                  name={store.name}
                  src={fileUrl(store.logo, "thumbnail")}
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
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">
              {t("stores.products")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("stores.productsSub")}
            </p>
          </div>
          <MobileFilterDrawer
            filters={filters}
            onChange={setFilters}
            priceBounds={priceBounds}
            counts={filterCounts}
            activeCount={activeFilters}
          />
        </div>
        <div className="flex flex-col gap-6 lg:flex-row">
          <FilterSidebar
            filters={filters}
            onChange={setFilters}
            priceBounds={priceBounds}
            counts={filterCounts}
          />
          <div className="min-w-0 flex-1">
            {loading ? (
              <ProductListSkeleton />
            ) : sorted.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
                {t("store.noMatch")}
              </div>
            ) : (
              <ProductList products={sorted.slice(0, shown)} />
            )}
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
          </div>
        </div>
      </section>
    </div>
  );
}
