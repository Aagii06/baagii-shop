"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { flattenCategories, type Category } from "@/lib/api/categories";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, Minus, Search } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Flat = Category & { depth: number };

/** From this many categories on, the sheet gets a search box. */
const SEARCH_FROM = 12;

/** A category and every one below it. */
const subtreeIds = (category: Category): number[] => [category.id, ...category.children.flatMap(subtreeIds)];

/**
 * Filters by any number of categories, picked in a bottom sheet that shows
 * the whole tree. Ticking a category ticks everything below it; a parent
 * whose children are all ticked is ticked too. `value` holds every ticked
 * id, so it can be used as the filter as is. Empty means all categories.
 */
export default function CategoryFilter({
  tree,
  value,
  onChange,
}: {
  tree: Category[];
  value: number[];
  onChange: (value: number[]) => void;
}) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const flat = useMemo(() => flattenCategories(tree), [tree]);

  // Only the topmost ticked categories are named; their children go without saying.
  const picked = new Set(value);
  const names = flat.filter((c) => picked.has(c.id) && !(c.parentId != null && picked.has(c.parentId))).map((c) => c.name);
  const label = names.length === 0 ? t("products.allCategories") : names.length <= 2 ? names.join(", ") : t("cf.count", { count: names.length });

  return (
    <div className="relative min-w-0">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`${t("common.category")}: ${label}`}
        onClick={() => setOpen(true)}
        className={cn(
          "flex h-12 w-full items-center rounded-full border border-input bg-white px-5 pr-12 text-left text-[15px] focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15",
          names.length === 0 && "text-muted-foreground",
          names.length > 0 && "border-primary/50 font-semibold"
        )}
      >
        <span className="min-w-0 flex-1 truncate">{label}</span>
      </button>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
      {open && (
        <TreeSheet
          flat={flat}
          value={value}
          onDone={(next) => {
            setOpen(false);
            triggerRef.current?.focus();
            onChange(next);
          }}
          onClose={() => {
            setOpen(false);
            triggerRef.current?.focus();
          }}
        />
      )}
    </div>
  );
}

function TreeSheet({
  flat,
  value,
  onDone,
  onClose,
}: {
  flat: Flat[];
  value: number[];
  onDone: (value: number[]) => void;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  // Ticks stay in the sheet until "done", so closing it changes nothing.
  const [picked, setPicked] = useState(() => new Set(value));
  const [q, setQ] = useState("");
  const byId = useMemo(() => new Map(flat.map((c) => [c.id, c])), [flat]);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    dialog?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);

  /** "all" when the category and everything below it is ticked, "some" when part of it. */
  const stateOf = (c: Category): "all" | "some" | "none" => {
    const ids = subtreeIds(c);
    const count = ids.filter((id) => picked.has(id)).length;
    return count === ids.length ? "all" : count > 0 ? "some" : "none";
  };

  function toggle(c: Flat) {
    const on = stateOf(c) !== "all";
    const next = new Set(picked);
    for (const id of subtreeIds(c)) {
      if (on) next.add(id);
      else next.delete(id);
    }
    // A parent is ticked exactly when all its children are.
    for (let p = c.parentId != null ? byId.get(c.parentId) : undefined; p; p = p.parentId != null ? byId.get(p.parentId) : undefined) {
      if (p.children.every((child) => next.has(child.id))) next.add(p.id);
      else next.delete(p.id);
    }
    setPicked(next);
  }

  // Searching shows the matches with the categories above them, for context.
  const needle = q.trim().toLowerCase();
  const rows = useMemo(() => {
    if (!needle) return flat;
    const keep = new Set<number>();
    for (const c of flat) {
      if (!c.name.toLowerCase().includes(needle)) continue;
      for (let p: Flat | undefined = c; p; p = p.parentId != null ? byId.get(p.parentId) : undefined) keep.add(p.id);
    }
    return flat.filter((c) => keep.has(c.id));
  }, [flat, needle, byId]);

  return createPortal(
    <dialog
      ref={dialogRef}
      tabIndex={-1}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="inset-x-0 bottom-0 top-auto mx-auto mb-0 mt-auto max-h-[80dvh] w-full max-w-md overflow-hidden rounded-t-3xl bg-white p-0 text-foreground shadow-soft outline-none transition duration-200 ease-out backdrop:bg-black/40 starting:open:translate-y-8 starting:open:opacity-0"
    >
      <div className="flex max-h-[80dvh] flex-col">
        <div className="shrink-0 px-5 pt-3">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
          <h2 id={titleId} className="truncate text-lg font-bold">
            {t("common.category")}
          </h2>
          {flat.length >= SEARCH_FROM && (
            <div className="relative mt-3">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("common.search")}
                aria-label={t("common.search")}
                className="pl-10"
              />
            </div>
          )}
        </div>

        <ul role="tree" aria-labelledby={titleId} aria-multiselectable className="mt-2 min-h-0 flex-1 overflow-y-auto">
          {rows.length ? (
            rows.map((c) => {
              const state = stateOf(c);
              return (
                <li key={c.id} role="none">
                  <button
                    type="button"
                    role="treeitem"
                    aria-level={c.depth + 1}
                    aria-checked={state === "all" ? true : state === "some" ? "mixed" : false}
                    aria-selected={state === "all"}
                    onClick={() => toggle(c)}
                    style={{ paddingLeft: `${1.25 + c.depth * 1.5}rem` }}
                    className={cn(
                      "flex w-full items-center gap-3 border-b border-border py-3.5 pr-5 text-left text-[15px] hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none",
                      c.depth === 0 && "font-bold",
                      state === "all" && "text-primary"
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "grid size-5 shrink-0 place-items-center rounded-md border-2",
                        state === "none" ? "border-input bg-white" : "border-primary bg-primary text-primary-foreground"
                      )}
                    >
                      {state === "all" && <Check className="size-3.5" strokeWidth={3.5} />}
                      {state === "some" && <Minus className="size-3.5" strokeWidth={3.5} />}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{c.name}</span>
                  </button>
                </li>
              );
            })
          ) : (
            <li className="py-10 text-center text-sm text-muted-foreground">{t("common.noResults")}</li>
          )}
        </ul>

        <div className="grid shrink-0 grid-cols-2 gap-3 border-t border-border px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <Button type="button" variant="outline" disabled={picked.size === 0} onClick={() => setPicked(new Set())}>
            {t("cf.clear")}
          </Button>
          <Button type="button" onClick={() => onDone(flat.filter((c) => picked.has(c.id)).map((c) => c.id))}>
            {t("common.done")}
          </Button>
        </div>
      </div>
    </dialog>,
    document.body
  );
}
