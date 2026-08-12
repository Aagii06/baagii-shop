"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";

export type SortOption = "popular" | "new" | "price-asc" | "rating";

export default function SortTabs({
  value,
  onChange,
}: {
  value: SortOption;
  onChange: (value: SortOption) => void;
}) {
  const { t } = useLanguage();

  const options: { value: SortOption; label: string }[] = [
    { value: "popular", label: t("search.sort.popular") },
    { value: "new", label: t("search.sort.new") },
    { value: "price-asc", label: t("search.sort.priceAsc") },
    { value: "rating", label: t("search.sort.rating") },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
            value === option.value
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border text-foreground hover:bg-muted"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
