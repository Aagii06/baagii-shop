"use client";

import type { Attr } from "@/lib/api/attrs";
import { categoryAttrs, type Category } from "@/lib/api/categories";
import type { PostDetail, PostInput } from "@/lib/api/posts";
import { valueKey } from "@/lib/attributes";
import { toNumber } from "@/lib/utils";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

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

/** One value of an attribute; a colour carries its swatch hex. */
export interface AttrValue {
  value: string;
  color: string | null;
  /** The catalogue value (`AttrOption.id`); `null` for one typed in here. */
  attrValueId: number | null;
}

/** Something the product varies by, and the values it's sold in. */
export interface ProductAttr {
  /** `String(attrId)` — how variants and images refer to it. */
  key: string;
  /** Catalogue attribute (`Attr.id`); `null` only for `VARIANT_NAME_ATTR`. */
  attrId: number | null;
  name: string;
  viewType: Attr["viewType"];
  values: AttrValue[];
}

/** Stock and price of one combination of values ("Хар · 42"). */
export interface VariantRow {
  /** `comboKey(values)`. */
  key: string;
  /** Existing variant (`PostProduct.id`); `null` for a new combination. */
  id: number | null;
  /** attr key → value */
  values: Record<string, string>;
  qty: string;
  price: string;
  salePrice: string;
  /** Not sold. Kept so turning it back on restores its numbers; not saved. */
  off: boolean;
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

/** Name and price are filled — the variants page needs them. */
export function hasProductBasics(form: ProductFormState) {
  return Object.keys(productErrors(form)).length === 0;
}

/** Same for any order of the attributes, so reordering keeps each row's numbers. */
export function comboKey(values: Record<string, string>) {
  return Object.keys(values)
    .sort()
    .map((key) => `${key}=${valueKey(values[key])}`)
    .join("|");
}

/** Every combination of the picked values, in attribute then value order; `[{}]` when none are picked. */
function combinations(attrs: ProductAttr[]): Record<string, string>[] {
  return attrs
    .filter((attr) => attr.values.length > 0)
    .reduce<Record<string, string>[]>(
      (combos, attr) => combos.flatMap((combo) => attr.values.map((v) => ({ ...combo, [attr.key]: v.value }))),
      [{}]
    );
}

/** A new combination starts at 0 in stock, priced like the product. */
function newVariantRow(values: Record<string, string>, form: ProductFormState): VariantRow {
  return {
    key: comboKey(values),
    id: null,
    values,
    qty: "0",
    price: form.price,
    salePrice: form.salePrice,
    off: false,
  };
}

const attrKey = (attrId: number) => String(attrId);

/** An attribute of the catalogue, before any of its values are picked. */
function emptyAttr(attr: Attr): ProductAttr {
  return { key: attrKey(attr.id), attrId: attr.id, name: attr.name, viewType: attr.viewType, values: [] };
}

// Posts from before categories had attributes may keep several variants
// apart by name alone; those names become the values of this attribute.
const VARIANT_NAME_ATTR = "variant-name";

function initialAttrs(post: PostDetail | null, catalogue: Attr[]): ProductAttr[] {
  const products = post?.postProducts ?? [];
  const postAttrs = [...(post?.postAttrs ?? [])].sort((a, b) => a.orderNumber - b.orderNumber);
  if (postAttrs.length === 0) {
    return products.length > 1
      ? [
          {
            key: VARIANT_NAME_ATTR,
            attrId: null,
            name: "Хувилбар",
            viewType: "text",
            values: products.map((p) => ({ value: p.variantName, color: null, attrValueId: null })),
          },
        ]
      : [];
  }

  return postAttrs.map((attr) => {
    const known = catalogue.find((a) => a.id === attr.attrId);
    const values: AttrValue[] = [...(attr.postAttrValues ?? [])]
      .sort((a, b) => a.orderNumber - b.orderNumber)
      .map((v) => ({ value: v.value, color: v.color, attrValueId: v.attrValueId }));
    // Values a variant uses without being listed on the attribute.
    for (const p of products) {
      const value = p.attr?.[attr.attrId];
      if (value && !values.some((v) => valueKey(v.value) === valueKey(value))) {
        values.push({ value, color: null, attrValueId: null });
      }
    }
    return {
      key: attrKey(attr.attrId),
      attrId: attr.attrId,
      name: known?.name ?? attr.attrName,
      viewType: known?.viewType ?? (attr.viewType === "image" ? "image" : "text"),
      values,
    };
  });
}

function initialRows(post: PostDetail | null, attrs: ProductAttr[], form: ProductFormState) {
  const rows: Record<string, VariantRow> = {};
  for (const p of post?.postProducts ?? []) {
    const values: Record<string, string> = {};
    for (const attr of attrs) {
      const value = attr.attrId != null ? p.attr?.[attr.attrId] : p.variantName;
      if (value) values[attr.key] = value;
    }
    const key = comboKey(values);
    rows[key] = {
      key,
      id: p.id,
      values,
      qty: String(toNumber(p.qty)),
      price: String(toNumber(p.mainPrice) || toNumber(p.price)),
      salePrice: String(toNumber(p.price)),
      off: false,
    };
  }
  // Combinations the product isn't sold in stay off rather than showing up at 0.
  if (post) {
    for (const values of combinations(attrs)) {
      const key = comboKey(values);
      rows[key] ??= { ...newVariantRow(values, form), off: true };
    }
  }
  return rows;
}

/**
 * Where a group of images sits in `ProductEditor.images`: `""` for the
 * product's own, else one attribute value's ("color=ХАР"). Keyed apart from
 * the values so a colour turned off and on again gets its images back.
 */
export const imageKey = (attrKey = "", value = "") => (attrKey ? `${attrKey}=${valueKey(value)}` : "");

function initialImages(post: PostDetail | null, attrs: ProductAttr[]) {
  const images: Record<string, string[]> = { "": post?.images ?? [] };
  for (const attr of attrs) {
    const postAttr = post?.postAttrs?.find((a) => attr.attrId != null && a.attrId === attr.attrId);
    for (const v of postAttr?.postAttrValues ?? []) {
      // The cover first; the API often repeats it in `images`.
      const list = [...new Set([v.image, ...(v.images ?? [])].filter((id): id is string => Boolean(id)))];
      if (list.length > 0) images[imageKey(attr.key, v.value)] = list;
    }
  }
  return images;
}

/** "Хямдрал" left empty is saved as the price itself — no discount. */
function prices(price: string, salePrice: string) {
  const mainPrice = Number(price) || 0;
  return { mainPrice, price: salePrice === "" ? mainPrice : Number(salePrice) };
}

/**
 * Attributes without values are left out; with none left, the one variant
 * takes the product's own prices. Combinations turned off are dropped, and
 * so are the images of values no longer picked.
 */
function toPostInput(
  form: ProductFormState,
  attrs: ProductAttr[],
  variants: VariantRow[],
  images: Record<string, string[]>,
  files: Map<string, File>
): PostInput {
  const used = attrs.filter((attr) => attr.values.length > 0);
  const own = images[""] ?? [];
  const valueImages = (attrKey: string, value: string) => images[imageKey(attrKey, value)] ?? [];
  const saved = [...own, ...used.flatMap((attr) => attr.values.flatMap((v) => valueImages(attr.key, v.value)))];
  return {
    name: form.name.trim(),
    ...prices(form.price, form.salePrice),
    categoryId: form.categoryId ? Number(form.categoryId) : null,
    note: form.note.trim(),
    isActive: form.isActive,
    images: own,
    attrs: used.map(({ attrId, key, name, values }) => ({
      attrId,
      name,
      values: values.map(({ value, color, attrValueId }) => {
        const [image = null, ...rest] = valueImages(key, value);
        return { attrValueId, value, color, image, images: rest };
      }),
    })),
    variants: variants
      .filter((row) => !row.off)
      .map((row) => ({
        id: row.id,
        values: used.map((attr) => row.values[attr.key]),
        qty: Number(row.qty) || 0,
        ...(used.length > 0 ? prices(row.price, row.salePrice) : prices(form.price, form.salePrice)),
      })),
    newFiles: Object.fromEntries(saved.flatMap((ref) => (files.has(ref) ? [[ref, files.get(ref)!]] : []))),
  };
}

interface ProductEditor {
  post: PostDetail | null;
  categories: (Category & { depth: number })[];
  /** The attribute catalogue, for the values each attribute offers. */
  catalogue: Attr[];
  /** `/products/new` or `/products/{id}` — the form; variants live under `/variants`. */
  basePath: string;
  form: ProductFormState;
  setField: <K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) => void;
  /** The category's attributes, then any others the product already has values for. */
  attrs: ProductAttr[];
  /** Whether `key` is one of the category's attributes (not left over from another). */
  inCategory: (key: string) => boolean;
  setAttrValues: (key: string, values: AttrValue[]) => void;
  /** Every combination of the picked values — a single row when none are picked. */
  variants: VariantRow[];
  updateVariant: (row: VariantRow, patch: Partial<VariantRow>) => void;
  /** File ids, or `blob:` URLs for files picked here, by `imageKey`. */
  images: Record<string, string[]>;
  addImages: (key: string, files: File[]) => void;
  removeImage: (key: string, ref: string) => void;
  /** The draft as saved. */
  toPostInput: () => PostInput;
}

const ProductEditorContext = createContext<ProductEditor | null>(null);

/**
 * Holds the unsaved product draft for the form and the variants page. It is
 * mounted by the route's layout, so the draft survives moving between them.
 */
export function ProductEditorProvider({
  post,
  categories,
  catalogue,
  children,
}: {
  post: PostDetail | null;
  categories: (Category & { depth: number })[];
  catalogue: Attr[];
  children: React.ReactNode;
}) {
  const [form, setForm] = useState(() => initialForm(post));
  // Every attribute given values so far — also ones a later category change
  // left out, so switching back finds them again.
  const [allAttrs, setAllAttrs] = useState(() => initialAttrs(post, catalogue));
  const [rows, setRows] = useState(() => initialRows(post, allAttrs, form));
  const [images, setImages] = useState(() => initialImages(post, allAttrs));
  // Picked files by the `blob:` URL that previews them until they're uploaded.
  const files = useRef(new Map<string, File>());

  useEffect(() => {
    const picked = files.current;
    return () => picked.forEach((_, url) => URL.revokeObjectURL(url));
  }, []);

  const value = useMemo<ProductEditor>(() => {
    const fromCategory = categoryAttrs(categories, form.categoryId ? Number(form.categoryId) : null)
      .map((id) => catalogue.find((attr) => attr.id === id))
      .filter((attr): attr is Attr => Boolean(attr))
      .map(emptyAttr);
    const byKey = new Map(allAttrs.map((attr) => [attr.key, attr]));
    const attrs = [
      ...fromCategory.map((attr) => byKey.get(attr.key) ?? attr),
      ...allAttrs.filter((attr) => !fromCategory.some((a) => a.key === attr.key) && attr.values.length > 0),
    ];

    const variants = combinations(attrs).map((values) => rows[comboKey(values)] ?? newVariantRow(values, form));

    return {
      post,
      categories,
      catalogue,
      basePath: post ? `/products/${post.id}` : "/products/new",
      form,
      setField: (key, fieldValue) => {
        setForm((prev) => ({ ...prev, [key]: fieldValue }));
        // Variants still on the product's old price or sale price follow the change.
        if (key === "price" || key === "salePrice") {
          const field = key as "price" | "salePrice";
          const previous = form[field];
          setRows((prev) =>
            Object.fromEntries(
              Object.entries(prev).map(([k, row]) => [
                k,
                row[field] === previous ? { ...row, [field]: String(fieldValue) } : row,
              ])
            )
          );
        }
      },
      attrs,
      inCategory: (key) => fromCategory.some((attr) => attr.key === key),
      setAttrValues: (key, values) => {
        const attr = attrs.find((a) => a.key === key);
        if (!attr) return;
        setAllAttrs((prev) =>
          prev.some((a) => a.key === key)
            ? prev.map((a) => (a.key === key ? { ...a, values } : a))
            : [...prev, { ...attr, values }]
        );
      },
      variants,
      updateVariant: (row, patch) =>
        setRows((prev) => ({ ...prev, [row.key]: { ...(prev[row.key] ?? row), ...patch } })),
      images,
      addImages: (key, picked) => {
        const refs = picked.map((file) => {
          const url = URL.createObjectURL(file);
          files.current.set(url, file);
          return url;
        });
        setImages((prev) => ({ ...prev, [key]: [...(prev[key] ?? []), ...refs] }));
      },
      removeImage: (key, ref) => {
        setImages((prev) => ({ ...prev, [key]: (prev[key] ?? []).filter((r) => r !== ref) }));
        if (files.current.delete(ref)) URL.revokeObjectURL(ref);
      },
      toPostInput: () => toPostInput(form, attrs, variants, images, files.current),
    };
  }, [post, categories, catalogue, form, allAttrs, rows, images]);

  return <ProductEditorContext.Provider value={value}>{children}</ProductEditorContext.Provider>;
}

export function useProductEditor() {
  const ctx = useContext(ProductEditorContext);
  if (!ctx) throw new Error("useProductEditor must be used inside <ProductEditorProvider>");
  return ctx;
}
