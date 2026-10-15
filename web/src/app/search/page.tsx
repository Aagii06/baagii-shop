"use client";

import ProductList from "@/components/home/ProductList";
import FilterSidebar, {
  type SearchFilters,
} from "@/components/search/FilterSidebar";
import MobileFilterDrawer from "@/components/search/MobileFilterDrawer";
import Pagination from "@/components/search/Pagination";
import SortTabs, { type SortOption } from "@/components/search/SortTabs";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useCategories } from "@/lib/categories/CategoriesProvider";
import {
  findCategory,
  findCategoryById,
  flattenCategories,
  subtreeIds,
} from "@/lib/categories";
import { getProducts } from "@/lib/api/products";
import type { Product } from "@/types/product";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

const PAGE_SIZE = 12;
const DEFAULT_PRICE_BOUNDS: [number, number] = [0, 10_000_000];

// The product API filters by exact category id, so a category with
// subcategories expands to itself plus every category beneath it.
function resolveCategoryIds(
  list: ReturnType<typeof useCategories>["categories"],
  key: string | null
): number[] {
  const cat = findCategory(list, key);
  return cat ? subtreeIds(cat) : [];
}

function discountPercent(p: Product): number {
  return p.originalPrice && p.originalPrice > p.price
    ? (p.originalPrice - p.price) / p.originalPrice
    : 0;
}

function computePriceBounds(products: Product[]): [number, number] {
  if (products.length === 0) return DEFAULT_PRICE_BOUNDS;
  const prices = products.map((p) => p.price);
  return [
    Math.floor(Math.min(...prices) / 1000) * 1000,
    Math.ceil(Math.max(...prices) / 1000) * 1000,
  ];
}

function SearchContent() {
  const { t } = useLanguage();
  const { categories } = useCategories();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category");
  const initialSale = searchParams.get("sale") === "1";
  const initialSort = searchParams.get("sort");
  const query = searchParams.get("q") ?? "";

  const [filters, setFilters] = useState<SearchFilters>({
    categories: [],
    brands: [],
    freeDeliveryOnly: false,
    priceRange: DEFAULT_PRICE_BOUNDS,
  });
  const [saleOnly, setSaleOnly] = useState(initialSale);
  const [sort, setSort] = useState<SortOption>(
    initialSort === "new" ? "new" : "discount"
  );
  const [page, setPage] = useState(1);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryCounts, setCategoryCounts] = useState<Record<number, number>>({});

  // A comma-joined, sorted list of the category ids currently in play. A
  // primitive key keeps the fetch effect from re-firing on array identity
  // changes (which would loop: the effect itself calls setFilters).
  const activeCategoryKey = useMemo(
    () =>
      Array.from(new Set(filters.categories))
        .sort((a, b) => a - b)
        .join(","),
    [filters.categories]
  );

  const resolvedInitialKey = resolveCategoryIds(categories, initialCategory)
    .sort((a, b) => a - b)
    .join(",");

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      categories: resolvedInitialKey ? resolvedInitialKey.split(",").map(Number) : [],
    }));
    setSaleOnly(initialSale);
    setPage(1);
  }, [resolvedInitialKey, initialSale, query]);

  // Category and text search are filtered server-side by the product API;
  // everything else (brand, price, delivery, sort) is applied client-side
  // below. The API filters by one category at a time, so multiple selected
  // categories mean one request each, merged and de-duplicated.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const ids = activeCategoryKey
      ? activeCategoryKey.split(",").map(Number)
      : [];

    const request =
      ids.length === 0
        ? getProducts({ search: query || undefined })
        : Promise.all(
            ids.map((id) =>
              getProducts({ categoryId: id, search: query || undefined })
            )
          ).then((lists) => {
            const seen = new Set<number>();
            return lists.flat().filter((p) => {
              if (seen.has(p.id)) return false;
              seen.add(p.id);
              return true;
            });
          });

    request
      .then((result) => {
        if (cancelled) return;
        setProducts(result);
        setPage(1);
        setFilters((prev) => ({
          ...prev,
          priceRange: computePriceBounds(result),
        }));
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeCategoryKey, query]);

  // Per-category counts need a dedicated call each since the API only
  // filters by a single category at a time. The sidebar sums them up
  // for parent groups.
  useEffect(() => {
    let cancelled = false;
    Promise.all(
      flattenCategories(categories).map((c) =>
        getProducts({ categoryId: c.id, search: query || undefined })
          .then((list): [number, number] => [c.id, list.length])
          .catch((): [number, number] => [c.id, 0])
      )
    ).then((entries) => {
      if (!cancelled) setCategoryCounts(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
    };
  }, [query, categories]);

  const priceBounds = useMemo(() => computePriceBounds(products), [products]);

  const counts = useMemo(() => {
    const brand: Record<string, number> = {};
    let freeDelivery = 0;
    for (const p of products) {
      if (p.brand) brand[p.brand] = (brand[p.brand] ?? 0) + 1;
      if (p.freeDelivery) freeDelivery += 1;
    }
    return { category: categoryCounts, brand, freeDelivery };
  }, [products, categoryCounts]);

  const filtered = useMemo(() => {
    let result = products.slice();

    if (saleOnly) {
      result = result.filter(
        (p) => p.originalPrice && p.originalPrice > p.price
      );
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
        result.sort((a, b) => discountPercent(b) - discountPercent(a));
    }

    return result;
  }, [products, saleOnly, filters.brands, filters.freeDeliveryOnly, filters.priceRange, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const activeCategory =
    findCategory(categories, initialCategory ?? undefined) ??
    (filters.categories.length === 1
      ? findCategoryById(categories, filters.categories[0])
      : undefined);
  const priceChanged =
    filters.priceRange[0] !== priceBounds[0] ||
    filters.priceRange[1] !== priceBounds[1];

  const chips: { key: string; label: string; onRemove: () => void }[] = [
    ...filters.categories.map((id) => {
      const cat = findCategoryById(categories, id);
      return {
        key: `cat-${id}`,
        label: cat ? cat.name : String(id),
        onRemove: () =>
          setFilters((f) => ({
            ...f,
            categories: f.categories.filter((c) => c !== id),
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
              setFilters((f) => ({ ...f, priceRange: priceBounds })),
          },
        ]
      : []),
  ];

  const breadcrumbLabel = query
    ? `«${query}»`
    : activeCategory
    ? activeCategory.name
    : saleOnly
    ? t("search.breadcrumb.sale")
    : t("search.breadcrumb.allProducts");

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
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
          priceBounds={priceBounds}
          counts={counts}
        />

        <div className="flex-1 min-w-0 space-y-5">
          <div className="flex items-center gap-3 justify-end">
            <SortTabs value={sort} onChange={setSort} />
            <MobileFilterDrawer
              filters={filters}
              onChange={setFilters}
              priceBounds={priceBounds}
              counts={counts}
              activeCount={chips.length}
            />
          </div>

          <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
            <ProductList products={paged} />
          </div>

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
