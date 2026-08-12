"use client";

import ProductList from "@/components/home/ProductList";
import FilterSidebar, {
  type SearchFilters,
} from "@/components/search/FilterSidebar";
import Pagination from "@/components/search/Pagination";
import SortTabs, { type SortOption } from "@/components/search/SortTabs";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { getCategory } from "@/lib/categories";
import productsData from "@/data/products.json";
import type { Product } from "@/types/product";
import { X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

const products = productsData as Product[];
const PAGE_SIZE = 12;

function computePriceBounds(): [number, number] {
  const prices = products.map((p) => p.price);
  return [
    Math.floor(Math.min(...prices) / 1000) * 1000,
    Math.ceil(Math.max(...prices) / 1000) * 1000,
  ];
}

const PRICE_BOUNDS = computePriceBounds();

function SearchContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category");
  const initialSale = searchParams.get("sale") === "1";
  const initialSort = searchParams.get("sort");
  const query = searchParams.get("q") ?? "";

  const [filters, setFilters] = useState<SearchFilters>({
    categories: initialCategory ? [initialCategory] : [],
    brands: [],
    freeDeliveryOnly: false,
    priceRange: PRICE_BOUNDS,
  });
  const [saleOnly, setSaleOnly] = useState(initialSale);
  const [sort, setSort] = useState<SortOption>(
    initialSort === "new" ? "new" : "popular"
  );
  const [page, setPage] = useState(1);

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      categories: initialCategory ? [initialCategory] : [],
    }));
    setSaleOnly(initialSale);
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCategory, initialSale, query]);

  const counts = useMemo(() => {
    const category: Record<string, number> = {};
    const brand: Record<string, number> = {};
    let freeDelivery = 0;
    for (const p of products) {
      category[p.category] = (category[p.category] ?? 0) + 1;
      if (p.brand) brand[p.brand] = (brand[p.brand] ?? 0) + 1;
      if (p.freeDelivery) freeDelivery += 1;
    }
    return { category, brand, freeDelivery };
  }, []);

  const filtered = useMemo(() => {
    let result = products.slice();

    if (query) {
      const q = query.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q));
    }
    if (saleOnly) {
      result = result.filter(
        (p) => p.originalPrice && p.originalPrice > p.price
      );
    }
    if (filters.categories.length > 0) {
      result = result.filter((p) => filters.categories.includes(p.category));
    }
    if (filters.brands.length > 0) {
      result = result.filter((p) => p.brand && filters.brands.includes(p.brand));
    }
    if (filters.freeDeliveryOnly) {
      result = result.filter((p) => p.freeDelivery);
    }
    result = result.filter(
      (p) =>
        p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]
    );

    switch (sort) {
      case "new":
        result.sort((a, b) => b.id - a.id);
        break;
      case "price-asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "rating":
        result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      default:
        result.sort((a, b) => (b.soldCount ?? 0) - (a.soldCount ?? 0));
    }

    return result;
  }, [query, saleOnly, filters, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const activeCategory = getCategory(filters.categories[0]);
  const priceChanged =
    filters.priceRange[0] !== PRICE_BOUNDS[0] ||
    filters.priceRange[1] !== PRICE_BOUNDS[1];

  const chips: { key: string; label: string; onRemove: () => void }[] = [
    ...filters.categories.map((slug) => {
      const cat = getCategory(slug);
      return {
        key: `cat-${slug}`,
        label: cat ? t(`category.${cat.slug}`) : slug,
        onRemove: () =>
          setFilters((f) => ({
            ...f,
            categories: f.categories.filter((c) => c !== slug),
          })),
      };
    }),
    ...filters.brands.map((brand) => ({
      key: `brand-${brand}`,
      label: brand,
      onRemove: () =>
        setFilters((f) => ({
          ...f,
          brands: f.brands.filter((b) => b !== brand),
        })),
    })),
    ...(filters.freeDeliveryOnly
      ? [
          {
            key: "free-delivery",
            label: t("search.filters.freeDelivery"),
            onRemove: () =>
              setFilters((f) => ({ ...f, freeDeliveryOnly: false })),
          },
        ]
      : []),
    ...(priceChanged
      ? [
          {
            key: "price",
            label: `${filters.priceRange[0].toLocaleString(
              "mn-MN"
            )}-${filters.priceRange[1].toLocaleString("mn-MN")}₮`,
            onRemove: () =>
              setFilters((f) => ({ ...f, priceRange: PRICE_BOUNDS })),
          },
        ]
      : []),
  ];

  const breadcrumbLabel = query
    ? `«${query}»`
    : activeCategory
    ? t(`category.${activeCategory.slug}`)
    : saleOnly
    ? t("search.breadcrumb.sale")
    : t("search.breadcrumb.allProducts");

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <nav className="text-sm text-muted-foreground mb-1">
            <Link href="/" className="hover:text-foreground">
              {t("search.breadcrumb.home")}
            </Link>{" "}
            <span className="mx-1">›</span>
            <span>{t("search.breadcrumb.search")}</span> <span className="mx-1">›</span>
            <span className="text-foreground font-medium">
              {breadcrumbLabel}
            </span>
          </nav>
          <h1 className="text-2xl font-bold text-foreground">
            {breadcrumbLabel}{" "}
            <span className="text-base font-normal text-muted-foreground">
              {t("search.resultsCount", { count: filtered.length })}
            </span>
          </h1>
        </div>
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <FilterSidebar
          filters={filters}
          onChange={setFilters}
          priceBounds={PRICE_BOUNDS}
          counts={counts}
        />

        <div className="flex-1 min-w-0 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <SortTabs value={sort} onChange={setSort} />
          </div>

          {chips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {chips.map((chip) => (
                <button
                  key={chip.key}
                  onClick={chip.onRemove}
                  className="flex items-center gap-1.5 rounded-full bg-accent text-accent-foreground text-xs font-medium pl-3 pr-2 py-1.5 hover:opacity-80 transition-opacity"
                >
                  {chip.label}
                  <X className="h-3 w-3" />
                </button>
              ))}
            </div>
          )}

          <ProductList products={paged} />

          <div className="flex justify-center pt-4">
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchContent />
    </Suspense>
  );
}
