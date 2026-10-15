"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useCategories } from "@/lib/categories/CategoriesProvider";
import { leafIds, type Category } from "@/lib/categories";
import { cn } from "@/lib/utils";
import PriceRangeSlider from "./PriceRangeSlider";

export interface SearchFilters {
  categories: number[];
  brands: string[];
  freeDeliveryOnly: boolean;
  priceRange: [number, number];
}

interface FilterSidebarProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  priceBounds: [number, number];
  counts: {
    category: Record<number, number>;
    brand: Record<string, number>;
    freeDelivery: number;
  };
}

function Checkbox({
  checked,
  onChange,
  label,
  count,
  indeterminate = false,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  label: string;
  count: number;
}) {
  return (
    <label className="flex items-center gap-2.5 py-1.5 cursor-pointer group">
      <span
        className={cn(
          "flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border transition-colors",
          checked || indeterminate
            ? "bg-primary border-primary"
            : "border-input group-hover:border-primary/50"
        )}
      >
        {checked && (
          <svg viewBox="0 0 12 12" className="h-3 w-3 fill-none stroke-white stroke-2">
            <path d="M2 6l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        {!checked && indeterminate && (
          <span className="h-0.5 w-2 rounded bg-white" />
        )}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <span className="flex-1 text-sm text-foreground">{label}</span>
      <span className="text-xs text-muted-foreground">{count}</span>
    </label>
  );
}

export function FilterPanelContent({
  filters,
  onChange,
  priceBounds,
  counts,
}: FilterSidebarProps) {
  const { t } = useLanguage();
  const { categories } = useCategories();
  const [openCategories, setOpenCategories] = useState<Record<number, boolean>>(
    {}
  );

  const toggleCategory = (id: number) => {
    const next = filters.categories.includes(id)
      ? filters.categories.filter((c) => c !== id)
      : [...filters.categories, id];
    onChange({ ...filters, categories: next });
  };

  // Selecting a group selects every leaf beneath it; if they are all selected
  // already, it clears them instead.
  const toggleGroup = (category: Category) => {
    const ids = leafIds(category);
    const allSelected = ids.every((id) => filters.categories.includes(id));
    const next = allSelected
      ? filters.categories.filter((c) => !ids.includes(c))
      : Array.from(new Set([...filters.categories, ...ids]));
    onChange({ ...filters, categories: next });
  };

  const toggleOpen = (id: number) =>
    setOpenCategories((prev) => ({ ...prev, [id]: !prev[id] }));

  // The tree can be several levels deep. Only leaves are filter targets (the
  // product API has nothing under a parent id), so a parent is just an
  // expandable group whose count is the sum of the leaves beneath it.
  const countOf = (category: Category): number =>
    category.children.length === 0
      ? counts.category[category.id] ?? 0
      : category.children.reduce((sum, child) => sum + countOf(child), 0);

  const hasSelectedLeaf = (category: Category): boolean =>
    category.children.length === 0
      ? filters.categories.includes(category.id)
      : category.children.some(hasSelectedLeaf);

  const renderCategory = (category: Category) => {
    if (category.children.length === 0) {
      return (
        <Checkbox
          key={category.id}
          checked={filters.categories.includes(category.id)}
          onChange={() => toggleCategory(category.id)}
          label={category.name}
          count={countOf(category)}
        />
      );
    }

    const isOpen = openCategories[category.id] ?? hasSelectedLeaf(category);
    const ids = leafIds(category);
    const selectedCount = ids.filter((id) =>
      filters.categories.includes(id)
    ).length;

    return (
      <div key={category.id}>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => toggleOpen(category.id)}
            aria-expanded={isOpen}
            aria-label={category.name}
            className="shrink-0 p-1"
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                isOpen && "rotate-180"
              )}
            />
          </button>
          <div className="flex-1">
            <Checkbox
              checked={selectedCount === ids.length}
              indeterminate={selectedCount > 0 && selectedCount < ids.length}
              onChange={() => toggleGroup(category)}
              label={category.name}
              count={countOf(category)}
            />
          </div>
        </div>

        {isOpen && (
          <div className="ml-4 border-l border-border pl-2">
            {category.children.map(renderCategory)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-4">
        <h3 className="font-semibold text-sm text-foreground mb-2">
          {t("search.filters.category")}
        </h3>
        {categories.map((category) => renderCategory(category))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <h3 className="font-semibold text-sm text-foreground mb-2">
          {t("search.filters.delivery")}
        </h3>
        <Checkbox
          checked={filters.freeDeliveryOnly}
          onChange={() =>
            onChange({
              ...filters,
              freeDeliveryOnly: !filters.freeDeliveryOnly,
            })
          }
          label={t("search.filters.freeDelivery")}
          count={counts.freeDelivery}
        />
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <h3 className="font-semibold text-sm text-foreground mb-1">
          {t("search.filters.priceRange")}
        </h3>
        <PriceRangeSlider
          min={priceBounds[0]}
          max={priceBounds[1]}
          value={filters.priceRange}
          onChange={(priceRange) => onChange({ ...filters, priceRange })}
        />
      </div>
    </div>
  );
}

export default function FilterSidebar(props: FilterSidebarProps) {
  return (
    <aside className="hidden lg:block lg:w-64 shrink-0">
      <FilterPanelContent {...props} />
    </aside>
  );
}
