"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { useConfirm } from "@/components/common/Confirm";
import { useToast } from "@/components/common/Toast";
import DetailHeader from "@/components/layout/DetailHeader";
import { Button } from "@/components/ui/button";
import {
  canNestUnder,
  deleteCategory,
  flattenCategories,
  getCategoryTree,
  type Category,
} from "@/lib/api/categories";
import { attrsSummary } from "@/lib/attributes";
import { useApi } from "@/lib/useApi";
import { cn, formatQty } from "@/lib/utils";
import { Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

function CategoryRow({
  category,
  onChanged,
}: {
  category: Category & { depth: number };
  onChanged: () => void;
}) {
  const { t } = useLanguage();
  const { run } = useToast();
  const confirm = useConfirm();
  // Subcategories sit indented under their parent.
  const indent = { paddingLeft: `${category.depth * 20}px` };

  async function onDelete() {
    const ok = await confirm({
      title: t("cat.deleteTitle"),
      description: `${t("cat.deleteDesc", { name: category.name })}${
        category.children.length > 0 ? t("cat.deleteHasChildren", { count: category.children.length }) : ""
      } ${t("common.irreversible")}`,
      confirmLabel: t("common.delete"),
      tone: "danger",
    });
    if (!ok) return;
    if (await run(() => deleteCategory(category.id), t("cat.deleted"))) onChanged();
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
            t("cat.subCount", { count: formatQty(category.children.length) })
          ) : (
            <span className={cn(category.attrs.length > 0 && "font-semibold text-primary-ink")}>
              {attrsSummary(category.attrs.map((attr) => attr.name))}
            </span>
          )}
        </span>
      </span>
      <Button asChild variant="outline" size="icon-sm" className="shrink-0">
        <Link href={`/categories/${category.id}`} aria-label={t("cat.editAria", { name: category.name })} title={t("common.edit")}>
          <Pencil />
        </Link>
      </Button>
      {canNestUnder(category) ? (
        <Button asChild variant="soft" size="icon-sm" className="shrink-0">
          <Link
            href={`/categories/new?parentId=${category.id}`}
            aria-label={t("cat.addSubAria", { name: category.name })}
            title={t("cat.addSub")}
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
        aria-label={t("cat.deleteAria", { name: category.name })}
        title={t("common.delete")}
        onClick={onDelete}
      >
        <Trash2 />
      </Button>
    </li>
  );
}

export default function CategoriesPage() {
  const { t } = useLanguage();
  const { data, error, reload } = useApi(getCategoryTree);

  const rows = useMemo(() => (data ? flattenCategories(data) : []), [data]);

  return (
    <>
      <DetailHeader
        backHref="/profile"
        title={t("cat.title")}
        aside={
          <Button asChild className="h-10 px-4">
            <Link href="/categories/new">
              <Plus />
              {t("common.add")}
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
          <EmptyState title={t("cat.empty")} description={t("cat.emptyHint")} />
        </div>
      ) : (
        <ul className="divide-y divide-border border-b border-border">
          {rows.map((category) => (
            <CategoryRow
              key={category.id}
              category={category}
              onChanged={reload}
            />
          ))}
        </ul>
      )}
    </>
  );
}
