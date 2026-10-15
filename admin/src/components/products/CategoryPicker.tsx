"use client";

import { type Category } from "@/lib/api/categories";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { ChevronDown, CircleCheck, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Flat = Category & { depth: number };

/** How long a pick shows the spinner before the next level (or the tick) appears. */
const NEXT_LEVEL_DELAY_MS = 350;

function LevelSelect({
  value,
  placeholder,
  options,
  onChange,
}: {
  value: string;
  placeholder: string;
  options: Flat[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full appearance-none rounded-full border border-input bg-white px-5 pr-12 text-[15px] focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
      >
        <option value="">{placeholder}</option>
        {options.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}

/**
 * Picks a category one level at a time: choose a top-level one, the
 * subcategories load next, and so on. A category with nothing below it is
 * the end of the road — marked with a green tick.
 */
export default function CategoryPicker({
  categories,
  value,
  onChange,
  hint,
}: {
  categories: Flat[];
  /** Selected category id, or "". */
  value: string;
  onChange: (value: string) => void;
  hint?: string;
}) {
  const { t } = useLanguage();
  const [waiting, setWaiting] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const byId = new Map(categories.map((c) => [c.id, c]));
  const childrenOf = (parentId: number | null) => categories.filter((c) => c.parentId === parentId);

  // Root → selected category.
  const path: Flat[] = [];
  for (let c = value ? byId.get(Number(value)) : undefined; c; c = c.parentId != null ? byId.get(c.parentId) : undefined) {
    path.unshift(c);
  }
  const selected = path[path.length - 1];
  const isLeaf = Boolean(selected) && childrenOf(selected.id).length === 0;

  function pick(level: number, id: string) {
    clearTimeout(timer.current);
    // Clearing a level falls back to the one above it.
    onChange(id || (level > 0 ? String(path[level - 1].id) : ""));
    if (!id) {
      setWaiting(false);
      return;
    }
    setWaiting(true);
    timer.current = setTimeout(() => setWaiting(false), NEXT_LEVEL_DELAY_MS);
  }

  // One select per level up to the selected one, plus the next level down.
  const levels: { options: Flat[]; selectedId: string }[] = [];
  for (let i = 0; i <= path.length; i++) {
    const options = childrenOf(i === 0 ? null : path[i - 1].id);
    if (options.length > 0) levels.push({ options, selectedId: path[i] ? String(path[i].id) : "" });
  }

  return (
    <div className="min-w-0">
      <span className="mb-1.5 block text-sm text-muted-foreground">{t("common.category")}</span>
      <div className="space-y-2.5">
        {levels.map((level, i) =>
          // The level below a fresh pick appears once the spinner is done.
          waiting && !level.selectedId ? null : (
            <LevelSelect
              key={`level-${i}`}
              value={level.selectedId}
              placeholder={i === 0 ? t("pf.noneSelected") : t("cat.pickSub")}
              options={level.options}
              onChange={(id) => pick(i, id)}
            />
          )
        )}
      </div>
      {waiting ? (
        <p role="status" className="mt-1.5 flex items-center gap-1.5 px-5 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          {t("common.loading")}
        </p>
      ) : isLeaf ? (
        <p className="mt-1.5 flex items-center gap-1.5 px-5 text-sm font-semibold text-success">
          <CircleCheck className="size-4" />
          {t("cat.picked")}
        </p>
      ) : (
        hint && <p className="mt-1.5 px-5 text-sm text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
