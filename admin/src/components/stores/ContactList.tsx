"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { useId, useState } from "react";

/**
 * One of a store's contact lists (phones, emails, addresses): a value is
 * typed in and added with "+", then sits in the list below with edit and
 * delete buttons. Up to `max`; the first one is the main.
 */
export default function ContactList({
  title,
  items,
  onChange,
  max,
  draft,
  onDraftChange,
  check,
  normalize = (value) => value.trim(),
  emptyError,
  error,
  mono = false,
  input,
}: {
  title: string;
  items: string[];
  onChange: (items: string[]) => void;
  max: number;
  /** What's typed in but not added yet — the form refuses to save over it. */
  draft: string;
  onDraftChange: (draft: string) => void;
  /** What's wrong with a value about to be added, or `undefined`. */
  check: (value: string) => string | undefined;
  /** How a value is stored, e.g. lower-cased emails. */
  normalize?: (value: string) => string;
  /** Said when "+" is pressed with nothing to add; otherwise it does nothing. */
  emptyError?: string;
  /** From the form's save; shown when the row has nothing of its own to say. */
  error?: string;
  /** Show the values in the mono font (phone numbers). */
  mono?: boolean;
  input: (props: {
    value: string;
    onChange: (value: string) => void;
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    "aria-label": string;
    "aria-invalid": boolean;
    "aria-describedby"?: string;
  }) => React.ReactNode;
}) {
  const { t } = useLanguage();
  const errorId = useId();
  // The row being edited: its value is back in the input until ✓.
  const [editing, setEditing] = useState<number | null>(null);
  const [rowError, setRowError] = useState<string>();
  const shownError = rowError ?? error;
  const full = items.length >= max && editing == null;

  function commit() {
    const value = normalize(draft);
    if (!value) return setRowError(emptyError);
    const others = items.filter((_, i) => i !== editing);
    const problem = others.includes(value) ? t("st.duplicate") : check(value);
    if (problem) return setRowError(problem);
    onChange(editing == null ? [...items, value] : items.map((v, i) => (i === editing ? value : v)));
    onDraftChange("");
    setEditing(null);
    setRowError(undefined);
  }

  function cancelEdit() {
    onDraftChange("");
    setEditing(null);
    setRowError(undefined);
  }

  return (
    <section role="group" aria-label={title} className="space-y-3 rounded-2xl border border-border bg-white p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[15px] font-bold">{title}</h2>
        <span className="font-mono text-xs text-muted-foreground">
          {items.length}/{max}
        </span>
      </div>

      {!full && (
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            {input({
              value: draft,
              onChange: (value) => {
                onDraftChange(value);
                setRowError(undefined);
              },
              onKeyDown: (e) => {
                // Enter adds the value instead of submitting the whole form.
                if (e.key !== "Enter") return;
                e.preventDefault();
                commit();
              },
              "aria-label": title,
              "aria-invalid": Boolean(shownError),
              "aria-describedby": shownError ? errorId : undefined,
            })}
          </div>
          {editing != null && (
            <Button type="button" variant="outline" size="icon" className="size-12 shrink-0" aria-label={t("common.cancel")} title={t("common.cancel")} onClick={cancelEdit}>
              <X />
            </Button>
          )}
          <Button
            type="button"
            size="icon"
            className="size-12 shrink-0"
            aria-label={editing != null ? t("common.save") : t("common.add")}
            title={editing != null ? t("common.save") : t("common.add")}
            onClick={commit}
          >
            {editing != null ? <Check /> : <Plus />}
          </Button>
        </div>
      )}

      {shownError && (
        <p id={errorId} className="px-1 text-sm text-destructive">
          {shownError}
        </p>
      )}

      {items.length > 0 && (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {items.map((value, i) => (
            <li
              key={value}
              className={cn("flex items-center gap-2 py-1.5 pl-4 pr-1.5", editing === i && "bg-primary-soft/60")}
            >
              <span className={cn("min-w-0 flex-1 break-words text-[15px] font-semibold", mono && "font-mono")}>
                {value}
              </span>
              {i === 0 && items.length > 1 && (
                <span className="shrink-0 rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-bold text-primary-ink">
                  {t("st.main")}
                </span>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0"
                aria-label={`${t("common.edit")}: ${value}`}
                title={t("common.edit")}
                onClick={() => {
                  setEditing(i);
                  onDraftChange(value);
                  setRowError(undefined);
                }}
              >
                <Pencil />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0 hover:text-destructive"
                aria-label={`${t("common.delete")}: ${value}`}
                title={t("common.delete")}
                onClick={() => {
                  onChange(items.filter((_, k) => k !== i));
                  if (editing != null) cancelEdit();
                }}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
