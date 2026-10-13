import { apiFetch, fetchAllRows, type ApiListResponse } from "./client";
import { endpointMissing } from "./errors";

/** Remaining stock at or below this is flagged as running low. */
export const LOW_STOCK_THRESHOLD = 5;

// Products come from eshop-admin `GET /product` (paged; no `GET /product/{id}`)
// and are saved with `POST /product` / `PUT /product/{id}`. The backend turns
// each into an eshop post, so the UI keeps the post-shaped `Post` /
// `PostDetail` below, built from the rows by `toPostDetail`.
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
  createdAt: string;
  updatedAt: string;
  variants: ProductVariant[] | null;
}

export interface Post {
  id: number;
  categoryId: number | null;
  date: string;
  name: string;
  note: string | null;
  /** Not on `GET /product` — read it through `isPublished`. */
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
    name: product.name || product.title || "",
    note: product.description,
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
    postAttrs: collectAttrs(variants),
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

export async function getPost(id: number): Promise<PostDetail | null> {
  const filter = encodeURIComponent(JSON.stringify(["id", "=", id]));
  const res = await apiFetch<ApiListResponse<Product>>(`/product?take=1&filter=${filter}`);
  const product = res.data?.rows?.find((p) => p.id === id);
  return product ? toPostDetail(product) : null;
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
  /** Not saved yet — `POST/PUT /product` take no such field. */
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

// `POST/PUT /product` body. The backend matches variants by their `attr`, and
// has nowhere for a value's extra images — only its cover (`image`) is sent.
function toProductBody(input: PostInput) {
  return {
    // Today, `YYYY-MM-DD` in local time — also when editing.
    date: new Date().toLocaleDateString("en-CA"),
    categoryId: input.categoryId,
    name: input.name,
    description: input.note || null,
    images: input.images,
    qty: input.variants.reduce((sum, v) => sum + v.qty, 0),
    mainPrice: input.mainPrice,
    price: input.price,
    variants: input.variants.map((variant) => ({
      name: variant.values.join(" / ") || null,
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
  if (input.categoryId == null) throw new Error("Категори сонгоно уу.");
  // No file-upload endpoint yet, and `blob:` URLs mean nothing to the backend.
  if (Object.keys(input.newFiles).length > 0) return endpointMissing("Зураг хуулах");
  await apiFetch(id == null ? "/product" : `/product/${id}`, {
    method: id == null ? "POST" : "PUT",
    body: toProductBody(input),
  });
}

export const deletePost: (id: number) => Promise<void> = () =>
  endpointMissing("Барааг устгах");
