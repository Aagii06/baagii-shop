"use client";

import { atLeast, LOAD_MORE_MARGIN } from "@/components/common/LoadMore";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { tr } from "@/lib/i18n/translations";
import { EmptyState, ErrorState } from "@/components/common/States";
import StoreLogo from "@/components/common/StoreLogo";
import Thumb from "@/components/common/Thumb";
import PageHeader from "@/components/layout/PageHeader";
import CategoryFilter from "@/components/products/CategoryFilter";
import StoreFilter from "@/components/products/StoreFilter";
import ProductListSkeleton from "@/components/products/ProductListSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth/AuthProvider";
import { getCategoryTree, type Category } from "@/lib/api/categories";
import { getStores } from "@/lib/api/stores";
import { getPostsPage, isPublished, LOW_STOCK_THRESHOLD, type Post } from "@/lib/api/posts";
import { useApi } from "@/lib/useApi";
import { cn, formatDate, formatMNT, formatQty, toNumber } from "@/lib/utils";
import { Plus, Store } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const PAGE_SIZE = 20;

/** Category id → its name. */
function indexCategories(tree: Category[]) {
  const name = new Map<number, string>();
  const walk = (list: Category[]) =>
    list.forEach((c) => {
      name.set(c.id, c.name);
      walk(c.children);
    });
  walk(tree);
  return { name };
}

function stockLine(post: Post) {
  if (!isPublished(post)) return { text: tr("products.draft"), tone: "text-muted-foreground/70" };
  const remain = toNumber(post.remain);
  return {
    text: tr("products.stock", { qty: formatQty(remain) }),
    tone: remain <= LOW_STOCK_THRESHOLD ? "text-destructive" : "text-muted-foreground",
  };
}

/** A filter pill's shape while its options load, so the header doesn't jump. */
function FilterSkeleton() {
  return (
    <div
      aria-hidden
      className="flex h-12 w-full animate-pulse items-center justify-between rounded-full border border-input bg-white px-5"
    >
      <span className="h-3.5 w-32 rounded-full bg-muted" />
      <span className="size-4 rounded-full bg-muted" />
    </div>
  );
}

export default function ProductsPage() {
  const { t } = useLanguage();
  const { data: tree, error: treeError } = useApi(getCategoryTree);
  // Only an admin sees every store's products; a shopper's list is their own store.
  const { role } = useAuth();
  const { data: stores, error: storesError } = useApi(getStores);
  // Ticked stores; empty is all of them.
  const [pickedStores, setPickedStores] = useState<number[]>([]);
  // Store id → logo, for the badge on each product's image.
  const storeLogo = useMemo(() => new Map((stores ?? []).map((s) => [s.id, s.logo])), [stores]);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  // Ticked categories (each with everything below it); empty is all of them.
  const [picked, setPicked] = useState<number[]>([]);

  const categories = useMemo(() => indexCategories(tree ?? []), [tree]);

  // The search waits for a pause in typing before it asks the backend.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const categoryIds = picked.length > 0 ? picked : undefined;
  const storeIds = pickedStores.length > 0 ? pickedStores : undefined;

  // Pages load as the list is scrolled — like a social feed. `key` ties the
  // loaded rows to the search/category they were fetched for, so a stale
  // page is treated as "loading" until the new one lands.
  const key = `${debouncedQuery}|${picked.join(",")}|${pickedStores.join(",")}`;
  const [page, setPage] = useState<{ key: string; rows: Post[]; count: number; error?: Error } | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreFailed, setMoreFailed] = useState(false);
  const [version, setVersion] = useState(0);
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    getPostsPage({ skip: 0, take: PAGE_SIZE, query: debouncedQuery, categoryIds, storeIds }).then(
      (result) => {
        if (cancelled) return;
        setMoreFailed(false);
        setPage({ key, ...result });
      },
      (error: unknown) => {
        if (cancelled) return;
        setPage({ key, rows: [], count: 0, error: error instanceof Error ? error : new Error(String(error)) });
      }
    );
    return () => {
      cancelled = true;
    };
  }, [key, version, debouncedQuery, categoryIds, storeIds]);

  const ready = page?.key === key;
  const rows = ready ? page.rows : [];
  const hasMore = ready && !page.error && page.rows.length < page.count;

  const loadMore = useCallback(async () => {
    if (!page || page.key !== key || loadingMore || page.rows.length >= page.count) return;
    setLoadingMore(true);
    setMoreFailed(false);
    try {
      const result = await atLeast(getPostsPage({
        skip: page.rows.length,
        take: PAGE_SIZE,
        query: debouncedQuery,
        categoryIds,
        storeIds,
      }));
      setPage((prev) =>
        prev && prev.key === key
          ? {
              ...prev,
              count: result.count,
              rows: [...prev.rows, ...result.rows.filter((r) => !prev.rows.some((p) => p.id === r.id))],
            }
          : prev
      );
    } catch {
      setMoreFailed(true);
    } finally {
      setLoadingMore(false);
    }
  }, [page, key, loadingMore, debouncedQuery, categoryIds, storeIds]);

  // Loads the next page once the bottom of the list nears the screen. A
  // failed page stops the loop; "try again" retries it.
  useEffect(() => {
    const node = sentinel.current;
    if (!node || !hasMore || moreFailed) return;
    const observer = new IntersectionObserver((entries) => entries[0]?.isIntersecting && loadMore(), {
      rootMargin: LOAD_MORE_MARGIN,
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, moreFailed, loadMore]);

  return (
    <>
      <PageHeader
        title={t("products.title")}
        count={ready && !page.error ? page.count : undefined}
        aside={
          <Button asChild size="sm" className="px-4">
            <Link href="/products/new">
              <Plus />
              {t("common.add")}
            </Link>
          </Button>
        }
      >
        {role === "admin" &&
          (stores ? (
            stores.length > 0 && <StoreFilter stores={stores} value={pickedStores} onChange={setPickedStores} />
          ) : (
            !storesError && <FilterSkeleton />
          ))}
        <Input
          type="search"
          placeholder={t("products.search")}
          aria-label={t("products.search")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {tree ? (
          tree.length > 0 && <CategoryFilter tree={tree} value={picked} onChange={setPicked} />
        ) : (
          !treeError && <FilterSkeleton />
        )}
      </PageHeader>

      {ready && page.error ? (
        <div className="pt-4">
          <ErrorState error={page.error} onRetry={() => setVersion((v) => v + 1)} />
        </div>
      ) : !ready ? (
        <ProductListSkeleton flush />
      ) : rows.length === 0 ? (
        <div className="pt-4">
          <EmptyState title={t("products.notFound")} description={t("products.notFoundHint")} />
        </div>
      ) : (
        <>
          <ul className="-mx-4 divide-y divide-border border-b border-border bg-white">
            {rows.map((post) => {
              const stock = stockLine(post);
              const category = post.categoryId != null ? categories.name.get(post.categoryId) : undefined;
              const logo = post.storeId != null ? storeLogo.get(post.storeId) : undefined;
              return (
                <li key={post.id}>
                  <Link
                    href={`/products/${post.id}`}
                    className="flex items-stretch bg-white pr-4 transition-colors hover:bg-muted/50"
                  >
                    {/* Photo flush to the row's left edge, full row height (like AjrugShop);
                        the store's logo sits on its corner, its name on its own line. */}
                    <span className="relative flex w-24 shrink-0 self-stretch">
                      <Thumb id={post.images?.[0]} variant="thumbnail" className="min-h-[84px] w-24 shrink-0 self-stretch rounded-none border-0" />
                      {post.storeName && (
                        // Top-left corner, flush and square (no rounding).
                        <span title={post.storeName} className="absolute left-0 top-0">
                          {/* No logo, or its file is missing: the store's two letters. */}
                          <StoreLogo id={logo} name={post.storeName} size={28} className="rounded-none border-0" />
                        </span>
                      )}
                    </span>
                    <span className="min-w-0 grow self-center py-3 pl-3.5 pr-2">
                      <span className="block truncate text-[15px] font-semibold">
                        {post.name}
                      </span>
                      {post.storeName && (
                        <span className="mt-0.5 flex items-center gap-1 text-xs font-medium text-foreground/80">
                          <Store className="h-3 w-3 shrink-0 text-muted-foreground" />
                          <span className="truncate">{post.storeName}</span>
                        </span>
                      )}
                      {category && (
                        <span className="mt-0.5 block truncate font-mono text-xs text-muted-foreground">
                          {category}
                        </span>
                      )}
                      {post.createdAt && (
                        <span className="mt-0.5 block font-mono text-[11px] text-muted-foreground/70">
                          {formatDate(post.createdAt)}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 self-center text-right">
                      <span className="block font-mono text-sm font-bold">
                        {formatMNT(toNumber(post.price))}
                      </span>
                      <span className={cn("mt-0.5 block text-xs", stock.tone)}>{stock.text}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {hasMore && (
            <div ref={sentinel}>
              {moreFailed ? (
                <Button variant="outline" className="mt-4 w-full" loading={loadingMore} onClick={loadMore}>
                  {t("common.retry")}
                </Button>
              ) : (
                <ProductListSkeleton flush rows={3} />
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}
