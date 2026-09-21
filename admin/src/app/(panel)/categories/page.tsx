"use client";

import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { useToast } from "@/components/common/Toast";
import DetailHeader from "@/components/layout/DetailHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createCategory,
  deleteCategory,
  flattenCategories,
  getCategoryTree,
  updateCategory,
  type Category,
} from "@/lib/api/categories";
import { getPosts } from "@/lib/api/posts";
import { useApi } from "@/lib/useApi";
import { cn, formatQty } from "@/lib/utils";
import { useMemo, useState } from "react";

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
  count,
  onChanged,
}: {
  category: Category & { depth: number };
  count: number;
  onChanged: () => void;
}) {
  const { run } = useToast();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(category.name);
  // Subcategories sit indented under their parent.
  const indent = { paddingLeft: `${category.depth * 20}px` };

  async function onRename(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = draft.trim();
    if (!name) return;
    if (await run(() => updateCategory(category.id, name), "Хадгаллаа")) {
      setEditing(false);
      onChanged();
    }
  }

  async function onDelete() {
    if (!window.confirm(`“${category.name}” категорийг устгах уу?`)) return;
    if (await run(() => deleteCategory(category.id), "Категорийг устгалаа")) onChanged();
  }

  if (editing) {
    return (
      <li className="py-3" style={indent}>
        <form onSubmit={onRename} className="flex items-center gap-2">
          <Input
            autoFocus
            aria-label="Категорийн нэр"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="h-10"
          />
          <Button type="submit" size="sm" className="h-10" disabled={!draft.trim()}>
            Хадгалах
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10"
            onClick={() => {
              setEditing(false);
              setDraft(category.name);
            }}
          >
            Болих
          </Button>
        </form>
      </li>
    );
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
        <span className="mt-0.5 block font-mono text-xs text-muted-foreground">
          {formatQty(count)} бараа
        </span>
      </span>
      <Button variant="outline" size="sm" className="font-medium" onClick={() => setEditing(true)}>
        Засах
      </Button>
      <Button variant="danger" size="sm" className="font-medium" onClick={onDelete}>
        Устгах
      </Button>
    </li>
  );
}

export default function CategoriesPage() {
  const { data, error, reload } = useApi(loadCategories);
  const { run } = useToast();
  const [name, setName] = useState("");

  const rows = useMemo(() => (data ? flattenCategories(data.tree) : []), [data]);

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    if (await run(() => createCategory(trimmed), "Категори нэмлээ")) {
      setName("");
      reload();
    }
  }

  return (
    <>
      <DetailHeader backHref="/profile" title="Категори" />
      <form onSubmit={onCreate} className="-mx-4 -mt-4 flex gap-2 border-b border-border px-4 py-4">
        <Input
          placeholder="Шинэ категорийн нэр"
          aria-label="Шинэ категорийн нэр"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button type="submit" className="h-12 shrink-0 px-6" disabled={!name.trim()}>
          Нэмэх
        </Button>
      </form>

      {error && !data ? (
        <div className="pt-4">
          <ErrorState error={error} onRetry={reload} />
        </div>
      ) : !data ? (
        <LoadingState />
      ) : rows.length === 0 ? (
        <div className="pt-4">
          <EmptyState title="Категори алга" description="Дээрх талбараас шинэ категори нэмнэ үү." />
        </div>
      ) : (
        <ul className="divide-y divide-border border-b border-border">
          {rows.map((category) => (
            <CategoryRow
              key={category.id}
              category={category}
              count={subtreeCount(category, data.productCount)}
              onChanged={reload}
            />
          ))}
        </ul>
      )}
    </>
  );
}
