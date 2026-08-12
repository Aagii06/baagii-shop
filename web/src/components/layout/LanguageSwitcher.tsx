"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { locales } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, Globe } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function LanguageSwitcher({
  variant = "light",
}: {
  variant?: "light" | "dark";
}) {
  const { locale, setLocale, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = locales.find((l) => l.code === locale) ?? locales[0];

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("header.langAria")}
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
        <div className="absolute right-0 mt-2 w-36 rounded-xl border border-border bg-popover shadow-lg overflow-hidden z-50 text-foreground">
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
    </div>
  );
}
