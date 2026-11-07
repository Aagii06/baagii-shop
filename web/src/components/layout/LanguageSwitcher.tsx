"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { locales } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, Globe, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function LanguageSwitcher({
  variant = "light",
}: {
  variant?: "light" | "dark";
}) {
  const { locale, setLocale, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const current = locales.find((l) => l.code === locale) ?? locales[0];

  useEffect(() => setMounted(true), []);

  // Desktop: dropdown (closes on outside click). Mobile: bottom sheet
  // (locks page scroll). Both close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ref.current?.contains(target) || sheetRef.current?.contains(target))
        return;
      setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    const isMobile = window.matchMedia("(max-width: 639px)").matches;
    const prevOverflow = document.body.style.overflow;
    if (isMobile) document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const modal = (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="language-modal-title"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div ref={sheetRef} className="relative w-full rounded-t-2xl border-t border-border bg-popover text-foreground shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2
            id="language-modal-title"
            className="flex items-center gap-2 text-base font-semibold"
          >
            <Globe className="h-4 w-4 text-primary" />
            {t("header.langAria")}
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-col gap-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {locales.map((l) => {
            const active = l.code === locale;
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => {
                  setLocale(l.code);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm transition-colors",
                  active
                    ? "border-primary bg-primary/5 font-semibold"
                    : "border-border hover:bg-muted"
                )}
              >
                <span className="flex items-center gap-3">
                  <span className="inline-flex h-7 w-9 items-center justify-center rounded-md bg-muted text-xs font-bold text-muted-foreground">
                    {l.short}
                  </span>
                  {l.label}
                </span>
                {active && <Check className="h-4 w-4 text-primary" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("header.langAria")}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          "flex items-center gap-1 text-xs font-medium transition-colors",
          variant === "dark"
            ? "text-white/90 hover:text-white"
            : "text-foreground/80 hover:text-foreground"
        )}
      >
        <Globe className="h-3.5 w-3.5" />
        {current.short}
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div className="hidden sm:block absolute right-0 mt-2 w-36 rounded-xl border border-border bg-popover shadow-lg overflow-hidden z-50 text-foreground">
          {locales.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => {
                setLocale(l.code);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
            >
              <span>{l.label}</span>
              {l.code === locale && (
                <Check className="h-3.5 w-3.5 text-primary" />
              )}
            </button>
          ))}
        </div>
      )}
      {open && mounted && createPortal(modal, document.body)}
    </div>
  );
}
