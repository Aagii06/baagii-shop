"use client";

import SampleNotice from "@/components/common/SampleNotice";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { useToast } from "@/components/common/Toast";
import DetailHeader from "@/components/layout/DetailHeader";
import { Button } from "@/components/ui/button";
import {
  categoryAttrs,
  deleteCategory,
  flattenCategories,
  getCategoryTree,
  type Category,
} from "@/lib/api/categories";
import { getPosts } from "@/lib/api/posts";
import { attrsSummary } from "@/lib/attributes";
import { useApi } from "@/lib/useApi";
import { cn, formatQty } from "@/lib/utils";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

async function loadCategories() {
  const [tree, posts] = await Promise.all([getCategoryTree(), getPosts()]);
  const productCount = new Map<number, number>();
  for (const post of posts) {
    if (post.categoryId != null) {
      productCount.set(post.categoryId, (productCount.get(post.categoryId) ?? 0) + 1);
    }
  }
  return { tree, productCount };
}

// Listings in this category plus all of its subcategories.
function subtreeCount(category: Category, productCount: Map<number, number>): number {
  return category.children.reduce(
    (sum, child) => sum + subtreeCount(child, productCount),
    productCount.get(category.id) ?? 0
  );
}

function CategoryRow({
  category,
  attrs,
  count,
  onChanged,
}: {
  category: Category & { depth: number };
  /** What its products vary by — its own or inherited. */
  attrs: string[];
  count: number;
  onChanged: () => void;
}) {
  const { run } = useToast();
  // Subcategories sit indented under their parent.
  const indent = { paddingLeft: `${category.depth * 20}px` };
  const inherited = category.attrs === null && category.parentId != null;

  async function onDelete() {
    if (!window.confirm(`“${category.name}” категорийг устгах уу?`)) return;
    if (await run(() => deleteCategory(category.id), "Категорийг устгалаа")) onChanged();
  }

  return (
    <li className="flex items-center gap-2 py-3.5" style={indent}>
      <span className="min-w-0 grow">
        <span
          className={cn(
            "block truncate text-[15px]",
            category.depth === 0 ? "font-bold" : "font-semibold"
          )}
        >
          {category.name}
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
          <span className="font-mono">{formatQty(count)} бараа</span>
          {" · "}
          <span className={cn(attrs.length > 0 && !inherited && "font-semibold text-primary-ink")}>
            {attrsSummary(attrs)}
          </span>
        </span>
      </span>
      <Button asChild variant="outline" size="sm" className="font-medium">
        <Link href={`/categories/${category.id}`}>Засах</Link>
      </Button>
      <Button variant="danger" size="sm" className="font-medium" onClick={onDelete}>
        Устгах
      </Button>
    </li>
  );
}

export default function CategoriesPage() {
  const { data, error, reload } = useApi(loadCategories);

  const rows = useMemo(() => (data ? flattenCategories(data.tree) : []), [data]);

  return (
    <>
      <DetailHeader
        backHref="/profile"
        title="Категори"
        aside={
          <Button asChild className="h-10 px-4">
            <Link href="/categories/new">
              <Plus />
              Нэмэх
            </Link>
          </Button>
        }
      />
      <SampleNotice className="mb-2">
        Backend категорийн сонголтыг (өнгө, хэмжээ…) хараахан илгээдэггүй тул жишээ тохиргоо харуулж байна.
      </SampleNotice>

      {error && !data ? (
        <div className="pt-4">
          <ErrorState error={error} onRetry={reload} />
        </div>
      ) : !data ? (
        <LoadingState />
      ) : rows.length === 0 ? (
        <div className="pt-4">
          <EmptyState title="Категори алга" description="“Нэмэх” товчоор шинэ категори нэмнэ үү." />
        </div>
      ) : (
        <ul className="divide-y divide-border border-b border-border">
          {rows.map((category) => (
            <CategoryRow
              key={category.id}
              category={category}
              attrs={categoryAttrs(rows, category.id)}
              count={subtreeCount(category, data.productCount)}
              onChanged={reload}
            />
          ))}
        </ul>
      )}
    </>
  );
}
