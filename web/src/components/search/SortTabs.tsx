"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type SortOption = "discount" | "new" | "price-asc" | "rating";

export default function SortTabs({
  value,
  onChange,
}: {
  value: SortOption;
  onChange: (value: SortOption) => void;
}) {
  const { t } = useLanguage();

  const options: { value: SortOption; label: string }[] = [
    { value: "discount", label: t("search.sort.discount") },
    { value: "new", label: t("search.sort.new") },
    { value: "price-asc", label: t("search.sort.priceAsc") },
    { value: "rating", label: t("search.sort.rating") },
  ];

  return (
    <Select value={value} onValueChange={(v) => onChange(v as SortOption)}>
      <SelectTrigger
        aria-label={t("search.sort.label")}
        className="h-10 w-52 rounded-xl bg-card"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
