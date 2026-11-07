"use client";

import ProductList from "@/components/home/ProductList";
import ProductListSkeleton from "@/components/home/ProductListSkeleton";
import StoreTiles from "@/components/search/StoreTiles";
import FilterSidebar, {
  type SearchFilters,
} from "@/components/search/FilterSidebar";
import MobileFilterDrawer from "@/components/search/MobileFilterDrawer";
import SortTabs, { type SortOption } from "@/components/search/SortTabs";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useCategories } from "@/lib/categories/CategoriesProvider";
import {
  findCategory,
  findCategoryById,
  subtreeIds,
} from "@/lib/categories";
import { getProducts } from "@/lib/api/products";
import { getStores, type Store } from "@/lib/api/stores";
import { byNewest } from "@/lib/utils";
import type { Product } from "@/types/product";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";

const PAGE_SIZE = 20;
// Scrolling to the end loads the next PAGE_SIZE on its own this many times;
// past that a "Цааш үзэх" button takes over so the footer stays reachable.
const AUTO_PAGES = 3;
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
  const router = useRouter();
  const initialCategory = searchParams.get("category");
  const initialSale = searchParams.get("sale") === "1";
  const initialSort = searchParams.get("sort");
  const query = searchParams.get("q") ?? "";
  const initialStore = searchParams.get("store") ?? "";

  const [filters, setFilters] = useState<SearchFilters>({
    categories: [],
    brands: [],
    priceRange: DEFAULT_PRICE_BOUNDS,
  });
  const [saleOnly, setSaleOnly] = useState(initialSale);
  const [sort, setSort] = useState<SortOption>(
    initialSort === "new" ? "new" : "discount"
  );
  const [page, setPage] = useState(1);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  // Every store of the shop, so the store tiles and filter list show stores
  // with no products (or none in these results) too.
  const [allStores, setAllStores] = useState<Store[]>([]);

  useEffect(() => {
    let cancelled = false;
    getStores()
      .then((rows) => !cancelled && setAllStores(rows))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

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
      brands: initialStore ? [initialStore] : [],
    }));
    setSaleOnly(initialSale);
    setPage(1);
  }, [resolvedInitialKey, initialSale, query, initialStore]);

  // Category and text search are filtered server-side by the product API;
  // everything else (store, price, sort) is applied client-side
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

  const priceBounds = useMemo(() => computePriceBounds(products), [products]);

  const counts = useMemo(() => {
    const brand: Record<string, number> = {};
    const brandLogo: Record<string, string | undefined> = {};
    for (const s of allStores) {
      brand[s.name] = 0;
      brandLogo[s.name] = s.logo ?? undefined;
    }
    for (const p of products) {
      if (!p.brand) continue;
      brand[p.brand] = (brand[p.brand] ?? 0) + 1;
      brandLogo[p.brand] ??= p.brandLogo;
    }
    return { brand, brandLogo };
  }, [products, allStores]);

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
    result = result.filter(
      (p) =>
        p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]
    );

    switch (sort) {
      case "new":
        result.sort(byNewest);
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
  }, [products, saleOnly, filters.brands, filters.priceRange, sort]);

  // Start over from the first PAGE_SIZE whenever the list itself changes.
  useEffect(() => {
    setPage(1);
  }, [saleOnly, filters.brands, filters.priceRange, sort]);

  const visible = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = visible.length < filtered.length;
  const autoLoad = hasMore && page < AUTO_PAGES;

  // Infinite scroll: a marker under the list loads the next page once it
  // comes within 400px of the viewport.
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || loading || !autoLoad) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setPage((p) => p + 1);
      },
      { rootMargin: "400px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loading, autoLoad, page]);

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

  // A store tile shows that store's whole catalog: every other filter
  // (search text, category, sale, price) is cleared. Tapping the picked
  // store again goes back to all products.
  const selectStore = (store: string | undefined) => {
    setFilters({ categories: [], brands: store ? [store] : [], priceRange: priceBounds });
    setSaleOnly(false);
    router.push(store ? `/search?store=${encodeURIComponent(store)}` : "/search", {
      scroll: false,
    });
  };

  const breadcrumbLabel = query
    ? `«${query}»`
    : activeCategory
    ? activeCategory.name
    : saleOnly
    ? t("search.breadcrumb.sale")
    : t("search.breadcrumb.allProducts");

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="mb-6">
        <StoreTiles
          counts={counts}
          selected={filters.brands.length === 1 ? filters.brands[0] : undefined}
          onSelect={selectStore}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {breadcrumbLabel}{" "}
            <span className="text-base font-normal text-muted-foreground">
              {t("search.resultsCount", { count: filtered.length })}
            </span>
          </h1>
        </div>
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

          {loading ? (
            <ProductListSkeleton count={PAGE_SIZE} />
          ) : (
            <ProductList products={visible} />
          )}

          {!loading && autoLoad && <div ref={sentinelRef} aria-hidden className="h-px" />}
          {!loading && hasMore && !autoLoad && (
            <div className="flex flex-col items-center gap-2 pt-4">
              <p className="text-sm text-muted-foreground">
                {t("search.shown", { shown: visible.length, total: filtered.length })}
              </p>
              <Button
                variant="outline"
                size="lg"
                className="min-w-48"
                onClick={() => setPage((p) => p + 1)}
              >
                {t("search.loadMore")}
              </Button>
            </div>
          )}
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
