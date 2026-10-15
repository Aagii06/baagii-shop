"use client";

import Thumb from "@/components/common/Thumb";
import ProductListSkeleton from "@/components/products/ProductListSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getPostsPage, type PostDetail, type PostProduct } from "@/lib/api/posts";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { cn, formatMNT, formatQty, toNumber } from "@/lib/utils";
import { ChevronDown, Plus } from "lucide-react";
import { useEffect, useState } from "react";

/** Search the catalogue and add a product's variants to the order. */
export default function OrderProductPicker({
  onAdd,
}: {
  onAdd: (post: PostDetail, variant: PostProduct | null) => void;
}) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [result, setResult] = useState<{ query: string; rows: PostDetail[]; failed: boolean } | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    getPostsPage({ skip: 0, take: 10, query: debounced }).then(
      (page) => !cancelled && setResult({ query: debounced, rows: page.rows, failed: false }),
      () => !cancelled && setResult({ query: debounced, rows: [], failed: true })
    );
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  const loading = result?.query !== debounced;

  return (
    <div className="space-y-3">
      <Input
        type="search"
        placeholder={t("products.search")}
        aria-label={t("products.search")}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {loading ? (
        <ProductListSkeleton rows={4} />
      ) : result.failed ? (
        <p className="px-1 text-sm text-destructive">{t("common.loadFailed")}</p>
      ) : result.rows.length === 0 ? (
        <p className="px-1 text-sm text-muted-foreground">{t("products.notFound")}</p>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-white">
          {result.rows.map((post) => {
            const open = openId === post.id;
            const variants = post.postProducts ?? [];
            return (
              <li key={post.id}>
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenId(open ? null : post.id)}
                  className="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-muted/60"
                >
                  <Thumb id={post.images?.[0]} size={44} className="rounded-xl" />
                  <span className="min-w-0 grow">
                    <span className="block truncate text-[15px] font-semibold">{post.name}</span>
                    <span className="block font-mono text-xs text-muted-foreground">
                      {formatMNT(toNumber(post.price))} · {t("products.stock", { qty: formatQty(toNumber(post.remain)) })}
                    </span>
                  </span>
                  <ChevronDown className={cn("size-5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
                </button>

                {open && (
                  <ul className="space-y-2 border-t border-border bg-muted/30 px-3 py-3">
                    {variants.length === 0 ? (
                      <li>
                        <Button type="button" variant="soft" className="w-full" onClick={() => onAdd(post, null)}>
                          <Plus />
                          {t("common.add")}
                        </Button>
                      </li>
                    ) : (
                      variants.map((variant) => {
                        const remain = toNumber(variant.remain);
                        return (
                          <li key={variant.id} className="flex items-center gap-3">
                            <span className="min-w-0 grow">
                              <span className="block truncate text-sm font-bold">{variant.variantName || post.name}</span>
                              <span className="block font-mono text-xs text-muted-foreground">
                                {formatMNT(toNumber(variant.price))} ·{" "}
                                {remain > 0 ? t("products.stock", { qty: formatQty(remain) }) : t("dash.soldOut")}
                              </span>
                            </span>
                            <Button
                              type="button"
                              variant="soft"
                              size="sm"
                              className="shrink-0"
                              disabled={remain <= 0}
                              onClick={() => onAdd(post, variant)}
                            >
                              <Plus />
                              {t("common.add")}
                            </Button>
                          </li>
                        );
                      })
                    )}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
