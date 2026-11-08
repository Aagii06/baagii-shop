"use client";

import ProductList from "@/components/home/ProductList";
import ProductListSkeleton from "@/components/home/ProductListSkeleton";
import SortTabs, { type SortOption } from "@/components/search/SortTabs";
import { Button } from "@/components/ui/button";
import StoreAvatar from "@/components/ui/store-avatar";
import { fileUrl } from "@/lib/api/files";
import { getProducts } from "@/lib/api/products";
import { getStores, type Store } from "@/lib/api/stores";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { byNewest, cn } from "@/lib/utils";
import type { Product } from "@/types/product";
import { ArrowLeft, Crown, Store as StoreIcon } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const PAGE_SIZE = 40;

const TIER_BADGE: Record<string, string> = {
  gold: "bg-gradient-to-r from-amber-300 to-yellow-500 text-amber-950",
  silver: "bg-gradient-to-r from-slate-200 to-slate-400 text-slate-900",
  bronze: "bg-gradient-to-r from-orange-300 to-amber-700 text-orange-950",
};

function discountPercent(p: Product) {
  return p.originalPrice && p.originalPrice > p.price ? (p.originalPrice - p.price) / p.originalPrice : 0;
}

/**
 * One store's page (`/store?id=`): its header, then only its products —
 * the cards leave the store pill out, since every one is this store's.
 */
export default function StorePage() {
  const { t } = useLanguage();
  const id = Number(useSearchParams().get("id"));
  const [store, setStore] = useState<Store | null | undefined>(undefined);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortOption>("new");
  const [shown, setShown] = useState(PAGE_SIZE);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setShown(PAGE_SIZE);
    Promise.all([getStores(), getProducts()])
      .then(([stores, rows]) => {
        if (cancelled) return;
        const found = stores.find((s) => s.id === id) ?? null;
        setStore(found);
        setProducts(found ? rows.filter((p) => p.storeId === found.id) : []);
      })
      .catch(() => {
        if (!cancelled) setStore(null);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  const sorted = useMemo(() => {
    const list = products.slice();
    switch (sort) {
      case "new":
        return list.sort(byNewest);
      case "price-asc":
        return list.sort((a, b) => a.price - b.price);
      case "rating":
        return list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      default:
        return list.sort((a, b) => discountPercent(b) - discountPercent(a));
    }
  }, [products, sort]);

  const back = (
    <Link
      href="/stores"
      className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
    >
      <ArrowLeft className="h-4 w-4" />
      {t("store.back")}
    </Link>
  );

  if (!loading && !store) {
    return (
      <div className="container mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {back}
        <div className="rounded-2xl border border-border bg-card px-6 py-16 text-center">
          <StoreIcon className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <h1 className="text-xl font-bold text-foreground">{t("store.notFound")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("store.notFoundDesc")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div>
        {back}
        <section
          aria-busy={loading}
          className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 sm:p-5"
        >
          {loading || !store ? (
            <>
              <div className="size-16 shrink-0 animate-pulse rounded-xl bg-muted sm:size-20" />
              <div className="flex-1 space-y-2.5">
                <div className="h-6 w-48 animate-pulse rounded-md bg-muted" />
                <div className="h-4 w-24 animate-pulse rounded-md bg-muted" />
              </div>
            </>
          ) : (
            <>
              <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-white sm:size-20">
                <StoreAvatar
                  name={store.name}
                  src={fileUrl(store.logo, "thumbnail")}
                  className="size-full rounded-md bg-transparent object-contain"
                  initialsClassName="text-xl sm:text-2xl"
                />
              </span>
              <div className="min-w-0">
                {store.tier !== "normal" && TIER_BADGE[store.tier] && (
                  <span
                    className={cn(
                      "mb-1 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                      TIER_BADGE[store.tier]
                    )}
                  >
                    <Crown className="size-3" aria-hidden />
                    {t(`stores.tier.${store.tier}`)}
                  </span>
                )}
                <h1 className="truncate text-2xl font-bold text-foreground">{store.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {t("stores.productCount", { count: products.length })}
                </p>
              </div>
            </>
          )}
        </section>
      </div>

      <section className="space-y-5">
        <div className="flex justify-end">
          <SortTabs value={sort} onChange={setSort} />
        </div>
        {loading ? (
          <ProductListSkeleton />
        ) : sorted.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
            {t("store.empty")}
          </div>
        ) : (
          <ProductList products={sorted.slice(0, shown)} hideStore />
        )}
        {!loading && sorted.length > shown && (
          <div className="flex justify-center pt-3">
            <Button variant="outline" size="lg" className="min-w-48" onClick={() => setShown((n) => n + PAGE_SIZE)}>
              {t("home.recommended.more")}
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
