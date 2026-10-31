import { apiFetch, fetchAllRows, type ApiItemResponse, type ApiListResponse } from "./client";
import { tr } from "@/lib/i18n/translations";
import { uploadFile } from "./files";

/** Remaining stock at or below this is flagged as running low. */
export const LOW_STOCK_THRESHOLD = 5;

// Products come from `GET /product` (paged) and `GET /product/{id}`, are saved
// with `POST /product` / `PUT /product/{id}` and removed with
// `DELETE /product/{id}` (../backend). The shop sees each as a post, so the
// UI keeps the post-shaped `Post` / `PostDetail` below, built from the rows by
// `toPostDetail`.
// DECIMAL columns arrive as strings — convert with `toNumber`.

interface ProductAttrValue {
  attrId: number;
  attrName: string | null;
  value: string | null;
  image: string | null;
  color: string | null;
}

interface ProductVariant {
  id: number;
  productId: number;
  name: string | null;
  price: string;
  mainPrice: string;
  qty: string;
  remain: string;
  attr: ProductAttrValue[] | null;
}

/** What the product varies by, each value with its images — sent and read back as `attrs`. */
interface ProductAttr {
  attrId: number;
  attrName: string;
  viewType: string;
  orderNumber: number;
  values: PostAttrValue[];
}

interface Product {
  id: number;
  companyId: number;
  categoryId: number | null;
  date: string;
  name: string | null;
  title: string | null;
  description: string | null;
  images: string[] | null;
  qty: string;
  mainPrice: string;
  price: string;
  /** Eshop post id. */
  deepLink: string | null;
  // ../backend sends both; the old eshop-admin sent neither.
  isActive?: boolean;
  statusId?: "draft" | "active" | "inactive";
  createdAt: string;
  updatedAt: string;
  variants: ProductVariant[] | null;
  /** Absent on products saved before the backend kept them. */
  attrs?: ProductAttr[] | null;
}

export interface Post {
  id: number;
  categoryId: number | null;
  date: string;
  createdAt: string;
  name: string;
  note: string | null;
  /** Not on `GET /product` yet — read it through `isPublished`. */
  isActive?: boolean;
  mainPrice: string;
  price: string;
  qty: string;
  /** Summed over the variants. */
  remain: string;
  images: string[] | null;
  deepLink: string | null;
}

/** One sellable variant (size/colour/…). */
export interface PostProduct {
  id: number;
  variantName: string;
  qty: string;
  remain: string;
  price: string;
  mainPrice: string;
  /** attrId → value */
  attr: Record<string, string> | null;
}

export interface PostAttrValue {
  attrValueId: number | null;
  value: string;
  color: string | null;
  image: string | null;
  images: string[] | null;
  orderNumber: number;
}

export interface PostAttr {
  attrId: number;
  attrName: string;
  viewType: string;
  orderNumber: number;
  postAttrValues?: PostAttrValue[];
}

export interface PostDetail extends Post {
  postProducts?: PostProduct[];
  postAttrs?: PostAttr[];
}

/** The product's attributes and their values, in the order the variants first use them. */
function collectAttrs(variants: ProductVariant[]): PostAttr[] {
  const attrs = new Map<number, PostAttr>();
  for (const variant of variants) {
    for (const a of variant.attr ?? []) {
      if (!a.value) continue;
      let attr = attrs.get(a.attrId);
      if (!attr) {
        attr = { attrId: a.attrId, attrName: a.attrName ?? "", viewType: "text", orderNumber: attrs.size, postAttrValues: [] };
        attrs.set(a.attrId, attr);
      }
      const values = attr.postAttrValues!;
      if (values.some((v) => v.value === a.value)) continue;
      if (a.color || a.image) attr.viewType = "image";
      values.push({ attrValueId: null, value: a.value, color: a.color, image: a.image, images: null, orderNumber: values.length });
    }
  }
  return [...attrs.values()];
}

function toPostDetail(product: Product): PostDetail {
  const variants = product.variants ?? [];
  const remain = variants.length > 0 ? variants.reduce((sum, v) => sum + Number(v.remain || 0), 0) : Number(product.qty || 0);
  return {
    id: product.id,
    categoryId: product.categoryId,
    date: product.date,
    createdAt: product.createdAt,
    name: product.name || product.title || "",
    note: product.description,
    isActive: product.statusId ? product.statusId === "active" : product.isActive,
    mainPrice: product.mainPrice,
    price: product.price,
    qty: product.qty,
    remain: String(remain),
    images: product.images,
    deepLink: product.deepLink,
    postProducts: variants.map((v) => ({
      id: v.id,
      variantName: v.name ?? "",
      qty: v.qty,
      remain: v.remain,
      price: v.price,
      mainPrice: v.mainPrice,
      attr: v.attr?.length
        ? Object.fromEntries(v.attr.flatMap((a) => (a.value ? [[String(a.attrId), a.value]] : [])))
        : null,
    })),
    postAttrs: product.attrs?.length
      ? product.attrs.map(({ values, ...attr }) => ({ ...attr, postAttrValues: values }))
      : collectAttrs(variants),
  };
}

/**
 * Only an explicit `isActive: false` is a draft. The list endpoint leaves the
 * field out, and the shop (web/src/lib/api/products.ts) shows those posts.
 */
export function isPublished(post: Post) {
  return post.isActive !== false;
}

export async function getPosts(): Promise<PostDetail[]> {
  const rows = await fetchAllRows<Product>("/product");
  return rows.map(toPostDetail);
}

/** One page of products, newest first. `query` matches the name; `categoryIds` limits the categories. */
export async function getPostsPage({
  skip,
  take,
  query = "",
  categoryIds,
}: {
  skip: number;
  take: number;
  query?: string;
  categoryIds?: number[];
}): Promise<{ rows: PostDetail[]; count: number }> {
  const conditions: unknown[] = [];
  if (query.trim()) conditions.push(["name", "contains", query.trim()]);
  if (categoryIds && categoryIds.length > 0) {
    conditions.push(
      categoryIds.length === 1
        ? ["categoryId", "=", categoryIds[0]]
        : categoryIds.flatMap((id, i) => (i === 0 ? [["categoryId", "=", id]] : ["or", ["categoryId", "=", id]]))
    );
  }
  const filter = conditions.flatMap((c, i) => (i === 0 ? [c] : ["and", c]));
  const params = new URLSearchParams({ take: String(take), skip: String(skip) });
  if (filter.length > 0) params.set("filter", JSON.stringify(filter.length === 1 ? filter[0] : filter));
  const res = await apiFetch<ApiListResponse<Product>>(`/product?${params}`);
  return { rows: (res.data?.rows ?? []).map(toPostDetail), count: res.data?.count ?? 0 };
}

export async function getPost(id: number): Promise<PostDetail | null> {
  const res = await apiFetch<ApiItemResponse<Product | null>>(`/product/${id}`);
  return res.data ? toPostDetail(res.data) : null;
}

/** Fields edited on the product form. */
export interface PostInput {
  name: string;
  /** Base price; the shop strikes it through when `price` is lower. */
  mainPrice: number;
  /** Selling price after any discount. */
  price: number;
  categoryId: number | null;
  note: string;
  /** Whether the shop lists it; also sent as `statusId`. */
  isActive: boolean;
  /** Shown while no colour is picked in the shop. See `newFiles` for `blob:` entries. */
  images: string[];
  /** What the product varies by (colour, size, …); empty for a one-version product. */
  attrs: PostAttrInput[];
  /** Stock per combination of `attrs` values — one entry when `attrs` is empty. */
  variants: PostVariantInput[];
  /**
   * Images picked in this draft, by the `blob:` URL that stands in for them in
   * `images` / `attrs[].values[].image(s)` — upload each and swap in its file id.
   */
  newFiles: Record<string, File>;
}

export interface PostAttrInput {
  /** Catalogue attribute (`Attr.id`); `null` only for old posts whose variants differ by name alone. */
  attrId: number | null;
  name: string;
  /**
   * `attrValueId` is the catalogue value (`AttrOption.id`), `null` for one
   * typed in on the product. `color` is the swatch hex. `image` (the value's
   * cover) and `images` are what the shop shows once a shopper picks it.
   */
  values: {
    attrValueId: number | null;
    value: string;
    color: string | null;
    image: string | null;
    images: string[];
  }[];
}

export interface PostVariantInput {
  /** Existing variant (`PostProduct.id`); `null` for a new one. */
  id: number | null;
  /** One value per `PostInput.attrs` entry, in the same order. */
  values: string[];
  qty: number;
  /** Like `PostInput.mainPrice` / `price`, for this variant. */
  mainPrice: number;
  price: number;
}

// `POST/PUT /product` body. The backend matches variants by `id`, else by
// their `attr`; `attrs` carries every value's images.
function toProductBody(input: PostInput) {
  return {
    // Today, `YYYY-MM-DD` in local time — also when editing.
    date: new Date().toLocaleDateString("en-CA"),
    categoryId: input.categoryId,
    name: input.name,
    description: input.note || null,
    isActive: input.isActive,
    statusId: input.isActive ? "active" : "inactive",
    images: input.images,
    qty: input.variants.reduce((sum, v) => sum + v.qty, 0),
    mainPrice: input.mainPrice,
    price: input.price,
    attrs: input.attrs.map((attr) => ({ attrId: attr.attrId, name: attr.name, values: attr.values })),
    variants: input.variants.map((variant) => ({
      id: variant.id,
      name: variant.values.join(" / ") || input.name || tr("common.unnamed"),
      price: variant.price,
      mainPrice: variant.mainPrice,
      qty: variant.qty,
      attr: input.attrs.flatMap((attr, i) => {
        const value = attr.values.find((v) => v.value === variant.values[i]);
        if (attr.attrId == null || !value) return [];
        return [{ attrId: attr.attrId, attrName: attr.name, value: value.value, color: value.color, image: value.image }];
      }),
    })),
  };
}

/** `id` is `null` for a new product. */
export async function savePost(id: number | null, input: PostInput): Promise<void> {
  if (input.categoryId == null) throw new Error(tr("pf.mustPickCategory"));
  await apiFetch(id == null ? "/product" : `/product/${id}`, {
    method: id == null ? "POST" : "PUT",
    body: toProductBody(await withUploads(input)),
  });
}

/** Uploads the draft's new images and puts their file ids where the `blob:` URLs were. */
async function withUploads(input: PostInput): Promise<PostInput> {
  const uploaded = new Map(
    await Promise.all(Object.entries(input.newFiles).map(async ([ref, file]) => [ref, await uploadFile(file)] as const))
  );
  if (uploaded.size === 0) return input;
  const swap = (ref: string) => uploaded.get(ref) ?? ref;
  return {
    ...input,
    images: input.images.map(swap),
    attrs: input.attrs.map((attr) => ({
      ...attr,
      values: attr.values.map((v) => ({ ...v, image: v.image && swap(v.image), images: v.images.map(swap) })),
    })),
    newFiles: {},
  };
}

export async function deletePost(id: number): Promise<void> {
  await apiFetch(`/product/${id}`, { method: "DELETE" });
}
