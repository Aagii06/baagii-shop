"use client";

import { cn } from "@/lib/utils";

export type SortOption = "popular" | "new" | "price-asc" | "rating";

const options: { value: SortOption; label: string }[] = [
  { value: "popular", label: "Эрэлттэй" },
  { value: "new", label: "Шинэ" },
  { value: "price-asc", label: "Үнэ өсөхөөр" },
  { value: "rating", label: "Үнэлгээ" },
];

export default function SortTabs({
  value,
  onChange,
}: {
  value: SortOption;
  onChange: (value: SortOption) => void;
}) {
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
