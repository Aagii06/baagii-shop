"use client";

import ChipTabs from "@/components/common/ChipTabs";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import Thumb from "@/components/common/Thumb";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCategoryTree, type Category } from "@/lib/api/categories";
import { getPosts, isPublished, LOW_STOCK_THRESHOLD, type Post } from "@/lib/api/posts";
import { useApi } from "@/lib/useApi";
import { cn, formatMNT, formatQty, toNumber } from "@/lib/utils";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

const PAGE_SIZE = 30;

async function loadProducts() {
  const [posts, tree] = await Promise.all([getPosts(), getCategoryTree({ attrs: false })]);
  return { posts, tree };
}

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
  if (!isPublished(post)) return { text: "Ноорог", tone: "text-muted-foreground/70" };
  const remain = toNumber(post.remain);
  return {
    text: `${formatQty(remain)} нөөц`,
    tone: remain <= LOW_STOCK_THRESHOLD ? "text-destructive" : "text-muted-foreground",
  };
}

export default function ProductsPage() {
  const { data, error, reload } = useApi(loadProducts);

  const [query, setQuery] = useState("");
  const [rootId, setRootId] = useState("all");
  const [limit, setLimit] = useState(PAGE_SIZE);

  const categories = useMemo(() => indexCategories(data?.tree ?? []), [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.posts.filter(
      (p) =>
        (rootId === "all" ||
          (p.categoryId != null && categories.root.get(p.categoryId) === Number(rootId))) &&
        (!q ||
          [p.productName, p.name, p.productCode, p.code].some((field) =>
            field?.toLowerCase().includes(q)
          ))
    );
  }, [data, categories, query, rootId]);

  const rows = filtered.slice(0, limit);

  return (
    <>
      <PageHeader
        title="Бараа"
        aside={
          <Button asChild size="sm" className="px-4">
            <Link href="/products/new">
              <Plus />
              Нэмэх
            </Link>
          </Button>
        }
      >
        <Input
          type="search"
          placeholder="Бараа хайх"
          aria-label="Бараа хайх"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setLimit(PAGE_SIZE);
          }}
        />
        {data && data.tree.length > 0 && (
          <ChipTabs
            label="Категори"
            value={rootId}
            options={[
              { value: "all", label: "Бүгд" },
              ...data.tree.map((c) => ({ value: String(c.id), label: c.name })),
            ]}
            onChange={(value) => {
              setRootId(value);
              setLimit(PAGE_SIZE);
            }}
          />
        )}
      </PageHeader>

      {error && !data ? (
        <div className="pt-4">
          <ErrorState error={error} onRetry={reload} />
        </div>
      ) : !data ? (
        <LoadingState />
      ) : rows.length === 0 ? (
        <div className="pt-4">
          <EmptyState title="Бараа олдсонгүй" description="Хайлт эсвэл категориа өөрчилж үзнэ үү." />
        </div>
      ) : (
        <>
          <ul className="divide-y divide-border border-b border-border">
            {rows.map((post) => {
              const stock = stockLine(post);
              const category =
                (post.categoryId != null && categories.name.get(post.categoryId)) ||
                post.category?.name;
              return (
                <li key={post.id}>
                  <Link
                    href={`/products/${post.id}`}
                    className="-mx-4 flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/60"
                  >
                    <Thumb id={post.images?.[0]} size={52} className="rounded-xl" />
                    <span className="min-w-0 grow">
                      <span className="block truncate text-[15px] font-semibold">
                        {post.productName || post.name}
                      </span>
                      <span className="mt-0.5 block truncate font-mono text-xs text-muted-foreground">
                        {[post.productCode, category].filter(Boolean).join(" · ")}
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

          {filtered.length > limit && (
            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={() => setLimit((n) => n + PAGE_SIZE)}
            >
              Цааш үзэх ({formatQty(filtered.length - limit)})
            </Button>
          )}
        </>
      )}
    </>
  );
}
