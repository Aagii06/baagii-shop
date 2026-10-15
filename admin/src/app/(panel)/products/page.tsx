"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { tr } from "@/lib/i18n/translations";
import ChipTabs from "@/components/common/ChipTabs";
import { EmptyState, ErrorState } from "@/components/common/States";
import Thumb from "@/components/common/Thumb";
import PageHeader from "@/components/layout/PageHeader";
import ProductListSkeleton from "@/components/products/ProductListSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCategoryTree, type Category } from "@/lib/api/categories";
import { getPostsPage, isPublished, LOW_STOCK_THRESHOLD, type Post } from "@/lib/api/posts";
import { useApi } from "@/lib/useApi";
import { cn, formatMNT, formatQty, toNumber } from "@/lib/utils";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const PAGE_SIZE = 20;

/** Category id → its name, and → the id of its top-level ancestor. */
function indexCategories(tree: Category[]) {
  const name = new Map<number, string>();
  const root = new Map<number, number>();
  const walk = (list: Category[], rootId?: number) =>
    list.forEach((c) => {
      name.set(c.id, c.name);
      root.set(c.id, rootId ?? c.id);
      walk(c.children, rootId ?? c.id);
    });
  walk(tree);
  return { name, root };
}

function stockLine(post: Post) {
  if (!isPublished(post)) return { text: tr("products.draft"), tone: "text-muted-foreground/70" };
  const remain = toNumber(post.remain);
  return {
    text: tr("products.stock", { qty: formatQty(remain) }),
    tone: remain <= LOW_STOCK_THRESHOLD ? "text-destructive" : "text-muted-foreground",
  };
}

export default function ProductsPage() {
  const { t } = useLanguage();
  const { data: tree } = useApi(getCategoryTree);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [rootId, setRootId] = useState("all");

  const categories = useMemo(() => indexCategories(tree ?? []), [tree]);

  // The search waits for a pause in typing before it asks the backend.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // A chip's category plus everything below it.
  const categoryIds = useMemo(() => {
    if (rootId === "all") return undefined;
    return [...categories.root].filter(([, root]) => root === Number(rootId)).map(([id]) => id);
  }, [categories, rootId]);

  // Pages load as the list is scrolled — like a social feed. `key` ties the
  // loaded rows to the search/category they were fetched for, so a stale
  // page is treated as "loading" until the new one lands.
  const key = `${debouncedQuery}|${rootId}`;
  const [page, setPage] = useState<{ key: string; rows: Post[]; count: number; error?: Error } | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreFailed, setMoreFailed] = useState(false);
  const [version, setVersion] = useState(0);
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    getPostsPage({ skip: 0, take: PAGE_SIZE, query: debouncedQuery, categoryIds }).then(
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
  }, [key, version, debouncedQuery, categoryIds]);

  const ready = page?.key === key;
  const rows = ready ? page.rows : [];
  const hasMore = ready && !page.error && page.rows.length < page.count;

  const loadMore = useCallback(async () => {
    if (!page || page.key !== key || loadingMore || page.rows.length >= page.count) return;
    setLoadingMore(true);
    setMoreFailed(false);
    try {
      const result = await getPostsPage({
        skip: page.rows.length,
        take: PAGE_SIZE,
        query: debouncedQuery,
        categoryIds,
      });
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
  }, [page, key, loadingMore, debouncedQuery, categoryIds]);

  // Loads the next page once the bottom of the list nears the screen. A
  // failed page stops the loop; "try again" retries it.
  useEffect(() => {
    const node = sentinel.current;
    if (!node || !hasMore || moreFailed) return;
    const observer = new IntersectionObserver((entries) => entries[0]?.isIntersecting && loadMore(), {
      rootMargin: "600px 0px",
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, moreFailed, loadMore]);

  return (
    <>
      <PageHeader
        title={t("products.title")}
        aside={
          <Button asChild size="sm" className="px-4">
            <Link href="/products/new">
              <Plus />
              {t("common.add")}
            </Link>
          </Button>
        }
      >
        <Input
          type="search"
          placeholder={t("products.search")}
          aria-label={t("products.search")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {tree && tree.length > 0 && (
          <ChipTabs
            label={t("common.category")}
            value={rootId}
            options={[
              { value: "all", label: t("common.all") },
              ...tree.map((c) => ({ value: String(c.id), label: c.name })),
            ]}
            onChange={setRootId}
          />
        )}
      </PageHeader>

      {ready && page.error ? (
        <div className="pt-4">
          <ErrorState error={page.error} onRetry={() => setVersion((v) => v + 1)} />
        </div>
      ) : !ready ? (
        <ProductListSkeleton />
      ) : rows.length === 0 ? (
        <div className="pt-4">
          <EmptyState title={t("products.notFound")} description={t("products.notFoundHint")} />
        </div>
      ) : (
        <>
          <ul className="divide-y divide-border border-b border-border">
            {rows.map((post) => {
              const stock = stockLine(post);
              const category = post.categoryId != null ? categories.name.get(post.categoryId) : undefined;
              return (
                <li key={post.id}>
                  <Link
                    href={`/products/${post.id}`}
                    className="-mx-4 flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/60"
                  >
                    <Thumb id={post.images?.[0]} size={52} className="rounded-xl" />
                    <span className="min-w-0 grow">
                      <span className="block truncate text-[15px] font-semibold">
                        {post.name}
                      </span>
                      <span className="mt-0.5 block truncate font-mono text-xs text-muted-foreground">
                        {category}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
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
                <Button variant="outline" className="mt-4 w-full" onClick={loadMore}>
                  {t("common.retry")}
                </Button>
              ) : (
                <ProductListSkeleton rows={3} className="border-b-0" />
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}
