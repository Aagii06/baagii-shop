"use client";

import SafeImage from "@/components/ui/safe-image";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { Product } from "@/types/product";
import Link from "next/link";
import { useEffect, useState } from "react";

// Time left until local midnight, when "today's" deals end.
function useEndOfDayCountdown() {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => {
      const end = new Date();
      end.setHours(24, 0, 0, 0);
      setLeft(Math.max(0, end.getTime() - Date.now()));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return left;
}

/** Discounted products under a countdown; hidden when nothing is on sale. */
export default function DealsSection({ products }: { products: Product[] }) {
  const { t } = useLanguage();
  const left = useEndOfDayCountdown();

  const deals = products
    .filter((p) => p.originalPrice && p.originalPrice > p.price)
    .map((p) => ({
      product: p,
      discount: Math.round(((p.originalPrice! - p.price) / p.originalPrice!) * 100),
    }))
    .sort((a, b) => b.discount - a.discount)
    .slice(0, 5);

  if (deals.length === 0) return null;

  const seconds = Math.floor((left ?? 0) / 1000);
  const units = [
    { value: 0, label: t("home.deals.days") },
    { value: Math.floor(seconds / 3600), label: t("home.deals.hours") },
    { value: Math.floor((seconds % 3600) / 60), label: t("home.deals.min") },
    { value: seconds % 60, label: t("home.deals.sec") },
  ];

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex flex-col lg:flex-row">
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border p-5 lg:w-[280px] lg:flex-col lg:items-start lg:justify-start lg:border-b-0 lg:border-r">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {t("home.deals.title")}
            </h2>
            <p className="text-muted-foreground">{t("home.deals.subtitle")}</p>
          </div>
          <div className="flex gap-1.5" aria-live="off">
            {units.map((unit) => (
              <span
                key={unit.label}
                className="flex w-12 flex-col items-center rounded-md bg-[#606060] py-1.5 text-white"
              >
                <span className="text-base font-bold leading-tight tabular-nums">
                  {left === null ? "--" : String(unit.value).padStart(2, "0")}
                </span>
                <span className="text-[11px] leading-tight">{unit.label}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="grid flex-1 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {deals.map(({ product, discount }) => (
            <Link
              key={product.id}
              href={`/product/${product.id}`}
              className="group flex flex-col items-center gap-3 border-b border-r border-border p-4 text-center last:border-r-0 lg:border-b-0"
            >
              <SafeImage
                src={product.thumbnail || product.image}
                alt={product.name}
                fallback="sm"
                className="h-28 w-28 rounded-md bg-transparent object-contain transition-transform group-hover:scale-105 sm:h-32 sm:w-32"
              />
              <span className="line-clamp-1 text-sm text-foreground">
                {product.name}
              </span>
              <span className="rounded-full bg-[#ffe3e3] px-3 py-1 text-sm font-medium text-[#eb001b]">
                -{discount}%
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
