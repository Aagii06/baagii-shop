"use client";

import ProductImage from "@/components/ui/product-image";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { getProduct } from "@/lib/api/products";
import { cn, formatMNT } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import type { Product, ProductDetail, ProductVariant } from "@/types/product";
import { ArrowRight, Check, Loader2, Minus, Plus, ShoppingCart, Star, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

function findMatchingVariant(
  variants: ProductVariant[],
  selectedAttrs: Record<number, string>
) {
  return (
    variants.find((v) =>
      Object.entries(selectedAttrs).every(
        ([attrId, value]) => v.attrs[Number(attrId)] === value
      )
    ) ?? null
  );
}

interface QuickViewModalProps {
  /** Post id — the same value used in `/product/[id]` links. */
  productId: number;
  open: boolean;
  onClose: () => void;
  /** Listing-level product, shown instantly while the full detail loads. */
  preview?: Product;
}

export default function QuickViewModal({
  productId,
  open,
  onClose,
  preview,
}: QuickViewModalProps) {
  const { t } = useLanguage();
  const addLine = useCartStore((s) => s.addLine);

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [selectedAttrs, setSelectedAttrs] = useState<Record<number, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  // Fetch the full product each time the modal opens for a new id.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    setProduct(null);
    setSelectedAttrs({});
    setQuantity(1);
    setActiveImage(0);
    setJustAdded(false);

    getProduct(productId)
      .then((p) => {
        if (cancelled) return;
        setProduct(p);
        setSelectedAttrs(p.variants[0]?.attrs ?? {});
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, productId]);

  // Close on Escape and lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  const currentVariant = useMemo(
    () => (product ? findMatchingVariant(product.variants, selectedAttrs) : null),
    [product, selectedAttrs]
  );

  if (!open || typeof document === "undefined") return null;

  const hasVariants = (product?.variants.length ?? 0) > 0;
  const price = currentVariant?.price ?? product?.price ?? preview?.price ?? 0;
  const originalPrice =
    currentVariant?.originalPrice ??
    product?.originalPrice ??
    preview?.originalPrice;
  const stock = currentVariant
    ? currentVariant.stock
    : product?.stock ?? (product ? 0 : 1);
  const name = product?.name ?? preview?.name ?? "";
  const discount =
    originalPrice && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0;

  const images =
    product?.images && product.images.length > 0
      ? product.images
      : preview?.thumbnail || preview?.image
      ? [preview.thumbnail || preview.image]
      : [];

  const canAddToCart =
    !!product &&
    (!hasVariants || currentVariant !== null) &&
    stock > 0 &&
    currentVariant?.branchId != null;

  const handleSelectAttrValue = (attrId: number, value: string) => {
    if (!product) return;
    const next = { ...selectedAttrs, [attrId]: value };
    const exact = findMatchingVariant(product.variants, next);
    if (exact) {
      setSelectedAttrs(exact.attrs);
      return;
    }
    const fallback = product.variants.find((v) => v.attrs[attrId] === value);
    setSelectedAttrs(fallback ? fallback.attrs : next);
  };

  const handleAddToCart = async () => {
    if (!canAddToCart || !currentVariant || currentVariant.branchId == null) {
      return;
    }
    setIsAdding(true);
    await addLine({
      postProductId: currentVariant.id,
      branchId: currentVariant.branchId,
      qty: quantity,
    });
    setIsAdding(false);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={name}
    >
      <div
        className="absolute inset-0 bg-black/50 animate-in fade-in"
        onClick={onClose}
      />

      <div className="relative z-10 w-full sm:max-w-3xl max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-card shadow-xl animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95">
        <button
          type="button"
          onClick={onClose}
          aria-label={t("product.quickView.close")}
          className="absolute right-3 top-3 z-20 grid h-9 w-9 place-items-center rounded-full bg-background/90 text-foreground shadow-sm hover:bg-muted transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {failed ? (
          <div className="p-10 text-center">
            <p className="text-muted-foreground mb-4">
              {t("product.quickView.loadError")}
            </p>
            <Button asChild variant="outline">
              <Link href={`/product/${productId}`}>
                {t("product.quickView.details")}
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-0">
            <div className="p-4 sm:p-5">
              <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
                {images.length > 0 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={images[Math.min(activeImage, images.length - 1)]}
                    alt={name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ProductImage
                    category={preview?.category}
                    className="h-full w-full"
                  />
                )}
                {discount > 0 && (
                  <span className="absolute left-3 top-3 rounded-md bg-destructive px-2 py-1 text-xs font-bold text-destructive-foreground">
                    -{discount}%
                  </span>
                )}
              </div>
              {images.length > 1 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {images.map((src, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveImage(i)}
                      className={cn(
                        "h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition-colors",
                        activeImage === i ? "border-primary" : "border-transparent"
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt=""
                        className="h-full w-full object-cover bg-muted"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4 p-4 pt-12 sm:p-5">
              {product?.rating ? (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-medium text-foreground">
                    {product.rating.toFixed(1)}
                  </span>
                  <span>
                    · {t("product.sold", { count: product.soldCount ?? 0 })}
                  </span>
                </div>
              ) : null}

              <h2 className="text-lg font-bold leading-snug text-foreground">
                {name}
              </h2>

              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-foreground">
                  {formatMNT(price)}
                </span>
                {originalPrice && originalPrice > price && (
                  <span className="text-sm text-muted-foreground line-through">
                    {formatMNT(originalPrice)}
                  </span>
                )}
              </div>

              {loading && !product ? (
                <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : (
                <>
                  {product?.attrs.map((attr) => (
                    <div key={attr.id}>
                      <p className="mb-2 text-sm font-medium text-foreground">
                        {attr.name}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        {attr.values.map((val) => {
                          const isSelected = selectedAttrs[attr.id] === val.value;
                          if (attr.viewType === "image") {
                            return (
                              <button
                                key={val.value}
                                onClick={() =>
                                  handleSelectAttrValue(attr.id, val.value)
                                }
                                title={val.value}
                                aria-label={val.value}
                                className={cn(
                                  "h-12 w-12 overflow-hidden rounded-lg border-2 transition-shadow",
                                  isSelected ? "border-primary" : "border-border"
                                )}
                                style={
                                  val.image
                                    ? undefined
                                    : {
                                        backgroundColor:
                                          val.color ?? "var(--muted)",
                                      }
                                }
                              >
                                {val.image && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={val.image}
                                    alt={val.value}
                                    className="h-full w-full object-cover"
                                  />
                                )}
                              </button>
                            );
                          }
                          return (
                            <button
                              key={val.value}
                              onClick={() =>
                                handleSelectAttrValue(attr.id, val.value)
                              }
                              className={cn(
                                "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                                isSelected
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border text-foreground hover:border-primary/50"
                              )}
                            >
                              {val.value}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground">
                      {t("product.quantityLabel")}
                    </span>
                    <div className="flex items-center rounded-lg border border-border">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                        className="grid h-9 w-9 place-items-center rounded-l-lg hover:bg-muted disabled:opacity-40"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="min-w-10 text-center text-sm font-medium">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setQuantity((q) =>
                            Math.min(stock || q + 1, q + 1)
                          )
                        }
                        disabled={stock > 0 && quantity >= stock}
                        className="grid h-9 w-9 place-items-center rounded-r-lg hover:bg-muted disabled:opacity-40"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <span
                      className={cn(
                        "text-xs font-medium",
                        stock > 0 ? "text-emerald-600" : "text-destructive"
                      )}
                    >
                      {stock > 0
                        ? t("product.inStock")
                        : t("product.outOfStock")}
                    </span>
                  </div>

                  <Button
                    size="lg"
                    onClick={handleAddToCart}
                    disabled={isAdding || !canAddToCart}
                    className={cn(
                      "w-full transition-all",
                      justAdded
                        ? "bg-emerald-600 text-white hover:bg-emerald-600"
                        : "brand-gradient text-white hover:opacity-90"
                    )}
                  >
                    {isAdding ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t("product.addingToCart")}
                      </span>
                    ) : justAdded ? (
                      <span className="flex items-center gap-2">
                        <Check className="h-4 w-4" />
                        {t("product.addedToCart")}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4" />
                        {hasVariants && !currentVariant
                          ? t("product.quickView.selectOption")
                          : t("product.addToCart")}
                      </span>
                    )}
                  </Button>
                </>
              )}

              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full"
                onClick={onClose}
              >
                <Link href={`/product/${productId}`}>
                  {t("product.quickView.details")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
