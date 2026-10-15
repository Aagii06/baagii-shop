"use client";

import Thumb from "@/components/common/Thumb";
import ProductListSkeleton from "@/components/products/ProductListSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getPostsPage, LOW_STOCK_THRESHOLD, type PostDetail, type PostProduct } from "@/lib/api/posts";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { cn, formatMNT, formatQty, toNumber } from "@/lib/utils";
import { ChevronDown, Minus, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";

/** One variant on the order. */
export interface OrderLine {
  /** `PostProduct.id`, or `p<productId>` for a product with no variants. */
  key: string;
  variantId: number;
  name: string;
  image: string | null;
  price: number;
  qty: number;
  /** Stock left; `null` when unknown. */
  max: number | null;
}

const lineKey = (post: PostDetail, variant: PostProduct | null) => (variant ? String(variant.id) : `p${post.id}`);

function toLine(post: PostDetail, variant: PostProduct | null): OrderLine {
  const variantName = variant?.variantName;
  return {
    key: lineKey(post, variant),
    variantId: variant?.id ?? post.id,
    name: variantName && variantName !== post.name ? `${post.name} · ${variantName}` : post.name,
    image: post.images?.[0] ?? null,
    price: toNumber(variant?.price ?? post.price),
    qty: 0,
    max: variant ? toNumber(variant.remain) : toNumber(post.remain),
  };
}

/** Sold-out variants can't be ordered, so they're left out of the picker. */
function inStock(post: PostDetail): PostDetail {
  return post.postProducts?.length
    ? { ...post, postProducts: post.postProducts.filter((v) => toNumber(v.remain) > 0) }
    : post;
}

const isSellable = (post: PostDetail) =>
  post.postProducts?.length ? true : toNumber(post.remain) > 0;

/** "12 нөөц" — in red once it's running low. */
function StockLabel({ qty }: { qty: number }) {
  const { t } = useLanguage();
  return (
    <span className={cn(qty <= LOW_STOCK_THRESHOLD && "font-semibold text-destructive")}>
      {t("products.stock", { qty: formatQty(qty) })}
    </span>
  );
}

function Stepper({
  qty,
  max,
  onChange,
}: {
  qty: number;
  max: number | null;
  onChange: (qty: number) => void;
}) {
  const { t } = useLanguage();
  return (
    <span className="flex shrink-0 items-center gap-1">
      <Button type="button" variant="outline" size="icon-sm" aria-label={t("common.remove")} onClick={() => onChange(qty - 1)}>
        <Minus />
      </Button>
      <span aria-live="polite" className="w-8 text-center font-mono text-[15px] font-bold">
        {qty}
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label={t("common.add")}
        disabled={max != null && qty >= max}
        onClick={() => onChange(qty + 1)}
      >
        <Plus />
      </Button>
    </span>
  );
}

/**
 * Full-screen product picker. Variants are added with their own steppers;
 * nothing reaches the order until "Сонгох" is pressed, and closing drops it.
 */
export default function OrderProductPicker({
  initial,
  onConfirm,
  onClose,
}: {
  /** What's on the order already. */
  initial: OrderLine[];
  onConfirm: (lines: OrderLine[]) => void;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [result, setResult] = useState<{ query: string; rows: PostDetail[]; failed: boolean } | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const [draft, setDraft] = useState<OrderLine[]>(initial);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    getPostsPage({ skip: 0, take: 40, query: debounced }).then(
      (page) => !cancelled && setResult({ query: debounced, rows: page.rows.map(inStock).filter(isSellable), failed: false }),
      () => !cancelled && setResult({ query: debounced, rows: [], failed: true })
    );
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  // The page behind doesn't scroll while this covers it; Esc closes.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const loading = result?.query !== debounced;
  const qtyOf = (key: string) => draft.find((line) => line.key === key)?.qty ?? 0;
  const count = draft.reduce((sum, line) => sum + line.qty, 0);

  function setQty(post: PostDetail, variant: PostProduct | null, qty: number) {
    const key = lineKey(post, variant);
    setDraft((prev) => {
      const rest = prev.filter((line) => line.key !== key);
      const base = prev.find((line) => line.key === key) ?? toLine(post, variant);
      const next = base.max != null ? Math.min(qty, base.max) : qty;
      return next < 1 ? rest : [...rest, { ...base, qty: next }];
    });
  }

  return (
    // Same phone-width column as the rest of the admin.
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("on.products")}
      className="fixed inset-y-0 left-1/2 z-50 flex w-full max-w-md -translate-x-1/2 flex-col bg-background"
    >
      <header className="space-y-3 border-b border-border px-4 pb-3 pt-3">
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" size="icon" aria-label={t("common.cancel")} onClick={onClose}>
            <X />
          </Button>
          <h2 className="text-lg font-extrabold">{t("on.products")}</h2>
        </div>
        <Input
          type="search"
          placeholder={t("products.search")}
          aria-label={t("products.search")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </header>

      <div className="min-h-0 grow overflow-y-auto px-4 pb-6">
        {loading ? (
          <ProductListSkeleton rows={8} />
        ) : result.failed ? (
          <p className="py-6 text-center text-sm text-destructive">{t("common.loadFailed")}</p>
        ) : result.rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t("products.notFound")}</p>
        ) : (
          <ul className="divide-y divide-border">
            {result.rows.map((post) => {
              const open = openId === post.id;
              const variants = post.postProducts ?? [];
              const picked = variants.length
                ? variants.reduce((sum, v) => sum + qtyOf(String(v.id)), 0)
                : qtyOf(`p${post.id}`);
              return (
                <li key={post.id}>
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setOpenId(open ? null : post.id)}
                    className="-mx-4 flex w-[calc(100%+2rem)] items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/60"
                  >
                    <Thumb id={post.images?.[0]} size={52} className="rounded-xl" />
                    <span className="min-w-0 grow">
                      <span className="block truncate text-[15px] font-semibold">{post.name}</span>
                      <span className="block font-mono text-xs text-muted-foreground">
                        {formatMNT(toNumber(post.price))} · <StockLabel qty={toNumber(post.remain)} />
                      </span>
                    </span>
                    {picked > 0 && (
                      <span className="grid h-6 min-w-6 shrink-0 place-items-center rounded-full bg-primary px-1.5 font-mono text-xs font-bold text-primary-foreground">
                        {picked}
                      </span>
                    )}
                    <ChevronDown className={cn("size-5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
                  </button>

                  {open && (
                    <ul className="mb-3 space-y-3 rounded-2xl bg-muted/40 p-3">
                      {(variants.length === 0 ? [null] : variants).map((variant) => {
                        const key = lineKey(post, variant);
                        const max = variant ? toNumber(variant.remain) : null;
                        const qty = qtyOf(key);
                        return (
                          <li key={key} className="flex items-center gap-3">
                            <span className="min-w-0 grow">
                              <span className="block truncate text-sm font-bold">{variant?.variantName || post.name}</span>
                              <span className="block font-mono text-xs text-muted-foreground">
                                {formatMNT(toNumber(variant?.price ?? post.price))}
                                {max != null && (
                                  <>
                                    {" · "}
                                    <StockLabel qty={max} />
                                  </>
                                )}
                              </span>
                            </span>
                            {qty > 0 ? (
                              <Stepper qty={qty} max={max} onChange={(next) => setQty(post, variant, next)} />
                            ) : (
                              <Button
                                type="button"
                                variant="soft"
                                size="sm"
                                className="shrink-0"
                                onClick={() => setQty(post, variant, 1)}
                              >
                                <Plus />
                                {t("common.add")}
                              </Button>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <footer className="border-t border-border bg-background/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3">
        <Button type="button" size="lg" className="w-full" onClick={() => onConfirm(draft)}>
          {t("on.confirmPick", { count })}
        </Button>
      </footer>
    </div>
  );
}

export { Stepper };
