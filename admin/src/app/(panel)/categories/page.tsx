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
  moveCategoryTo,
  deleteCategory,
  flattenCategories,
  getCategoryTree,
  type Category,
} from "@/lib/api/categories";
import { attrsSummary } from "@/lib/attributes";
import { useApi } from "@/lib/useApi";
import { cn, formatQty } from "@/lib/utils";
import { ChevronRight, GripVertical, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type Flat = Category & { depth: number };

/** Where a dragged category lands: above or below a row, inside it, or at the top level. */
type Drop = { id: number; place: "before" | "after" | "inside" } | "root";

const sameDrop = (a: Drop | null, b: Drop | null) =>
  a === b || (a !== null && b !== null && a !== "root" && b !== "root" && a.id === b.id && a.place === b.place);

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
  /** Where the dragged category would land against this row. */
  over: "before" | "after" | "inside" | null;
  onDragStart: (id: number, x: number, y: number) => void;
  /** Its subcategories are showing. */
  open: boolean;
  onToggle: () => void;
}) {
  const { t } = useLanguage();
  const { run } = useToast();
  const confirm = useConfirm();
  // Subcategories sit indented under their parent.
  const indent = { paddingLeft: `${16 + category.depth * 20}px` };

  const [deleting, setDeleting] = useState(false);
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
    setDeleting(true);
    try {
      if (await run(() => deleteCategory(category.id), t("cat.deleted"))) onChanged();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <li
      data-drop={category.id}
      className={cn(
        "relative flex items-center gap-2 py-3.5 pr-4 transition-colors",
        dragging && "opacity-40",
        over === "inside" && "bg-primary-soft ring-2 ring-inset ring-primary"
      )}
      style={indent}
    >
      {(over === "before" || over === "after") && (
        // The line it would land on, at this row's indent.
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute right-4 h-0.5 rounded-full bg-primary",
            over === "before" ? "-top-px" : "-bottom-px"
          )}
          style={{ left: `${16 + category.depth * 20}px` }}
        />
      )}
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
        loading={deleting} onClick={onDelete}
      >
        <Trash2 />
      </Button>
    </li>
  );
}

type Drag = { id: number; x: number; y: number; over: Drop | null };

export default function CategoriesPage() {
  const { t } = useLanguage();
  const { data, error, loading, reload } = useApi(getCategoryTree);
  // A move is saving, or the list is reloading after it.
  const [moveBusy, setMoveBusy] = useState<"saving" | "reloading" | null>(null);
  const { run } = useToast();
  const confirm = useConfirm();

  const rows = useMemo<Flat[]>(() => (data ? flattenCategories(data) : []), [data]);
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

  /** The new parent (`null` = top level) and position among its children for a drop, or `null` if nothing would change. */
  const placement = useCallback(
    (dragged: Flat, drop: Drop): { parent: Flat | null; index: number } | null => {
      const byId = new Map(rows.map((row) => [row.id, row]));
      const childrenOf = (parent: Flat | null) =>
        (parent ? parent.children : (data ?? [])).filter((c) => c.id !== dragged.id).map((c) => byId.get(c.id)!);
      let parent: Flat | null;
      let index: number;
      if (drop === "root") {
        parent = null;
        index = childrenOf(null).length;
      } else {
        const target = byId.get(drop.id);
        if (!target || target.id === dragged.id) return null;
        if (drop.place === "inside") {
          parent = target;
          index = expanded.has(target.id) ? 0 : childrenOf(target).length;
        } else {
          parent = target.parentId != null ? (byId.get(target.parentId) ?? null) : null;
          index = childrenOf(parent).findIndex((c) => c.id === target.id) + (drop.place === "after" ? 1 : 0);
        }
      }
      if (parent && !canMoveUnder(dragged, parent)) return null;
      // Same parent, same spot: nothing to do.
      const current = (parent ? parent.children : (data ?? [])).findIndex((c) => c.id === dragged.id);
      if ((parent?.id ?? null) === dragged.parentId && current === index) return null;
      return { parent, index };
    },
    [rows, data, expanded]
  );

  const onDrop = useCallback(
    async (category: Flat, drop: Drop) => {
      const spot = placement(category, drop);
      if (!spot) return;
      const { parent, index } = spot;
      if (parent && parent.id !== category.parentId && parent.children.length === 0 && parent.attrs.length > 0) {
        const ok = await confirm({
          title: t("cat.moveTitle"),
          description: t("cat.moveClearsAttrs", { name: parent.name }),
          confirmLabel: t("cat.move"),
        });
        if (!ok) return;
      }
      setMoveBusy("saving");
      if (await run(() => moveCategoryTo(category.id, parent?.id ?? null, index), t("cat.moved"))) {
        // Show where it went.
        if (parent) setExpanded((prev) => new Set(prev).add(parent.id));
        setMoveBusy("reloading");
        reload();
      } else {
        setMoveBusy(null);
      }
    },
    [placement, confirm, run, reload, t]
  );

  // The overlay stays until the reloaded list has landed.
  const showMoveBusy = moveBusy === "saving" || (moveBusy === "reloading" && loading);

  // Dragging works with a pointer or a finger: the handle starts it, and
  // everything after is tracked on the window. The top or bottom quarter of
  // the row under the pointer drops above or below it, the middle inside it;
  // the "top level" zone moves it to the top level.
  useEffect(() => {
    if (dragId == null || !moving) return;
    const dragged = moving;
    let pointerY = 0;
    let frame = 0;

    const targetAt = (x: number, y: number): Drop | null => {
      const el = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-drop]");
      const zone = el?.dataset.drop;
      if (!el || !zone) return null;
      let drop: Drop;
      if (zone === "root") drop = "root";
      else {
        const target = rows.find((row) => String(row.id) === zone);
        if (!target) return null;
        const rect = el.getBoundingClientRect();
        const at = (y - rect.top) / rect.height;
        // The deepest level takes no subcategories, so it only splits in half.
        const nests = canMoveUnder(dragged, target);
        const place = nests ? (at < 0.25 ? "before" : at > 0.75 ? "after" : "inside") : at < 0.5 ? "before" : "after";
        // Below an open parent is above its first child: drop inside it instead.
        drop = { id: target.id, place: place === "after" && expanded.has(target.id) && nests ? "inside" : place };
      }
      return placement(dragged, drop) ? drop : null;
    };
    const onMove = (e: PointerEvent) => {
      pointerY = e.clientY;
      const over = targetAt(e.clientX, e.clientY);
      setDrag((d) => d && { ...d, x: e.clientX, y: e.clientY, over: sameDrop(d.over, over) ? d.over : over });
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
  }, [dragId, moving, rows, onDrop, placement, expanded]);

  return (
    <>
      <DetailHeader
        backHref="/settings"
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
        <ul className="-mx-4 divide-y divide-border border-b border-border bg-white">
          {visibleRows.map((category) => (
            <CategoryRow
              key={category.id}
              category={category}
              onChanged={() => {
                setMoveBusy(null);
                reload();
              }}
              dragging={category.id === dragId}
              over={drag?.over && drag.over !== "root" && drag.over.id === category.id ? drag.over.place : null}
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

      {showMoveBusy && (
        <div
          role="status"
          aria-label={t("common.loading")}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30"
        >
          <Loader2 className="size-10 animate-spin text-white" />
        </div>
      )}
    </>
  );
}
