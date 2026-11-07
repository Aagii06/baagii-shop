"use client";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

const pad = (n: number) => String(n).padStart(2, "0");
/** `YYYY-MM-DD` of a local date. */
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const todayIso = () => {
  const now = new Date();
  return iso(now.getFullYear(), now.getMonth(), now.getDate());
};

/**
 * Stands in for `<input type="date">`: the day is picked on a calendar in a
 * bottom sheet, like `Select`. `value` / `onChange` are `YYYY-MM-DD` or "".
 * Days outside `min`..`max` can't be picked.
 */
export default function DatePicker({
  value,
  onChange,
  title,
  min,
  max,
  disabled,
  className,
  id,
  ref,
  ...aria
}: {
  value: string;
  onChange: (value: string) => void;
  /** The trigger button, e.g. to focus it. */
  ref?: React.Ref<HTMLButtonElement>;
  /** The sheet's heading. */
  title: string;
  min?: string;
  max?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const setTrigger = (node: HTMLButtonElement | null) => {
    triggerRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  function pick(next: string) {
    setOpen(false);
    triggerRef.current?.focus();
    if (next !== value) onChange(next);
  }

  return (
    <div className="relative min-w-0">
      <button
        ref={setTrigger}
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        {...aria}
        className={cn(
          "flex h-12 w-full items-center rounded-full border border-input bg-white px-5 pr-11 text-left font-mono text-[15px] focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70 aria-invalid:border-destructive",
          !value && "font-sans text-muted-foreground",
          className
        )}
      >
        <span className="min-w-0 flex-1 truncate">{value || t("common.select")}</span>
      </button>
      <CalendarDays
        aria-hidden="true"
        className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
      {open && (
        <CalendarSheet
          title={title}
          value={value}
          min={min}
          max={max}
          onPick={pick}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

function CalendarSheet({
  title,
  value,
  min,
  max,
  onPick,
  onClose,
}: {
  title: string;
  value: string;
  min?: string;
  max?: string;
  onPick: (value: string) => void;
  onClose: () => void;
}) {
  const { t, locale } = useLanguage();
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const today = todayIso();
  // The month shown: the picked day's, else the nearest allowed one to today.
  const [month, setMonth] = useState(() => {
    const start = value || (min && min > today ? min : max && max < today ? max : today);
    const [y, m] = start.split("-").map(Number);
    return { y, m: m - 1 };
  });

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

  const shift = (by: number) =>
    setMonth(({ y, m }) => {
      const next = new Date(y, m + by, 1);
      return { y: next.getFullYear(), m: next.getMonth() };
    });

  // Weeks start on Monday.
  const lead = (new Date(month.y, month.m, 1).getDay() + 6) % 7;
  const days = new Date(month.y, month.m + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const allowed = (day: string) => (!min || day >= min) && (!max || day <= max);
  const monthLabel =
    locale === "mn"
      ? t("dp.month", { year: month.y, month: month.m + 1 })
      : new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", { month: "long", year: "numeric" }).format(
          new Date(month.y, month.m, 1)
        );
  // Whole months before `min` / after `max` have nothing to pick.
  const firstOfMonth = iso(month.y, month.m, 1);
  const lastOfMonth = iso(month.y, month.m, days);

  // Portal: outside the field's <label>, so taps in the sheet don't re-open it.
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
      className="inset-x-0 bottom-0 top-auto mx-auto mb-0 mt-auto max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-0 text-foreground shadow-soft outline-none transition duration-200 ease-out backdrop:bg-black/40 starting:open:translate-y-8 starting:open:opacity-0"
    >
      <div className="px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
        <h2 id={titleId} className="truncate text-lg font-bold">
          {title}
        </h2>

        <div className="mt-3 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t("dp.prevMonth")}
            disabled={Boolean(min && firstOfMonth <= min)}
            onClick={() => shift(-1)}
          >
            <ChevronLeft />
          </Button>
          <span className="text-[15px] font-bold" aria-live="polite">
            {monthLabel}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t("dp.nextMonth")}
            disabled={Boolean(max && lastOfMonth >= max)}
            onClick={() => shift(1)}
          >
            <ChevronRight />
          </Button>
        </div>

        <div className="mt-2 grid grid-cols-7 gap-1 text-center">
          {t("dp.weekdays")
            .split(",")
            .map((day) => (
              <span key={day} className="py-1 text-xs text-muted-foreground">
                {day}
              </span>
            ))}
          {cells.map((day, i) => {
            if (day == null) return <span key={`lead-${i}`} />;
            const date = iso(month.y, month.m, day);
            const active = date === value;
            const ok = allowed(date);
            return (
              <button
                key={date}
                type="button"
                disabled={!ok}
                aria-pressed={active}
                aria-label={date}
                onClick={() => onPick(date)}
                className={cn(
                  "mx-auto grid size-10 place-items-center rounded-full font-mono text-[15px] transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 disabled:pointer-events-none disabled:text-muted-foreground/40",
                  date === today && !active && "font-bold text-primary ring-1 ring-primary/40",
                  active && "bg-primary font-bold text-primary-foreground hover:bg-primary"
                )}
              >
                {day}
              </button>
            );
          })}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="button" disabled={!allowed(today)} onClick={() => onPick(today)}>
            {t("dp.today")}
          </Button>
        </div>
      </div>
    </dialog>,
    document.body
  );
}
