"use client";

import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { useConfirm } from "@/components/common/Confirm";
import { useToast } from "@/components/common/Toast";
import DetailHeader from "@/components/layout/DetailHeader";
import { Button } from "@/components/ui/button";
import {
  canNestUnder,
  categoryAttrs,
  deleteCategory,
  flattenCategories,
  getCategoryTree,
  type Category,
} from "@/lib/api/categories";
import { getAttrs } from "@/lib/api/attrs";
import { attrsSummary } from "@/lib/attributes";
import { useApi } from "@/lib/useApi";
import { cn, formatQty } from "@/lib/utils";
import { Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

async function loadCategories() {
  const [tree, catalogue] = await Promise.all([getCategoryTree(), getAttrs()]);
  const attrName = new Map(catalogue.map((attr) => [attr.id, attr.name]));
  return { tree, attrName };
}

function CategoryRow({
  category,
  attrs,
  onChanged,
}: {
  category: Category & { depth: number };
  /** Names of what its products vary by; only the last level has them. */
  attrs: string[];
  onChanged: () => void;
}) {
  const { run } = useToast();
  const confirm = useConfirm();
  // Subcategories sit indented under their parent.
  const indent = { paddingLeft: `${category.depth * 20}px` };

  async function onDelete() {
    const ok = await confirm({
      title: "Категори устгах уу?",
      description: `“${category.name}” категорийг устгана.${
        category.children.length > 0 ? ` Энэ категори ${category.children.length} дэд категоритой.` : ""
      } Буцаах боломжгүй.`,
      confirmLabel: "Устгах",
      tone: "danger",
    });
    if (!ok) return;
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
          {category.children.length > 0 ? (
            `${formatQty(category.children.length)} дэд категори`
          ) : (
            <span className={cn(attrs.length > 0 && "font-semibold text-primary-ink")}>{attrsSummary(attrs)}</span>
          )}
        </span>
      </span>
      <Button asChild variant="outline" size="icon-sm" className="shrink-0">
        <Link href={`/categories/${category.id}`} aria-label={`“${category.name}” засах`} title="Засах">
          <Pencil />
        </Link>
      </Button>
      {canNestUnder(category) ? (
        <Button asChild variant="soft" size="icon-sm" className="shrink-0">
          <Link
            href={`/categories/new?parentId=${category.id}`}
            aria-label={`“${category.name}” дотор дэд категори нэмэх`}
            title="Дэд категори нэмэх"
          >
            <Plus />
          </Link>
        </Button>
      ) : (
        // The deepest level takes no subcategories; keeps the buttons lined up.
        <span className="size-9 shrink-0" aria-hidden />
      )}
      <Button
        variant="danger"
        size="icon-sm"
        className="shrink-0"
        aria-label={`“${category.name}” устгах`}
        title="Устгах"
        onClick={onDelete}
      >
        <Trash2 />
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
              attrs={categoryAttrs(rows, category.id).map((id) => data.attrName.get(id) ?? `#${id}`)}
              onChanged={reload}
            />
          ))}
        </ul>
      )}
    </>
  );
}
