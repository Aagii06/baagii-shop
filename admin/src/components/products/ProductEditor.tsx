"use client";

import type { Category } from "@/lib/api/categories";
import type { PostDetail, PostInput } from "@/lib/api/posts";
import { toNumber } from "@/lib/utils";
import { createContext, useContext, useMemo, useState } from "react";

// Numbers are kept as strings while editing so a field can be cleared.
export interface ProductFormState {
  name: string;
  /** "Үнэ" — the base price. */
  price: string;
  /** "Хямдрал" — the discounted selling price; left empty, it's `price`. */
  salePrice: string;
  categoryId: string;
  note: string;
  isActive: boolean;
}

export interface SizeRow {
  /** React key — stable while the row is edited. */
  key: string;
  /** Existing variant (`PostProduct.id`); `null` for a row added here. */
  id: number | null;
  size: string;
  qty: string;
  price: string;
  salePrice: string;
  /** The variant's other attributes (e.g. colour), shown read-only. */
  extra: string;
}

function initialForm(post: PostDetail | null): ProductFormState {
  const price = toNumber(post?.price);
  return {
    name: post ? post.productName || post.name : "",
    price: post ? String(toNumber(post.mainPrice) || price) : "",
    salePrice: post ? String(price) : "",
    categoryId: post?.categoryId != null ? String(post.categoryId) : "",
    note: post?.note ?? "",
    isActive: post?.isActive ?? true,
  };
}

export type ProductErrors = Partial<Record<"name" | "price", string>>;

/** Required fields left empty, with the message shown under each. */
export function productErrors(form: ProductFormState): ProductErrors {
  const errors: ProductErrors = {};
  if (!form.name.trim()) errors.name = "Барааны нэр оруулна уу";
  if (form.price === "") errors.price = "Үнэ оруулна уу";
  return errors;
}

/** Name and price are filled — the sizes page needs them. */
export function hasProductBasics(form: ProductFormState) {
  return Object.keys(productErrors(form)).length === 0;
}

// A variant combines attributes ("Өнгө: Саарал", "Гутлын хэмжээ: 38"); the
// size ones are matched by name. With none, every value counts as the size.
const SIZE_ATTR = /хэмжээ|size/i;

function initialSizes(post: PostDetail | null): SizeRow[] {
  const attrs = [...(post?.postAttrs ?? [])].sort((a, b) => a.orderNumber - b.orderNumber);
  const hasSizeAttr = attrs.some((a) => SIZE_ATTR.test(a.attrName));
  const isSize = (attrName: string) => !hasSizeAttr || SIZE_ATTR.test(attrName);
  const values = (attr: Record<string, string> | null, size: boolean) =>
    attrs
      .filter((a) => isSize(a.attrName) === size)
      .map((a) => attr?.[a.attrId])
      .filter(Boolean)
      .join(" · ");

  return (post?.postProducts ?? []).map((p) => ({
    key: `variant-${p.id}`,
    id: p.id,
    size: values(p.attr, true) || p.variantName,
    qty: String(toNumber(p.qty)),
    price: String(toNumber(p.mainPrice) || toNumber(p.price)),
    salePrice: String(toNumber(p.price)),
    extra: values(p.attr, false),
  }));
}

let rowCount = 0;

/** A new size starts at 0 in stock, priced like the product. */
export function newSizeRow(size: string, form: ProductFormState): SizeRow {
  rowCount += 1;
  return {
    key: `new-${rowCount}`,
    id: null,
    size,
    qty: "0",
    price: form.price,
    salePrice: form.salePrice,
    extra: "",
  };
}

/** "Хямдрал" left empty is saved as the price itself — no discount. */
function prices(price: string, salePrice: string) {
  const mainPrice = Number(price) || 0;
  return { mainPrice, price: salePrice === "" ? mainPrice : Number(salePrice) };
}

/** Rows without a size are dropped. */
export function toPostInput(form: ProductFormState, sizes: SizeRow[]): PostInput {
  return {
    name: form.name.trim(),
    ...prices(form.price, form.salePrice),
    categoryId: form.categoryId ? Number(form.categoryId) : null,
    note: form.note.trim(),
    isActive: form.isActive,
    sizes: sizes
      .filter((row) => row.size.trim())
      .map((row) => ({
        id: row.id,
        size: row.size.trim(),
        qty: Number(row.qty) || 0,
        ...prices(row.price, row.salePrice),
      })),
  };
}

interface ProductEditor {
  post: PostDetail | null;
  categories: (Category & { depth: number })[];
  /** `/products/new` or `/products/{id}` — the form; sizes live under `/sizes`. */
  basePath: string;
  form: ProductFormState;
  setField: <K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) => void;
  sizes: SizeRow[];
  setSizes: React.Dispatch<React.SetStateAction<SizeRow[]>>;
}

const ProductEditorContext = createContext<ProductEditor | null>(null);

/**
 * Holds the unsaved product draft for the form and the sizes page. It is
 * mounted by the route's layout, so the draft survives moving between them.
 */
export function ProductEditorProvider({
  post,
  categories,
  children,
}: {
  post: PostDetail | null;
  categories: (Category & { depth: number })[];
  children: React.ReactNode;
}) {
  const [form, setForm] = useState(() => initialForm(post));
  const [sizes, setSizes] = useState(() => initialSizes(post));

  const value = useMemo<ProductEditor>(
    () => ({
      post,
      categories,
      basePath: post ? `/products/${post.id}` : "/products/new",
      form,
      setField: (key, fieldValue) => {
        setForm((prev) => ({ ...prev, [key]: fieldValue }));
        // Sizes still on the product's old price or sale price follow the change.
        if (key === "price" || key === "salePrice") {
          const field = key as "price" | "salePrice";
          const previous = form[field];
          setSizes((prev) =>
            prev.map((row) => (row[field] === previous ? { ...row, [field]: String(fieldValue) } : row))
          );
        }
      },
      sizes,
      setSizes,
    }),
    [post, categories, form, sizes]
  );

  return <ProductEditorContext.Provider value={value}>{children}</ProductEditorContext.Provider>;
}

export function useProductEditor() {
  const ctx = useContext(ProductEditorContext);
  if (!ctx) throw new Error("useProductEditor must be used inside <ProductEditorProvider>");
  return ctx;
}
