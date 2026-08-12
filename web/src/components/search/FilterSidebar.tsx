"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { brands, categories } from "@/lib/categories";
import { cn } from "@/lib/utils";
import PriceRangeSlider from "./PriceRangeSlider";

export interface SearchFilters {
  categories: string[];
  brands: string[];
  freeDeliveryOnly: boolean;
  priceRange: [number, number];
}

interface FilterSidebarProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  priceBounds: [number, number];
  counts: {
    category: Record<string, number>;
    brand: Record<string, number>;
    freeDelivery: number;
  };
}

function Checkbox({
  checked,
  onChange,
  label,
  count,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  count: number;
}) {
  return (
    <label className="flex items-center gap-2.5 py-1.5 cursor-pointer group">
      <span
        className={cn(
          "flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border transition-colors",
          checked
            ? "bg-primary border-primary"
            : "border-input group-hover:border-primary/50"
        )}
      >
        {checked && (
          <svg viewBox="0 0 12 12" className="h-3 w-3 fill-none stroke-white stroke-2">
            <path d="M2 6l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
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

export default function FilterSidebar({
  filters,
  onChange,
  priceBounds,
  counts,
}: FilterSidebarProps) {
  const { t } = useLanguage();

  const toggleCategory = (slug: string) => {
    const next = filters.categories.includes(slug)
      ? filters.categories.filter((c) => c !== slug)
      : [...filters.categories, slug];
    onChange({ ...filters, categories: next });
  };

  const toggleBrand = (brand: string) => {
    const next = filters.brands.includes(brand)
      ? filters.brands.filter((b) => b !== brand)
      : [...filters.brands, brand];
    onChange({ ...filters, brands: next });
  };

  return (
    <aside className="w-full lg:w-64 shrink-0 space-y-6">
      <div className="rounded-2xl border border-border bg-card p-4">
        <h3 className="font-semibold text-sm text-foreground mb-2">
          {t("search.filters.category")}
        </h3>
        {categories.map((category) => (
          <Checkbox
            key={category.slug}
            checked={filters.categories.includes(category.slug)}
            onChange={() => toggleCategory(category.slug)}
            label={t(`category.${category.slug}`)}
            count={counts.category[category.slug] ?? 0}
          />
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <h3 className="font-semibold text-sm text-foreground mb-2">
          {t("search.filters.brand")}
        </h3>
        {brands.map((brand) => (
          <Checkbox
            key={brand}
            checked={filters.brands.includes(brand)}
            onChange={() => toggleBrand(brand)}
            label={brand === "Бусад" ? t("common.other") : brand}
            count={counts.brand[brand] ?? 0}
          />
        ))}
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
    </aside>
  );
}
