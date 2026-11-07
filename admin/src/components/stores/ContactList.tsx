"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Pencil, Plus, Star, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDirty } from "@/lib/useDirty";

type InputProps = {
  value: string;
  onChange: (value: string) => void;
  autoFocus: boolean;
  "aria-label": string;
};

/**
 * One of a store's contact lists (phones, emails, addresses): read-only rows
 * on the form, edited all at once in a bottom sheet. Up to `max`; the first
 * one is the main — another becomes it with its star.
 */
export default function ContactList({
  title,
  hint,
  empty,
  addLabel,
  items,
  onChange,
  max,
  check,
  normalize = (value) => value.trim(),
  error,
  mono = false,
  input,
}: {
  title: string;
  hint: string;
  /** Said in place of the list while it's empty. */
  empty: string;
  /** The sheet's "+ …" button that adds a row. */
  addLabel: string;
  items: string[];
  onChange: (items: string[]) => void;
  max: number;
  /** What's wrong with a value, or `undefined`. */
  check: (value: string) => string | undefined;
  /** How a value is stored, e.g. lower-cased emails. */
  normalize?: (value: string) => string;
  /** From the form's save. */
  error?: string;
  /** Show the values in the mono font (phone numbers). */
  mono?: boolean;
  input: (props: InputProps) => React.ReactNode;
}) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const several = items.length > 1;

  return (
    <section role="group" aria-label={title} className="rounded-2xl border border-border bg-white p-4">
      <div className="mb-3 flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-bold">{title}</h2>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex shrink-0 items-center gap-1 rounded-full bg-primary-soft px-3.5 py-2 text-sm font-bold text-primary-ink transition-colors hover:bg-primary/15"
        >
          {items.length ? <Pencil className="size-3.5" /> : <Plus className="size-4" strokeWidth={2.6} />}
          {items.length ? t("common.edit") : t("common.add")}
        </button>
      </div>

      {items.length ? (
        <ul className="space-y-1">
          {items.map((value, i) => {
            const main = several && i === 0;
            return (
              <li
                key={value}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2.5",
                  main ? "bg-primary-soft text-primary-ink" : "bg-muted/50"
                )}
              >
                {main && <Star className="size-4 shrink-0 fill-current" />}
                <span
                  className={cn(
                    "min-w-0 flex-1 break-words text-[15px]",
                    main ? "font-bold" : "font-medium text-foreground/80",
                    mono && "font-mono"
                  )}
                >
                  {value}
                </span>
                {main && (
                  <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-white">
                    {t("st.main")}
                  </span>
                )}
                {several && i > 0 && (
                  <button
                    type="button"
                    onClick={() => onChange([value, ...items.filter((_, k) => k !== i)])}
                    aria-label={`${t("st.makeMain")}: ${value}`}
                    title={t("st.makeMain")}
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary-ink"
                  >
                    <Star className="size-4" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{empty}</p>
      )}

      {error && <p className="mt-2 px-1 text-sm text-destructive">{error}</p>}

      {open && (
        <ListSheet
          title={title}
          hint={hint}
          addLabel={addLabel}
          items={items}
          max={max}
          check={check}
          normalize={normalize}
          input={input}
          onSave={(next) => {
            onChange(next);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </section>
  );
}

const arrowClass =
  "grid h-5 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted disabled:opacity-30";

/**
 * The whole list as inputs: add rows, reorder with the arrows, remove, then
 * "Хадгалах" checks them and hands them back. Backdrop, Esc or "Болих" drops
 * the changes.
 */
function ListSheet({
  title,
  hint,
  addLabel,
  items,
  max,
  check,
  normalize,
  input,
  onSave,
  onClose,
}: {
  title: string;
  hint: string;
  addLabel: string;
  items: string[];
  max: number;
  check: (value: string) => string | undefined;
  normalize: (value: string) => string;
  input: (props: InputProps) => React.ReactNode;
  onSave: (items: string[]) => void;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  // An empty list opens with one row ready to type in.
  const [draft, setDraft] = useState(() => (items.length ? items : [""]));
  const [error, setError] = useState<string>();
  // The save button stays off until something changes.
  const { dirty } = useDirty(draft);

  useEffect(() => {
    dialogRef.current?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);

  function edit(next: string[]) {
    setDraft(next);
    setError(undefined);
  }

  function move(i: number, dir: -1 | 1) {
    const next = [...draft];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    edit(next);
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    // React bubbles the portal's submit up to the store form; keep it here.
    e.stopPropagation();
    if (!dirty) return;
    const clean = draft.map(normalize).filter(Boolean);
    const problem =
      clean.map(check).find(Boolean) ?? (new Set(clean).size !== clean.length ? t("st.duplicate") : undefined);
    if (problem) return setError(problem);
    onSave(clean);
  }

  // Portal: out of the store form, so Enter here saves this list, not the store.
  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      // A tap on the backdrop lands on the dialog itself, not its content.
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="inset-x-0 bottom-0 top-auto mx-auto mb-0 mt-auto max-h-[90dvh] w-full max-w-md overflow-hidden rounded-t-3xl bg-white p-0 text-foreground shadow-soft outline-none transition duration-200 ease-out backdrop:bg-black/40 starting:open:translate-y-8 starting:open:opacity-0"
    >
      <form
        onSubmit={save}
        noValidate
        className="flex max-h-[90dvh] flex-col pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3"
      >
        <div className="mx-auto mb-4 h-1 w-10 shrink-0 rounded-full bg-border" />
        <div className="px-5">
          <h2 id={titleId} className="text-lg font-bold">
            {title}
          </h2>
          <p className="text-xs text-muted-foreground">
            {hint}. {t("st.reorderHint")}
          </p>
        </div>

        <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto px-5 pb-1">
          {draft.map((value, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                {input({
                  value,
                  onChange: (v) => edit(draft.map((p, j) => (j === i ? v : p))),
                  autoFocus: !value,
                  "aria-label": `${title} ${i + 1}`,
                })}
              </div>
              <div className="flex shrink-0 flex-col">
                <button
                  type="button"
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                  aria-label={t("st.moveUp")}
                  className={arrowClass}
                >
                  <ChevronUp className="size-4" />
                </button>
                <button
                  type="button"
                  disabled={i === draft.length - 1}
                  onClick={() => move(i, 1)}
                  aria-label={t("st.moveDown")}
                  className={arrowClass}
                >
                  <ChevronDown className="size-4" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => edit(draft.filter((_, j) => j !== i))}
                aria-label={t("common.remove")}
                className="grid size-10 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-border hover:text-destructive"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
          {draft.length < max && (
            <button
              type="button"
              onClick={() => edit([...draft, ""])}
              className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-border py-3 text-sm font-bold text-primary-ink transition-colors hover:bg-muted/60"
            >
              <Plus className="size-4" strokeWidth={2.6} />
              {addLabel}
            </button>
          )}
        </div>

        <div className="shrink-0 px-5 pt-3">
          {error && <p className="mb-2 px-1 text-sm text-destructive">{error}</p>}
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" className="h-12" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" className="h-12" disabled={!dirty}>
              {t("common.save")}
            </Button>
          </div>
        </div>
      </form>
    </dialog>,
    document.body
  );
}
