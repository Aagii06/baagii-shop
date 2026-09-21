"use client";

import { cn } from "@/lib/utils";

/** Single-select pill filters in a row that scrolls sideways past the edge. */
export default function ChipTabs<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  /** Accessible name for the group. */
  label: string;
  value: T;
  /** `count` shows as a badge after the label when above zero. */
  options: { value: T; label: React.ReactNode; count?: number }[];
  onChange: (value: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={(e) => {
              // Bring a half-hidden chip at the row's edge fully into view.
              e.currentTarget.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
              onChange(option.value);
            }}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-white text-foreground hover:bg-muted"
            )}
          >
            {option.label}
            {option.count ? (
              <span
                className={cn(
                  "-my-0.5 -mr-1.5 grid h-5 min-w-5 place-items-center rounded-full px-1.5 font-mono text-xs font-bold leading-none",
                  active ? "bg-white text-primary-ink" : "bg-primary text-primary-foreground"
                )}
              >
                {option.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
