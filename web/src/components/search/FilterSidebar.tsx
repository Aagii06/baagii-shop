"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useCategories } from "@/lib/categories/CategoriesProvider";
import { categoryPath, subtreeIds, type Category } from "@/lib/categories";
import { cn } from "@/lib/utils";
import PriceRangeSlider from "./PriceRangeSlider";

export interface SearchFilters {
  categories: number[];
  brands: string[];
  priceRange: [number, number];
}

interface FilterSidebarProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  priceBounds: [number, number];
  counts: {
    brand: Record<string, number>;
  };
}

/** One row of the category / store lists: a name, picked or not. */
function PickRow({
  label,
  picked,
  onClick,
  sub = false,
}: {
  label: string;
  picked: boolean;
  onClick: () => void;
  /** Inside an opened category: smaller and tighter. */
  sub?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={picked}
      onClick={onClick}
      className={cn(
        "flex w-full cursor-pointer items-center gap-2 text-left transition-colors",
        sub ? "py-2 text-sm" : "py-3 text-[15px]",
        picked ? "font-semibold text-primary" : "text-foreground hover:text-primary"
      )}
    >
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {picked && <Check className="h-4 w-4 shrink-0" strokeWidth={2.5} />}
    </button>
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

  // A group's default open state follows its selection (see renderCategory),
  // so toggling something inside it could collapse it under the cursor. Pin
  // every ancestor open first.
  const keepAncestorsOpen = (id: number) =>
    setOpenCategories((prev) => {
      const next = { ...prev };
      for (const c of categoryPath(categories, id).slice(0, -1)) next[c.id] = true;
      return next;
    });

  const toggleCategory = (id: number) => {
    keepAncestorsOpen(id);
    const next = filters.categories.includes(id)
      ? filters.categories.filter((c) => c !== id)
      : [...filters.categories, id];
    onChange({ ...filters, categories: next });
  };

  // Selecting a group selects every leaf beneath it; if they are all selected
  // already, it clears them instead.
  const toggleGroup = (category: Category) => {
    keepAncestorsOpen(category.id);
    const ids = subtreeIds(category);
    const allSelected = ids.every((id) => filters.categories.includes(id));
    const next = allSelected
      ? filters.categories.filter((c) => !ids.includes(c))
      : Array.from(new Set([...filters.categories, ...ids]));
    onChange({ ...filters, categories: next });
  };

  const toggleOpen = (id: number, isOpen: boolean) =>
    setOpenCategories((prev) => ({ ...prev, [id]: !isOpen }));

  // A category with subcategories opens on tap; its first row ("Бүгд")
  // picks the whole group, the rest pick one subcategory each.
  const renderCategory = (category: Category, depth = 0) => {
    const sub = depth > 0;
    if (category.children.length === 0) {
      return (
        <PickRow
          key={category.id}
          label={category.name}
          picked={filters.categories.includes(category.id)}
          onClick={() => toggleCategory(category.id)}
          sub={sub}
        />
      );
    }

    const ids = subtreeIds(category);
    const selectedCount = ids.filter((id) =>
      filters.categories.includes(id)
    ).length;
    // A partial selection opens by default, to show which children are picked.
    const isOpen =
      openCategories[category.id] ??
      (selectedCount > 0 && selectedCount < ids.length);

    return (
      <div key={category.id}>
        <button
          type="button"
          onClick={() => toggleOpen(category.id, isOpen)}
          aria-expanded={isOpen}
          className={cn(
            "flex w-full cursor-pointer items-center gap-2 text-left transition-colors hover:text-primary",
            sub ? "py-2 text-sm" : "py-3 text-[15px]",
            selectedCount > 0 ? "font-semibold text-primary" : "text-foreground"
          )}
        >
          <span className="min-w-0 flex-1 truncate">{category.name}</span>
          <ChevronDown
            className={cn(
              "shrink-0 text-foreground/70 transition-transform",
              sub ? "h-4 w-4" : "h-5 w-5",
              isOpen && "rotate-180"
            )}
          />
        </button>

        {isOpen && (
          <div className="mb-2 ml-1 border-l-2 border-border pl-4">
            <PickRow
              label={t("search.filters.allOf")}
              picked={selectedCount === ids.length}
              onClick={() => toggleGroup(category)}
              sub
            />
            {category.children.map((child) => renderCategory(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // The stores selling what was found, most products first.
  const stores = Object.entries(counts.brand)
    .sort(([a, x], [b, y]) => y - x || a.localeCompare(b))
    .map(([name]) => name);

  const toggleStore = (store: string) =>
    onChange({
      ...filters,
      brands: filters.brands.includes(store)
        ? filters.brands.filter((b) => b !== store)
        : [...filters.brands, store],
    });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card px-5 py-4">
        <h3 className="mb-1 text-lg font-bold text-foreground">
          {t("search.filters.category")}
        </h3>
        {categories.map((category) => renderCategory(category))}

        {stores.length > 0 && (
          <>
            <div className="my-3 border-t border-border" />
            <h3 className="mb-1 text-lg font-bold text-foreground">
              {t("search.filters.stores")}
            </h3>
            {stores.map((store) => (
              <PickRow
                key={store}
                label={store}
                picked={filters.brands.includes(store)}
                onClick={() => toggleStore(store)}
              />
            ))}
          </>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card px-5 py-4">
        <h3 className="mb-1 text-lg font-bold text-foreground">
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
