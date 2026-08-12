"use client";

import { formatMNT } from "@/lib/utils";

interface PriceRangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
}

const thumbClass =
  "absolute inset-0 w-full h-1.5 appearance-none bg-transparent pointer-events-none " +
  "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:pointer-events-auto " +
  "[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full " +
  "[&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white " +
  "[&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:cursor-pointer " +
  "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 " +
  "[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-2 " +
  "[&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow [&::-moz-range-thumb]:cursor-pointer";

export default function PriceRangeSlider({
  min,
  max,
  value,
  onChange,
}: PriceRangeSliderProps) {
  const [low, high] = value;
  const range = Math.max(1, max - min);
  const lowPct = ((low - min) / range) * 100;
  const highPct = ((high - min) / range) * 100;

  return (
    <div>
      <div className="relative h-1.5 rounded-full bg-muted mt-3">
        <div
          className="absolute h-1.5 rounded-full bg-primary"
          style={{ left: `${lowPct}%`, right: `${100 - highPct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={low}
          onChange={(e) =>
            onChange([Math.min(Number(e.target.value), high - 1), high])
          }
          className={thumbClass}
          aria-label="Хамгийн бага үнэ"
        />
        <input
          type="range"
          min={min}
          max={max}
          value={high}
          onChange={(e) =>
            onChange([low, Math.max(Number(e.target.value), low + 1)])
          }
          className={thumbClass}
          aria-label="Хамгийн их үнэ"
        />
      </div>

      <div className="flex items-center justify-between gap-3 mt-4">
        <div className="flex-1 rounded-lg border border-input px-3 py-1.5 text-sm text-foreground">
          {formatMNT(low)}
        </div>
        <span className="text-muted-foreground text-sm">—</span>
        <div className="flex-1 rounded-lg border border-input px-3 py-1.5 text-sm text-foreground">
          {formatMNT(high)}
        </div>
      </div>
    </div>
  );
}
