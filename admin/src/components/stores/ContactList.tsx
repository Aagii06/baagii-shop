"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import { useId } from "react";

const arrowClass =
  "grid h-5 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30";

/**
 * One of a store's contact lists (phones, emails, addresses): up to `max`
 * rows, the first one the main. Rows can be reordered, removed and added;
 * empty rows are dropped on save.
 */
export default function ContactList({
  title,
  addLabel,
  items,
  onChange,
  max,
  error,
  input,
}: {
  title: string;
  addLabel: string;
  items: string[];
  onChange: (items: string[]) => void;
  max: number;
  /** Shown in red under the rows. */
  error?: string;
  /** The row's input; `autoFocus` is set on a freshly added row. */
  input: (props: {
    value: string;
    onChange: (value: string) => void;
    "aria-label": string;
    "aria-invalid": boolean;
    "aria-describedby"?: string;
    autoFocus: boolean;
  }) => React.ReactNode;
}) {
  const { t } = useLanguage();
  const errorId = useId();

  const set = (i: number, value: string) => onChange(items.map((v, k) => (k === i ? value : v)));
  const move = (i: number, dir: -1 | 1) => {
    const next = [...items];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    onChange(next);
  };

  return (
    <section role="group" aria-label={title} className="space-y-2.5 rounded-2xl border border-border bg-white p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[15px] font-bold">{title}</h2>
        <span className="font-mono text-xs text-muted-foreground">
          {items.length}/{max}
        </span>
      </div>

      {items.map((value, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div className="min-w-0 flex-1">
            {input({
              value,
              onChange: (v) => set(i, v),
              "aria-label": `${title} ${i + 1}`,
              "aria-invalid": Boolean(error),
              "aria-describedby": error ? errorId : undefined,
              autoFocus: i > 0 && !value,
            })}
          </div>
          {i === 0 && items.length > 1 && (
            <span className="shrink-0 rounded-full bg-primary-soft px-2 py-1 text-[11px] font-bold text-primary-ink">
              {t("st.main")}
            </span>
          )}
          {items.length > 1 && (
            <div className="flex shrink-0 flex-col">
              <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label={t("st.moveUp")} className={arrowClass}>
                <ChevronUp className="size-4" />
              </button>
              <button
                type="button"
                disabled={i === items.length - 1}
                onClick={() => move(i, 1)}
                aria-label={t("st.moveDown")}
                className={arrowClass}
              >
                <ChevronDown className="size-4" />
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => onChange(items.filter((_, k) => k !== i))}
            aria-label={t("common.remove")}
            title={t("common.remove")}
            className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
          >
            <X className="size-4" />
          </button>
        </div>
      ))}

      {error && (
        <p id={errorId} className="px-1 text-sm text-destructive">
          {error}
        </p>
      )}

      {items.length < max && (
        <button
          type="button"
          onClick={() => onChange([...items, ""])}
          className="flex w-full items-center justify-center gap-1.5 rounded-full border border-dashed border-input py-2.5 text-sm font-semibold text-primary-ink transition-colors hover:bg-primary-soft/60"
        >
          <Plus className="size-4" strokeWidth={2.6} />
          {addLabel}
        </button>
      )}
    </section>
  );
}
