"use client";

import SafeImage from "@/components/ui/safe-image";
import { useCategories } from "@/lib/categories/CategoriesProvider";
import { categoryHref, subtreeIds, type Category } from "@/lib/categories";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatMNT } from "@/lib/utils";
import type { Product } from "@/types/product";
import Link from "next/link";

// Soft backgrounds for the banner tile, picked by the block's position.
const TILE_BACKGROUNDS = [
  "from-[#fff3e0] to-[#ffe0b2]",
  "from-[#e3f2fd] to-[#bbdefb]",
  "from-[#e8f5e9] to-[#c8e6c9]",
];

function CategoryBlock({
  category,
  products,
  index,
}: {
  category: Category;
  products: Product[];
  index: number;
}) {
  const { t } = useLanguage();

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex flex-col lg:flex-row">
        <div
          className={`relative flex shrink-0 flex-col justify-between gap-4 overflow-hidden bg-gradient-to-br p-5 lg:w-[280px] ${
            TILE_BACKGROUNDS[index % TILE_BACKGROUNDS.length]
          }`}
        >
          <h2 className="relative z-10 max-w-[160px] text-xl font-semibold leading-snug text-foreground">
            {category.name}
          </h2>
          {category.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={category.image}
              alt=""
              className="pointer-events-none absolute -bottom-2 -right-2 h-32 w-32 object-contain opacity-80 lg:h-40 lg:w-40"
            />
          )}
          <Link
            href={categoryHref(category)}
            className="relative z-10 w-fit rounded-md bg-white px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-white/80"
          >
            {t("home.allProducts.viewAll")}
          </Link>
        </div>

        <div className="grid flex-1 grid-cols-2 sm:grid-cols-4">
          {products.map((product) => (
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
      </div>
    </section>
  );
}

/** A block per top-level category: a banner tile and up to 8 of its products. */
export default function CategoryShowcase({ products }: { products: Product[] }) {
  const { categories } = useCategories();

  const blocks = categories
    .map((category) => {
      const ids = new Set(subtreeIds(category));
      return {
        category,
        products: products
          .filter((p) => p.categoryId !== undefined && ids.has(p.categoryId))
          .slice(0, 8),
      };
    })
    // A half-empty grid looks broken; only show categories that fill a row.
    .filter((block) => block.products.length >= 4)
    .slice(0, 3);

  return (
    <>
      {blocks.map((block, i) => (
        <CategoryBlock
          key={block.category.id}
          category={block.category}
          products={block.products.slice(0, block.products.length >= 8 ? 8 : 4)}
          index={i}
        />
      ))}
    </>
  );
}
