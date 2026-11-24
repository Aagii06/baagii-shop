"use client";

import Thumb from "@/components/common/Thumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Store } from "@/lib/api/stores";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, Search, Store as StoreIcon } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

/** From this many stores on, the sheet gets a search box. */
const SEARCH_FROM = 8;

/**
 * Filters by any number of seller stores, picked in a bottom sheet with each
 * store's logo — shaped like `CategoryFilter`. Empty means all stores.
 */
export default function StoreFilter({
  stores,
  value,
  onChange,
}: {
  stores: Store[];
  value: number[];
  onChange: (value: number[]) => void;
}) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const picked = new Set(value);
  const names = stores.filter((s) => picked.has(s.id)).map((s) => s.name);
  const label = names.length === 0 ? t("products.allStores") : names.length <= 2 ? names.join(", ") : t("products.storeCount", { count: names.length });

  return (
    <div className="relative min-w-0">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`${t("products.storeFilter")}: ${label}`}
        onClick={() => setOpen(true)}
        className={cn(
          "flex h-12 w-full items-center gap-2 rounded-full border border-input bg-white px-5 pr-12 text-left text-[15px] focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15",
          names.length === 0 && "text-muted-foreground",
          names.length > 0 && "border-primary/50 font-semibold"
        )}
      >
        <StoreIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate">{label}</span>
      </button>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
      {open && (
        <StoreSheet
          stores={stores}
          value={value}
          onDone={(next) => {
            setOpen(false);
            triggerRef.current?.focus();
            onChange(next);
          }}
          onClose={() => {
            setOpen(false);
            triggerRef.current?.focus();
          }}
        />
      )}
    </div>
  );
}

function StoreSheet({
  stores,
  value,
  onDone,
  onClose,
}: {
  stores: Store[];
  value: number[];
  onDone: (value: number[]) => void;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  // Ticks stay in the sheet until "done", so closing it changes nothing.
  const [picked, setPicked] = useState(() => new Set(value));
  const [q, setQ] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    dialog?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);

  function toggle(id: number) {
    const next = new Set(picked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setPicked(next);
  }

  const needle = q.trim().toLowerCase();
  const rows = needle ? stores.filter((s) => s.name.toLowerCase().includes(needle)) : stores;

  const row = (id: number, name: string, logo: React.ReactNode) => {
    const on = picked.has(id);
    return (
      <li key={id} role="none">
        <button
          type="button"
          role="option"
          aria-selected={on}
          onClick={() => toggle(id)}
          className={cn(
            "flex w-full items-center gap-3 border-b border-border px-5 py-3 text-left text-[15px] font-semibold hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none",
            on && "text-primary"
          )}
        >
          {logo}
          <span className="min-w-0 flex-1 truncate">{name}</span>
          <span
            aria-hidden
            className={cn(
              "grid size-5 shrink-0 place-items-center rounded-md border-2",
              on ? "border-primary bg-primary text-primary-foreground" : "border-input bg-white"
            )}
          >
            {on && <Check className="size-3.5" strokeWidth={3.5} />}
          </span>
        </button>
      </li>
    );
  };

  return createPortal(
    <dialog
      ref={dialogRef}
      tabIndex={-1}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="inset-x-0 bottom-0 top-auto mx-auto mb-0 mt-auto max-h-[80dvh] w-full max-w-md overflow-hidden rounded-t-3xl bg-white p-0 text-foreground shadow-soft outline-none transition duration-200 ease-out backdrop:bg-black/40 starting:open:translate-y-8 starting:open:opacity-0"
    >
      <div className="flex max-h-[80dvh] flex-col">
        <div className="shrink-0 px-5 pt-3">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
          <h2 id={titleId} className="truncate text-lg font-bold">
            {t("products.storeFilter")}
          </h2>
          {stores.length >= SEARCH_FROM && (
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

        <ul role="listbox" aria-labelledby={titleId} aria-multiselectable className="mt-2 min-h-0 flex-1 overflow-y-auto">
          {rows.map((s) => row(s.id, s.name, <Thumb id={s.logo} variant="icon" size={36} className="rounded-xl" />))}
          {needle && rows.length === 0 && <li className="py-10 text-center text-sm text-muted-foreground">{t("common.noResults")}</li>}
        </ul>

        <div className="grid shrink-0 grid-cols-2 gap-3 border-t border-border px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <Button type="button" variant="outline" disabled={picked.size === 0} onClick={() => setPicked(new Set())}>
            {t("cf.clear")}
          </Button>
          <Button type="button" onClick={() => onDone([...picked])}>
            {t("common.done")}
          </Button>
        </div>
      </div>
    </dialog>,
    document.body
  );
}
