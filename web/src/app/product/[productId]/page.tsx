"use client";

import ProductImage from "@/components/ui/product-image";
import ProductBreadcrumb from "@/components/product/ProductBreadcrumb";
import ProductNotFound from "@/components/product/ProductNotFound";
import RelatedProducts from "@/components/product/RelatedProducts";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { getProduct } from "@/lib/api/products";
import { cn, formatMNT } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import type { Product, ProductDetail, ProductVariant } from "@/types/product";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Minus,
  Plus,
  ShoppingCart,
  Star,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

function findMatchingVariant(
  variants: ProductVariant[],
  selectedAttrs: Record<number, string>
) {
  return (
    variants.find((v) =>
      Object.entries(selectedAttrs).every(([attrId, value]) => v.attrs[Number(attrId)] === value)
    ) ?? null
  );
}

const specKeys: { key: keyof Product; labelKey: string }[] = [
  { key: "material", labelKey: "product.spec.material" },
  { key: "dimensions", labelKey: "product.spec.dimensions" },
  { key: "weight", labelKey: "product.spec.weight" },
  { key: "origin", labelKey: "product.spec.origin" },
];

export default function ProductPage() {
  const { t } = useLanguage();
  const addLine = useCartStore((s) => s.addLine);
  const { productId } = useParams();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [selectedAttrs, setSelectedAttrs] = useState<Record<number, string>>({});
  const [activeThumb, setActiveThumb] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const galleryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getProduct(parseInt(productId as string))
      .then((p) => {
        if (!cancelled) {
          setProduct(p);
          setSelectedAttrs(p.variants[0]?.attrs ?? {});
          setActiveThumb(0);
        }
      })
      .catch(() => {
        if (!cancelled) setProduct(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const currentVariant = useMemo(
    () => (product ? findMatchingVariant(product.variants, selectedAttrs) : null),
    [product, selectedAttrs]
  );

  useEffect(() => {
    setQuantity(1);
  }, [currentVariant?.id]);

  useEffect(() => {
    setActiveThumb(0);
  }, [selectedAttrs]);

  useEffect(() => {
    const el = galleryRef.current;
    if (!el) return;
    const target = el.clientWidth * activeThumb;
    if (Math.abs(el.scrollLeft - target) > 4) {
      el.scrollTo({ left: target, behavior: "smooth" });
    }
  }, [activeThumb]);

  if (loading) {
    return null;
  }

  if (!product) {
    return <ProductNotFound />;
  }

  const hasVariants = product.variants.length > 0;
  const selectedAttrImages = Array.from(
    new Set(
      product.attrs
        .flatMap((attr) =>
          attr.values.filter((v) => selectedAttrs[attr.id] === v.value)
        )
        .flatMap((v) => [v.image, ...(v.images ?? [])])
        .filter((url): url is string => !!url)
    )
  );
  const images =
    selectedAttrImages.length > 0 ? selectedAttrImages : product.images ?? [];

  const handleGalleryScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    setActiveThumb((prev) => (prev === idx ? prev : idx));
  };

  const goToImage = (i: number) => {
    const clamped = Math.max(0, Math.min(images.length - 1, i));
    galleryRef.current?.scrollTo({
      left: galleryRef.current.clientWidth * clamped,
      behavior: "smooth",
    });
    setActiveThumb(clamped);
  };
  const price = currentVariant?.price ?? product.price;
  const originalPrice = currentVariant?.originalPrice ?? product.originalPrice;
  const stock = currentVariant ? currentVariant.stock : product.stock ?? 0;
  const canAddToCart =
    (!hasVariants || currentVariant !== null) &&
    stock > 0 &&
    currentVariant?.branchId != null;

  const discount =
    originalPrice && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0;

  const handleSelectAttrValue = (attrId: number, value: string) => {
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

  const handleBuyNow = async () => {
    await handleAddToCart();
    router.push("/cart");
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <ProductBreadcrumb category={product.category} name={product.name} />

      <div className="grid lg:grid-cols-[1.1fr_1fr_320px] gap-8 mb-16">
        <div className="space-y-3">
          <div className="relative rounded-2xl overflow-hidden group">
            {images.length > 0 ? (
              <div
                ref={galleryRef}
                onScroll={handleGalleryScroll}
                className="flex overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {images.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={src}
                    alt={product.name}
                    className="w-full shrink-0 snap-center aspect-square object-cover bg-muted"
                  />
                ))}
              </div>
            ) : (
              <ProductImage
                category={product.category}
                className="w-full aspect-square"
              />
            )}
            {discount > 0 && (
              <span className="absolute top-4 left-4 bg-destructive text-destructive-foreground text-sm font-bold px-2.5 py-1 rounded-md">
                -{discount}%
              </span>
            )}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => goToImage(activeThumb - 1)}
                  disabled={activeThumb <= 0}
                  aria-label="Previous image"
                  className="absolute left-3 top-1/2 -translate-y-1/2 grid place-items-center h-9 w-9 rounded-full bg-background/80 text-foreground shadow-sm opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => goToImage(activeThumb + 1)}
                  disabled={activeThumb >= images.length - 1}
                  aria-label="Next image"
                  className="absolute right-3 top-1/2 -translate-y-1/2 grid place-items-center h-9 w-9 rounded-full bg-background/80 text-foreground shadow-sm opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => goToImage(i)}
                      aria-label={`Go to image ${i + 1}`}
                      className={cn(
                        "h-1.5 rounded-full transition-all",
                        i === activeThumb ? "w-4 bg-white" : "w-1.5 bg-white/60"
                      )}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActiveThumb(i)}
                  className={cn(
                    "h-16 w-16 shrink-0 rounded-lg overflow-hidden border-2 transition-colors",
                    activeThumb === i ? "border-primary" : "border-transparent"
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

        <div className="space-y-5">
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-foreground">
                {(product.rating ?? 0).toFixed(1)}
              </span>
            </div>
            <span className="text-muted-foreground">
              · {t("product.reviews", { count: product.reviewCount ?? 0 })} ·{" "}
              {t("product.sold", { count: product.soldCount ?? 0 })}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
            {product.name}
          </h1>

          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-foreground">
              {formatMNT(price)}
            </span>
            {originalPrice && originalPrice > price && (
              <span className="text-lg text-muted-foreground line-through">
                {formatMNT(originalPrice)}
              </span>
            )}
          </div>

          {product.attrs.map((attr) => (
            <div key={attr.id}>
              <p className="text-sm font-medium text-foreground mb-2">
                {attr.name}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                {attr.values.map((val) => {
                  const isSelected = selectedAttrs[attr.id] === val.value;

                  if (attr.viewType === "image") {
                    return (
                      <button
                        key={val.value}
                        onClick={() => handleSelectAttrValue(attr.id, val.value)}
                        title={val.value}
                        aria-label={val.value}
                        className={cn(
                          "h-14 w-14 rounded-lg overflow-hidden border-2 transition-shadow",
                          isSelected
                            ? "border-primary shadow-[0_0_0_2px_var(--background)]"
                            : "border-border"
                        )}
                        style={
                          val.image
                            ? undefined
                            : { backgroundColor: val.color ?? "var(--muted)" }
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
                      onClick={() => handleSelectAttrValue(attr.id, val.value)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors",
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

          {product.description && (
            <p className="text-muted-foreground leading-relaxed">
              {product.description}
            </p>
          )}

          <Separator />

          <div className="space-y-0">
            {specKeys.map(
              ({ key, labelKey }) =>
                product[key] && (
                  <div
                    key={key}
                    className="flex items-center justify-between py-2.5 border-b border-border last:border-b-0"
                  >
                    <span className="text-sm text-muted-foreground">
                      {t(labelKey)}
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {String(product[key])}
                    </span>
                  </div>
                )
            )}
          </div>
        </div>

        <div className="lg:sticky lg:top-24 h-fit rounded-2xl border border-border bg-card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-foreground">
              {formatMNT(price)}
            </span>
            <span
              className={cn(
                "text-sm font-medium",
                stock > 0 ? "text-emerald-600" : "text-destructive"
              )}
            >
              {stock > 0 ? t("product.inStock") : t("product.outOfStock")}
            </span>
          </div>

          <div className="flex items-center border border-border rounded-lg w-fit">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="h-10 w-10 rounded-r-none"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="px-4 py-2 min-w-12 text-center font-medium">
              {quantity}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setQuantity((q) => Math.min(stock || q + 1, q + 1))}
              disabled={stock > 0 && quantity >= stock}
              className="h-10 w-10 rounded-l-none"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <Button
            size="lg"
            className={cn(
              "w-full transition-all duration-300",
              justAdded
                ? "bg-emerald-600 text-white hover:bg-emerald-600"
                : "brand-gradient text-white hover:opacity-90"
            )}
            onClick={handleAddToCart}
            disabled={isAdding || !canAddToCart}
          >
            {isAdding ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
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
                {t("product.addToCart")}
              </span>
            )}
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={handleBuyNow}
            disabled={isAdding || !canAddToCart}
            className="w-full"
          >
            {t("product.buyNow")}
          </Button>

          <div className="space-y-2.5 pt-2 border-t border-border">
            <div className="flex items-start gap-2.5 text-sm text-muted-foreground">
              <CircleCheck className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
              <span>{t("product.trust.freeShip")}</span>
            </div>
            <div className="flex items-start gap-2.5 text-sm text-muted-foreground">
              <CircleCheck className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
              <span>{t("product.trust.returns")}</span>
            </div>
            <div className="flex items-start gap-2.5 text-sm text-muted-foreground">
              <CircleCheck className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
              <span>{t("product.trust.payment")}</span>
            </div>
          </div>
        </div>
      </div>

      <RelatedProducts product={product} />
    </div>
  );
}
