"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatMNT } from "@/lib/utils";
import { useState } from "react";

interface PriceRangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
}

const STEP = 1000;

const thumbClass =
  "absolute inset-0 w-full h-1.5 appearance-none bg-transparent pointer-events-none " +
  "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:pointer-events-auto " +
  "[&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full " +
  "[&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white " +
  "[&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:cursor-pointer " +
  "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 " +
  "[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-2 " +
  "[&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow [&::-moz-range-thumb]:cursor-pointer";

/**
 * A typed-in price: shows the formatted amount, the bare digits while
 * focused, and hands the number over on Enter or when left.
 */
function PriceInput({
  value,
  onCommit,
  label,
}: {
  value: number;
  onCommit: (value: number) => void;
  label: string;
}) {
  // The digits being typed; `null` while not editing.
  const [text, setText] = useState<string | null>(null);

  const commit = () => {
    if (text !== null && text !== "") onCommit(Number(text));
    setText(null);
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      aria-label={label}
      value={text ?? formatMNT(value)}
      onFocus={(e) => {
        setText(String(value));
        requestAnimationFrame(() => e.target.select());
      }}
      onChange={(e) => setText(e.target.value.replace(/\D/g, ""))}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key !== "Enter") return;
        e.preventDefault();
        e.currentTarget.blur();
      }}
      className="h-10 w-full min-w-0 flex-1 rounded-xl border border-input bg-transparent px-3 text-sm text-foreground tabular-nums focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
    />
  );
}

export default function PriceRangeSlider({
  min,
  max,
  value,
  onChange,
}: PriceRangeSliderProps) {
  const { t } = useLanguage();
  const [low, high] = value;
  const range = Math.max(1, max - min);
  const lowPct = ((low - min) / range) * 100;
  const highPct = ((high - min) / range) * 100;
  // All products at one price: nothing to narrow down.
  const flat = max <= min;

  // Keeps a typed or dragged range inside the bounds, low below high.
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const setLow = (n: number) => onChange([Math.min(clamp(n), high), high]);
  const setHigh = (n: number) => onChange([low, Math.max(clamp(n), low)]);

  return (
    <div>
      <div className="relative h-1.5 rounded-full bg-muted mt-4">
        <div
          className="absolute h-1.5 rounded-full bg-primary"
          style={{ left: `${lowPct}%`, right: `${100 - highPct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={STEP}
          value={low}
          disabled={flat}
          onChange={(e) => setLow(Number(e.target.value))}
          className={thumbClass}
          aria-label={t("search.priceMinAria")}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={STEP}
          value={high}
          disabled={flat}
          onChange={(e) => setHigh(Number(e.target.value))}
          className={thumbClass}
          aria-label={t("search.priceMaxAria")}
        />
      </div>

      <div className="flex items-center justify-between gap-2 mt-5">
        <PriceInput value={low} onCommit={setLow} label={t("search.priceMinAria")} />
        <span className="text-muted-foreground text-sm">—</span>
        <PriceInput value={high} onCommit={setHigh} label={t("search.priceMaxAria")} />
      </div>
    </div>
  );
}
