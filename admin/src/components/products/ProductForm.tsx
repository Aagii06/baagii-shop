"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { tr } from "@/lib/i18n/translations";
import { useConfirm } from "@/components/common/Confirm";
import Field from "@/components/common/Field";
import { useToast } from "@/components/common/Toast";
import DetailHeader from "@/components/layout/DetailHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// import { Switch } from "@/components/ui/switch";
import { RichTextEditor } from "@/components/common/RichTextEditor";
import { deletePost, savePost } from "@/lib/api/posts";
import { attrsSummary } from "@/lib/attributes";
import { formatQty, toNumber } from "@/lib/utils";
import { ChevronRight, Lock, Palette, Tag } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import {
  hasProductBasics,
  productErrors,
  useProductEditor,
  type ProductAttr,
  type VariantRow,
} from "./ProductEditor";
import CategoryPicker from "./CategoryPicker";
import ProductImages from "./ProductImages";

const digitsOnly = (value: string) => value.replace(/\D/g, "");

const ATTR_ICONS = { image: Palette, text: Tag };

/** "Өнгө, хэмжээ, тоо оруулах" */
const variantsTitle = (attrs: ProductAttr[]) => tr("pf.variantsTitle", { attrs: attrsSummary(attrs.map((attr) => attr.name)) });

function variantsTotal(variants: VariantRow[]) {
  const sold = variants.filter((row) => !row.off);
  const total = sold.reduce((sum, row) => sum + toNumber(row.qty), 0);
  return tr("pf.variantsSummary", { count: sold.length, total: formatQty(total) });
}

/** Create or edit a product — the draft comes from `ProductEditorProvider`. */
export default function ProductForm() {
  const router = useRouter();
  const { t } = useLanguage();
  const { run } = useToast();
  const confirm = useConfirm();
  // const publishLabelId = useId();
  const nameErrorId = useId();
  const priceErrorId = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const { post, categories, basePath, form, setField: set, attrs, variants, updateVariant, toPostInput } =
    useProductEditor();
  const Icon = ATTR_ICONS[attrs[0]?.viewType ?? "text"];
  // Until values are picked, the product has one variant, stocked on this form.
  const picked = attrs.some((attr) => attr.values.length > 0);

  // A field's error shows once it has been left, or on a save attempt.
  const [touched, setTouched] = useState({ name: false, price: false });
  const errors = productErrors(form);
  const nameError = touched.name ? errors.name : undefined;
  const priceError = touched.price ? errors.price : undefined;

  /** Reveals every error and focuses the first bad field; `true` when there are none. */
  function validate() {
    setTouched({ name: true, price: true });
    if (errors.name) nameRef.current?.focus();
    else if (errors.price) priceRef.current?.focus();
    return !errors.name && !errors.price;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;
    const saved = await run(
      () => savePost(post?.id ?? null, toPostInput()),
      t("common.saved")
    );
    if (saved && !post) router.replace("/products");
  }

  async function onDelete() {
    if (!post) return;
    const ok = await confirm({
      title: t("pf.deleteTitle"),
      description: t("pf.deleteDesc", { name: form.name }),
      confirmLabel: t("common.delete"),
      tone: "danger",
    });
    if (!ok) return;
    if (await run(() => deletePost(post.id), t("pf.deleted"))) router.replace("/products");
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <DetailHeader
        backHref="/products"
        title={post ? t("products.edit") : t("products.add")}
        aside={
          <Button type="submit" className="h-10 px-5">
            {t("common.save")}
          </Button>
        }
      />

      <div className="space-y-4">
        <Field label={t("common.name")} error={nameError} errorId={nameErrorId}>
          <Input
            ref={nameRef}
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
            aria-invalid={Boolean(nameError)}
            aria-describedby={nameError ? nameErrorId : undefined}
            required
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t("pf.price")} error={priceError} errorId={priceErrorId}>
            <Input
              ref={priceRef}
              className="font-mono"
              inputMode="numeric"
              value={form.price}
              onChange={(e) => set("price", digitsOnly(e.target.value))}
              onBlur={() => setTouched((prev) => ({ ...prev, price: true }))}
              aria-invalid={Boolean(priceError)}
              aria-describedby={priceError ? priceErrorId : undefined}
              required
            />
          </Field>
          <Field label={t("pf.salePrice")}>
            {/* Empty is saved as the price; the placeholder shows that value. */}
            <Input
              className="font-mono"
              inputMode="numeric"
              placeholder={form.price}
              value={form.salePrice}
              onChange={(e) => set("salePrice", digitsOnly(e.target.value))}
            />
          </Field>
        </div>

        <CategoryPicker
          categories={categories}
          value={form.categoryId}
          onChange={(id) => set("categoryId", id)}
          hint={
            attrs.length > 0 ? undefined : form.categoryId ? t("pf.categoryNoOptions") : t("pf.categoryHint")
          }
        />

        {!picked && (
          // Nothing picked: the product is sold in one version, stocked here.
          <Field
            label={t("pf.qty")}
            hint={
              attrs.length > 0
                ? t("pf.qtyHint", { attrs: attrsSummary(attrs.map((attr) => attr.name)) })
                : undefined
            }
          >
            <Input
              className="font-mono"
              inputMode="numeric"
              placeholder="0"
              value={variants[0].qty}
              onFocus={(e) => e.currentTarget.select()}
              onChange={(e) => updateVariant(variants[0], { qty: digitsOnly(e.target.value) })}
            />
          </Field>
        )}

        {attrs.length > 0 &&
          (hasProductBasics(form) ? (
            <Link
              href={`${basePath}/variants`}
              className="flex items-center gap-3 rounded-2xl border border-border bg-white px-4 py-3.5 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
            >
              <span className="grid size-10 shrink-0 place-items-center self-start rounded-full bg-primary-soft text-primary-ink">
                <Icon className="size-5" />
              </span>
              <span className="min-w-0 grow">
                <span className="block text-[15px] font-bold">{variantsTitle(attrs)}</span>
                {attrs.map((attr) => (
                  <span key={attr.key} className="mt-0.5 block truncate text-sm text-muted-foreground">
                    {attr.name}:{" "}
                    {attr.values.length > 0 ? (
                      <span className="text-foreground">{attr.values.map((v) => v.value).join(", ")}</span>
                    ) : (
                      t("pf.notPicked")
                    )}
                  </span>
                ))}
                <span className="mt-1 block truncate font-mono text-xs text-muted-foreground">
                  {picked ? variantsTotal(variants) : t("pf.notEntered")}
                </span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
            </Link>
          ) : (
            // Variants copy the product's price, so it has to be entered first.
            // Tapping shows what's missing.
            <button
              type="button"
              onClick={validate}
              className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-3.5 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
                <Icon className="size-5" />
              </span>
              <span className="min-w-0 grow">
                <span className="block text-[15px] font-bold text-muted-foreground">
                  {variantsTitle(attrs)}
                </span>
                <span className="mt-0.5 block text-sm text-muted-foreground">
                  {t("pf.enterNamePriceFirst")}
                </span>
              </span>
              <Lock className="size-4 shrink-0 text-muted-foreground" />
            </button>
          ))}

        {/* After the variants: a colour needs picking before it gets images. */}
        <ProductImages />

        <Field label={t("pf.description")}>
          <RichTextEditor value={form.note} onChange={(html) => set("note", html)} />
        </Field>

        {/* Hidden until the backend saves publishing (`isActive` / `statusId`).
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-white px-4 py-3.5">
          <span id={publishLabelId} className="text-[15px]">
            Нийтлэх
          </span>
          <Switch
            checked={form.isActive}
            onCheckedChange={(checked) => set("isActive", checked)}
            aria-labelledby={publishLabelId}
          />
        </div>
        */}

        {post && (
          <Button type="button" variant="danger" size="lg" className="w-full" onClick={onDelete}>
            {t("pf.deleteProduct")}
          </Button>
        )}
      </div>
    </form>
  );
}
