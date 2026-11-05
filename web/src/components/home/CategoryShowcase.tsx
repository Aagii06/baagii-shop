"use client";

import SafeImage from "@/components/ui/safe-image";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatMNT } from "@/lib/utils";
import type { Product } from "@/types/product";
import Link from "next/link";

/** One grid of up to 8 product cards, with no category banner. */
export default function CategoryShowcase({ products }: { products: Product[] }) {
  const { t } = useLanguage();

  // A half-empty grid looks broken; show a full row (4) or two rows (8).
  if (products.length < 4) return null;
  const shown = products.slice(0, products.length >= 8 ? 8 : 4);

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="grid grid-cols-2 sm:grid-cols-4">
        {shown.map((product) => (
          <Link
            key={product.id}
            href={`/product/${product.id}`}
            className="group relative flex min-h-[127px] justify-between gap-2 border-b border-r border-border p-4"
          >
            <span className="min-w-0">
              <span className="line-clamp-2 text-sm text-foreground group-hover:text-primary">
                {product.name}
              </span>
              <span className="mt-1 block text-[13px] text-muted-foreground">
                {t("home.showcase.from")}
                <br />
                {formatMNT(product.price)}
              </span>
            </span>
            <SafeImage
              src={product.thumbnail || product.image}
              alt=""
              fallback="sm"
              className="h-[72px] w-[72px] shrink-0 self-end rounded-md bg-transparent object-contain transition-transform group-hover:scale-105"
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
