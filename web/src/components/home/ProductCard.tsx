"use client";

import QuickViewModal from "@/components/product/QuickViewModal";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatMNT } from "@/lib/utils";
import { useSavedStore } from "@/store/savedStore";
import { cn } from "@/lib/utils";
import { fileUrl } from "@/lib/api/files";
import { storeHref } from "@/lib/api/stores";
import { ChevronRight, Heart, MoreHorizontal, Star } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import SafeImage from "@/components/ui/safe-image";
import StoreAvatar from "@/components/ui/store-avatar";

interface Product {
  id: number;
  image: string;
  thumbnail?: string;
  grid?: string;
  category?: string;
  name: string;
  price: number;
  originalPrice?: number;
  rating?: number;
  reviewCount?: number;
  soldCount?: number;
  /** Seller store's name and logo file id. */
  brand?: string;
  brandLogo?: string;
  storeId?: number;
}

export default function ProductCard({
  product,
  hideStore = false,
}: {
  product: Product;
  /** On a store's own page every card is that store's — no store pill. */
  hideStore?: boolean;
}) {
  const { t } = useLanguage();
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  // The store pill's page leads back here.
  const pathname = usePathname();

  const toggleSaved = useSavedStore((s) => s.toggle);
  const isSaved = useSavedStore((s) => s.items.some((p) => p.id === product.id));

  const handleToggleSaved = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSaved(product);
  };

  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) *
            100
        )
      : 0;

  return (
    <>
      <Card className="group relative overflow-hidden rounded-lg border-border bg-card py-0 gap-0 shadow-none transition-shadow duration-300 hover:shadow-md">
        <button
          type="button"
          onClick={() => setQuickViewOpen(true)}
          aria-label={product.name}
          className="block w-full cursor-pointer text-left relative"
        >
          <div className="relative aspect-square overflow-hidden border-b border-border bg-white">
            <SafeImage
              src={[product.grid, product.thumbnail, product.image]}
              alt={product.name}
              className="h-full w-full object-cover bg-white transition-transform duration-300 group-hover:scale-105"
            />
            {discount > 0 && (
              <span className="absolute top-2 left-2 rounded-md bg-destructive px-2 py-1 text-xs font-bold text-destructive-foreground">
                -{discount}%
              </span>
            )}
          </div>
        </button>

        <button
          type="button"
          onClick={handleToggleSaved}
          aria-label={t(isSaved ? "saved.removeAria" : "saved.saveAria")}
          aria-pressed={isSaved}
          className="absolute right-2 top-2 z-10 grid h-9 w-9 cursor-pointer place-items-center rounded-md border border-border bg-white shadow-sm transition-colors hover:border-primary"
        >
          <Heart
            className={cn(
              "h-4 w-4 transition-colors",
              isSaved
                ? "fill-destructive text-destructive"
                : "text-primary"
            )}
          />
        </button>

        <CardContent className="p-3 sm:p-4 space-y-1.5">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-base font-semibold text-foreground sm:text-lg">
              {formatMNT(product.price)}
            </span>
            {discount > 0 && (
              <span className="text-sm text-muted-foreground line-through">
                {formatMNT(product.originalPrice!)}
              </span>
            )}
          </div>

          {product.rating && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="font-medium text-foreground">
                {product.rating.toFixed(1)}
              </span>
              <span>
                · {t("product.sold", { count: product.soldCount ?? product.reviewCount ?? 0 })}
              </span>
            </div>
          )}

          <div className="flex items-start justify-between gap-2">
            <button
              type="button"
              onClick={() => setQuickViewOpen(true)}
              className="block min-w-0 flex-1 cursor-pointer text-left"
            >
              <h3 className="line-clamp-2 min-h-10 text-sm text-muted-foreground transition-colors hover:text-primary">
                {product.name}
              </h3>
            </button>
            <button
              type="button"
              onClick={() => setQuickViewOpen(true)}
              aria-label={t("product.quickView.open")}
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-border text-primary transition-colors hover:bg-accent"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </CardContent>

        {product.brand && !hideStore && (
          <Link
            href={product.storeId ? storeHref(product.storeId, pathname) : `/search?store=${encodeURIComponent(product.brand)}`}
            title={product.brand}
            className="group/store mx-3 mb-3 flex items-center gap-2 rounded-full border border-border bg-muted/40 py-1 pl-1 pr-2.5 transition-colors hover:border-primary/40 hover:bg-accent sm:mx-4 sm:mb-4"
          >
            <span className="grid size-6 shrink-0 place-items-center overflow-hidden rounded-full bg-white ring-1 ring-border">
              <StoreAvatar
                name={product.brand}
                src={fileUrl(product.brandLogo, "icon")}
                className="size-full bg-white object-contain"
                initialsClassName="text-[9px]"
              />
            </span>
            <span className="min-w-0 flex-1 truncate text-xs font-medium text-muted-foreground transition-colors group-hover/store:text-primary">
              {product.brand}
            </span>
            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/60 transition-transform group-hover/store:translate-x-0.5 group-hover/store:text-primary" />
          </Link>
        )}
      </Card>

      <QuickViewModal
        productId={product.id}
        open={quickViewOpen}
        onClose={() => setQuickViewOpen(false)}
        preview={product}
      />
    </>
  );
}
