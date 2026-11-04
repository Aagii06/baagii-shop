"use client";

import { Input } from "@/components/ui/input";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, Search } from "lucide-react";
import { Children, isValidElement, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

/** From this many options on, the sheet gets a search box. */
const SEARCH_FROM = 12;

type OptionItem = { value: string; label: React.ReactNode; text: string };

const textOf = (node: React.ReactNode): string =>
  Children.toArray(node)
    .map((n) =>
      typeof n === "string" || typeof n === "number"
        ? String(n)
        : isValidElement<{ children?: React.ReactNode }>(n)
          ? textOf(n.props.children)
          : ""
    )
    .join("");

/** `<option>` children (conditionals and lists included) → plain items. */
function readOptions(children: React.ReactNode): OptionItem[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement<{ value?: string | number; children?: React.ReactNode }>(child) || child.type !== "option") return [];
    const label = child.props.children;
    return [{ value: String(child.props.value ?? textOf(label)), label, text: textOf(label) }];
  });
}

/**
 * Stands in for `<select>`: same `<option>` children, but picking happens in
 * a bottom sheet, at most 70% of the screen high.
 * `onChange` gets the picked option's value.
 */
export default function Select({
  value,
  onChange,
  children,
  title,
  disabled,
  className,
  id,
  ...aria
}: {
  value: string | number;
  onChange: (value: string) => void;
  children: React.ReactNode;
  /** The sheet's heading; defaults to the empty option's label. */
  title?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const options = readOptions(children);
  const current = String(value ?? "");
  const selected = options.find((o) => o.value === current);
  const placeholder = options.find((o) => !o.value);

  function pick(next: string) {
    setOpen(false);
    triggerRef.current?.focus();
    if (next !== current) onChange(next);
  }

  return (
    <div className="relative min-w-0">
      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        {...aria}
        className={cn(
          "flex h-12 w-full items-center rounded-full border border-input bg-white px-5 pr-12 text-left text-[15px] focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70 aria-invalid:border-destructive",
          !current && "text-muted-foreground",
          className
        )}
      >
        <span className="min-w-0 flex-1 truncate">{selected?.label ?? (current || t("common.select"))}</span>
      </button>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
      {open && (
        <OptionSheet
          title={title ?? placeholder?.text ?? t("common.select")}
          options={options}
          value={current}
          onPick={pick}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

function OptionSheet({
  title,
  options,
  value,
  onPick,
  onClose,
}: {
  title: string;
  options: OptionItem[];
  value: string;
  onPick: (value: string) => void;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const [q, setQ] = useState("");
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const needle = q.trim().toLowerCase();
  const rows = needle ? options.filter((o) => o.text.toLowerCase().includes(needle)) : options;

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    // Focus the sheet, not the search box: on a phone the keyboard would cover half the list.
    dialog?.focus();
    // Start with the chosen row in view.
    listRef.current?.querySelector("[aria-selected='true']")?.scrollIntoView({ block: "center" });
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);

  // Portal: outside the field's <label>, so taps in the sheet don't re-open the select.
  return createPortal(
    <dialog
      ref={dialogRef}
      tabIndex={-1}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      // A tap on the backdrop lands on the dialog itself, not its content.
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="inset-x-0 bottom-0 top-auto mx-auto mb-0 mt-auto max-h-[70dvh] w-full max-w-md overflow-hidden rounded-t-3xl bg-white p-0 text-foreground shadow-soft outline-none transition duration-200 ease-out backdrop:bg-black/40 starting:open:translate-y-8 starting:open:opacity-0"
    >
      <div className="flex max-h-[70dvh] flex-col">
        <div className="shrink-0 px-5 pt-3">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
          <h2 id={titleId} className="truncate text-lg font-bold">
            {title}
          </h2>
          {options.length >= SEARCH_FROM && (
            <div className="relative mt-3">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("common.search")}
                aria-label={t("common.search")}
                className="pl-10"
              />
            </div>
          )}
        </div>
        <div
          ref={listRef}
          role="listbox"
          aria-labelledby={titleId}
          className="mt-2 min-h-0 flex-1 divide-y divide-border overflow-y-auto pb-[max(0.5rem,env(safe-area-inset-bottom))]"
        >
          {rows.length ? (
            rows.map((o) => {
              const active = o.value === value;
              return (
                <button
                  key={o.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => onPick(o.value)}
                  className={cn(
                    "flex w-full items-center gap-3 px-5 py-4 text-left text-[15px] hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none",
                    active && "font-bold text-primary",
                    !o.value && !active && "text-muted-foreground"
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">{o.label}</span>
                  {active && <Check className="size-4 shrink-0" strokeWidth={3} />}
                </button>
              );
            })
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">{t("common.noResults")}</p>
          )}
        </div>
      </div>
    </dialog>,
    document.body
  );
}
