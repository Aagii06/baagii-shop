"use client";

import ProductList from "@/components/home/ProductList";
import ProductListSkeleton from "@/components/home/ProductListSkeleton";
import SortTabs, { type SortOption } from "@/components/search/SortTabs";
import { Button } from "@/components/ui/button";
import StoreAvatar from "@/components/ui/store-avatar";
import { fileUrl } from "@/lib/api/files";
import { getProducts } from "@/lib/api/products";
import { getStore, type StoreDetail } from "@/lib/api/stores";
import { formatPhone } from "@/components/ui/phone-input";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { byNewest, cn } from "@/lib/utils";
import type { Product } from "@/types/product";
import { ArrowLeft, Crown, Mail, MapPin, Phone, Store as StoreIcon } from "lucide-react";
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
  const params = useSearchParams();
  const id = Number(params.get("id"));
  // Back to the page the store was opened from (only same-site paths), else the store list.
  const from = params.get("back");
  const backHref = from && from.startsWith("/") && !from.startsWith("//") ? from : "/stores";
  const backPath = backHref.split("?")[0];
  const backLabel =
    backPath === "/stores"
      ? t("store.back")
      : backPath === "/search"
        ? t("store.backSearch")
        : backPath === "/"
          ? t("store.backHome")
          : t("store.backOther");
  const [store, setStore] = useState<StoreDetail | null | undefined>(undefined);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortOption>("new");
  const [shown, setShown] = useState(PAGE_SIZE);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setShown(PAGE_SIZE);
    Promise.all([getStore(id), getProducts()])
      .then(([found, rows]) => {
        if (cancelled) return;
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
      href={backHref}
      className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
    >
      <ArrowLeft className="h-4 w-4" />
      {backLabel}
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
        {/* Brand-gradient banner: logo, tier, name, product count, then the store's contacts. */}
        <section
          aria-busy={loading}
          className="relative overflow-hidden rounded-2xl brand-gradient p-5 text-white shadow-lg shadow-primary/20 sm:p-7"
        >
          {/* Soft light circles for depth. */}
          <span aria-hidden className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-white/10" />
          <span aria-hidden className="pointer-events-none absolute -bottom-24 right-24 size-48 rounded-full bg-white/10" />

          <div className="relative flex items-center gap-4">
            {loading || !store ? (
              <>
                <div className="size-16 shrink-0 animate-pulse rounded-2xl bg-white/25 sm:size-20" />
                <div className="flex-1 space-y-2.5">
                  <div className="h-6 w-48 animate-pulse rounded-md bg-white/25" />
                  <div className="h-4 w-24 animate-pulse rounded-md bg-white/25" />
                </div>
              </>
            ) : (
              <>
                <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-1.5 shadow-md ring-4 ring-white/30 sm:size-20">
                  <StoreAvatar
                    name={store.name}
                    src={fileUrl(store.logo, "thumbnail")}
                    className="size-full rounded-lg bg-transparent object-contain"
                    initialsClassName="text-xl sm:text-2xl"
                  />
                </span>
                <div className="min-w-0">
                  {store.tier !== "normal" && TIER_BADGE[store.tier] && (
                    <span
                      className={cn(
                        "mb-1 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide shadow-sm",
                        TIER_BADGE[store.tier]
                      )}
                    >
                      <Crown className="size-3" aria-hidden />
                      {t(`stores.tier.${store.tier}`)}
                    </span>
                  )}
                  <h1 className="truncate text-2xl font-bold sm:text-3xl">{store.name}</h1>
                  <p className="text-sm text-white/80">{t("stores.productCount", { count: products.length })}</p>
                </div>
              </>
            )}
          </div>

          {store && (store.phones.length > 0 || store.emails.length > 0 || store.addresses.length > 0) && (
            <div className="relative mt-5 border-t border-white/20 pt-4">
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-white/70">{t("store.contact")}</p>
              <ul className="flex flex-wrap gap-2">
                {store.phones.map((phone) => (
                  <li key={`p-${phone}`}>
                    <a
                      href={`tel:${phone}`}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium backdrop-blur transition-colors hover:bg-white/25"
                    >
                      <Phone className="size-3.5" />
                      {formatPhone(phone)}
                    </a>
                  </li>
                ))}
                {store.emails.map((email) => (
                  <li key={`e-${email}`}>
                    <a
                      href={`mailto:${email}`}
                      className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium backdrop-blur transition-colors hover:bg-white/25"
                    >
                      <Mail className="size-3.5 shrink-0" />
                      <span className="truncate">{email}</span>
                    </a>
                  </li>
                ))}
                {store.addresses.map((address) => (
                  <li key={`a-${address}`} className="inline-flex max-w-full items-start gap-1.5 rounded-2xl bg-white/15 px-3 py-1.5 text-sm font-medium backdrop-blur">
                    <MapPin className="mt-0.5 size-3.5 shrink-0" />
                    <span>{address}</span>
                  </li>
                ))}
              </ul>
            </div>
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
