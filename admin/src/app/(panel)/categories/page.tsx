"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { EmptyState, ErrorState } from "@/components/common/States";
import CategoryListSkeleton from "@/components/categories/CategoryListSkeleton";
import { useConfirm } from "@/components/common/Confirm";
import { useToast } from "@/components/common/Toast";
import DetailHeader from "@/components/layout/DetailHeader";
import { Button } from "@/components/ui/button";
import {
  canMoveUnder,
  canNestUnder,
  moveCategory,
  deleteCategory,
  flattenCategories,
  getCategoryTree,
  type Category,
} from "@/lib/api/categories";
import { attrsSummary } from "@/lib/attributes";
import { useApi } from "@/lib/useApi";
import { cn, formatQty } from "@/lib/utils";
import { ChevronRight, GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

// Drag & drop moving is switched off for now — set to `true` to bring the
// grip handle (and the drag logic in `CategoriesPage`) back. Moving still
// works from the "Эх категори" field on the edit form.
const DRAG_AND_DROP = false;

function CategoryRow({
  category,
  onChanged,
  dragging,
  over,
  onDragStart,
  open,
  onToggle,
}: {
  category: Category & { depth: number };
  onChanged: () => void;
  /** This row is the one being dragged. */
  dragging: boolean;
  /** The dragged category would land inside this row. */
  over: boolean;
  onDragStart: (id: number, x: number, y: number) => void;
  /** Its subcategories are showing. */
  open: boolean;
  onToggle: () => void;
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
    <li
      data-drop={category.id}
      className={cn(
        "flex items-center gap-2 py-3.5 transition-colors",
        dragging && "opacity-40",
        over && "rounded-xl bg-primary-soft ring-2 ring-primary"
      )}
      style={indent}
    >
      {category.children.length > 0 ? (
        <button
          type="button"
          aria-expanded={open}
          aria-label={t(open ? "cat.collapseAria" : "cat.expandAria", { name: category.name })}
          onClick={onToggle}
          className="-ml-1 grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronRight className={cn("size-5 transition-transform", open && "rotate-90")} />
        </button>
      ) : (
        // A leaf has nothing to fold; keeps the names lined up.
        <span className="-ml-1 size-8 shrink-0" aria-hidden />
      )}
      {DRAG_AND_DROP && (
      <button
        type="button"
        aria-label={t("cat.dragAria", { name: category.name })}
        title={t("cat.drag")}
        onPointerDown={(e) => {
          e.preventDefault();
          onDragStart(category.id, e.clientX, e.clientY);
        }}
        className="-ml-1 grid size-8 shrink-0 cursor-grab touch-none select-none place-items-center rounded-lg text-muted-foreground hover:text-foreground active:cursor-grabbing"
      >
        <GripVertical className="size-5" />
      </button>
      )}
      <span
        className={cn("min-w-0 grow", category.children.length > 0 && "cursor-pointer")}
        onClick={category.children.length > 0 ? onToggle : undefined}
      >
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

type Drag = { id: number; x: number; y: number; over: number | "root" | null };

export default function CategoriesPage() {
  const { t } = useLanguage();
  const { data, error, reload } = useApi(getCategoryTree);
  const { run } = useToast();
  const confirm = useConfirm();

  const rows = useMemo(() => (data ? flattenCategories(data) : []), [data]);
  // Folded by default: only top-level categories show until one is opened.
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const visibleRows = useMemo(() => {
    const byId = new Map(rows.map((row) => [row.id, row]));
    const shown = (row: (typeof rows)[number]): boolean => {
      const parent = row.parentId != null ? byId.get(row.parentId) : undefined;
      return !parent || (expanded.has(parent.id) && shown(parent));
    };
    return rows.filter(shown);
  }, [rows, expanded]);
  const toggle = (id: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  const [drag, setDrag] = useState<Drag | null>(null);
  const dragId = drag?.id ?? null;
  const moving = rows.find((row) => row.id === dragId);

  const onDrop = useCallback(
    async (category: Category, target: number | "root") => {
      const parent = target === "root" ? undefined : rows.find((row) => row.id === target);
      if (parent && parent.children.length === 0 && parent.attrs.length > 0) {
        const ok = await confirm({
          title: t("cat.moveTitle"),
          description: t("cat.moveClearsAttrs", { name: parent.name }),
          confirmLabel: t("cat.move"),
        });
        if (!ok) return;
      }
      if (await run(() => moveCategory(category, parent ? parent.id : null, parent), t("cat.moved"))) reload();
    },
    [rows, confirm, run, reload, t]
  );

  // Dragging works with a pointer or a finger: the handle starts it, and
  // everything after is tracked on the window. The row under the pointer
  // (or the "top level" zone) is the drop target if the move is allowed.
  useEffect(() => {
    if (dragId == null || !moving) return;
    const dragged = moving;
    let pointerY = 0;
    let frame = 0;

    const targetAt = (x: number, y: number): number | "root" | null => {
      const zone = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-drop]")?.dataset.drop;
      if (!zone) return null;
      if (zone === "root") return dragged.parentId == null ? null : "root";
      const target = rows.find((row) => String(row.id) === zone);
      if (!target || target.id === dragged.parentId) return null;
      return canMoveUnder(dragged, target) ? target.id : null;
    };
    const onMove = (e: PointerEvent) => {
      pointerY = e.clientY;
      const over = targetAt(e.clientX, e.clientY);
      setDrag((d) => d && { ...d, x: e.clientX, y: e.clientY, over });
    };
    const onUp = (e: PointerEvent) => {
      const over = targetAt(e.clientX, e.clientY);
      setDrag(null);
      if (over != null) onDrop(dragged, over);
    };
    const onCancel = () => setDrag(null);
    // Near the top or bottom edge, the page scrolls along.
    const scroll = () => {
      if (pointerY > 0 && pointerY < 90) window.scrollBy(0, -14);
      else if (pointerY > window.innerHeight - 90) window.scrollBy(0, 14);
      frame = requestAnimationFrame(scroll);
    };
    frame = requestAnimationFrame(scroll);

    const previousSelect = document.body.style.userSelect;
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.userSelect = previousSelect;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
    };
  }, [dragId, moving, rows, onDrop]);

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
        <CategoryListSkeleton />
      ) : rows.length === 0 ? (
        <div className="pt-4">
          <EmptyState title={t("cat.empty")} description={t("cat.emptyHint")} />
        </div>
      ) : (
        <ul className="divide-y divide-border border-b border-border">
          {visibleRows.map((category) => (
            <CategoryRow
              key={category.id}
              category={category}
              onChanged={reload}
              dragging={category.id === dragId}
              over={drag?.over === category.id}
              onDragStart={(id, x, y) => setDrag({ id, x, y, over: null })}
              open={expanded.has(category.id)}
              onToggle={() => toggle(category.id)}
            />
          ))}
        </ul>
      )}

      {drag && moving && (
        <>
          {/* Drop here to make it a top-level category. */}
          {moving.parentId != null && (
            <div
              data-drop="root"
              className={cn(
                "fixed inset-x-4 bottom-24 z-40 mx-auto flex h-14 max-w-sm items-center justify-center rounded-2xl border-2 border-dashed bg-background/95 text-sm font-semibold shadow-soft backdrop-blur transition-colors",
                drag.over === "root" ? "border-primary bg-primary-soft text-primary-ink" : "border-border text-muted-foreground"
              )}
            >
              {t("cat.dropRoot")}
            </div>
          )}
          <div
            aria-hidden
            className="pointer-events-none fixed z-50 max-w-[16rem] -translate-x-1/2 -translate-y-1/2 truncate rounded-full bg-dark px-4 py-2 text-sm font-semibold text-dark-foreground shadow-soft"
            style={{ left: drag.x, top: drag.y - 28 }}
          >
            {moving.name}
          </div>
        </>
      )}
    </>
  );
}
