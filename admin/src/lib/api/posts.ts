import { apiFetch, type ApiItemResponse, type ApiListResponse } from "./client";
import { endpointMissing } from "./errors";

/** Remaining stock at or below this is flagged as running low. */
export const LOW_STOCK_THRESHOLD = 5;

// A "post" is a shop listing of one catalogue product (`productId`). Shapes
// follow the eshop-service OpenAPI doc (`GET /post`, `GET /post/{id}`);
// DECIMAL columns arrive as strings — convert with `toNumber`.
export interface Post {
  id: number;
  companyId: number;
  code: string | null;
  categoryId: number | null;
  productId: number;
  productCode: string;
  productName: string;
  name: string;
  date: string;
  note: string | null;
  startDate: string | null;
  endDate: string | null;
  isStock: boolean;
  /** Missing from `GET /post` rows today — read it through `isPublished`. */
  isActive?: boolean;
  isHot: boolean;
  mainPrice: string;
  price: string;
  qty: string;
  orderQty: string;
  cartQty: string;
  remain: string;
  images: string[] | null;
  deepLink: string | null;
  cartTypeId: number | null;
  createdAt: string;
  updatedAt: string;
  company?: { id: number; name: string };
  category?: { id: number; name: string; image: string | null } | null;
}

export interface PostProductBranch {
  id: number;
  branchId: number;
  remain: string;
  branch?: { id: number; name: string };
}

/** One sellable variant of a post (size/colour/…). */
export interface PostProduct {
  id: number;
  postId: number;
  productId: number;
  productCode: string;
  productName: string;
  variantId: number;
  variantCode: string;
  variantName: string;
  image: string | null;
  images: string[] | null;
  qty: string;
  orderQty: string;
  cartQty: string;
  remain: string;
  price: string;
  mainPrice: string;
  /** attrId → value */
  attr: Record<string, string> | null;
  postProductBranches?: PostProductBranch[];
}

export interface PostAttrValue {
  id: number;
  attrValueId: number | null;
  value: string;
  color: string | null;
  image: string | null;
  images: string[] | null;
  orderNumber: number;
}

export interface PostAttr {
  id: number;
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

/**
 * Only an explicit `isActive: false` is a draft. The list endpoint leaves the
 * field out, and the shop (web/src/lib/api/products.ts) shows those posts.
 */
export function isPublished(post: Post) {
  return post.isActive !== false;
}

// The endpoint returns every post (inactive ones included) in one page.
export async function getPosts(params: { categoryId?: number } = {}) {
  const query = params.categoryId ? `?categoryId=${params.categoryId}` : "";
  const res = await apiFetch<ApiListResponse<Post>>(`/post${query}`);
  return res.data?.rows ?? [];
}

export async function getPost(id: number) {
  const res = await apiFetch<ApiItemResponse<PostDetail | null>>(
    `/post/${id}`
  );
  return res.data;
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
  isActive: boolean;
  /** What the product varies by (colour, size, …); empty for a one-version product. */
  attrs: PostAttrInput[];
  /** Stock per combination of `attrs` values — one entry when `attrs` is empty. */
  variants: PostVariantInput[];
}

export interface PostAttrInput {
  /** Existing attribute (`PostAttr.attrId`); `null` when new to this product. */
  attrId: number | null;
  /** `lib/attributes` key ("color", "size", …) or a custom attribute's name. */
  key: string;
  name: string;
  /** `color` is the swatch hex, for colours. */
  values: { value: string; color: string | null }[];
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

// No write endpoints on eshop-service yet (see README) — implement these
// bodies once they land; the product form already calls them.
/** `id` is `null` for a new product. */
export const savePost: (id: number | null, input: PostInput) => Promise<void> = () =>
  endpointMissing("Барааг хадгалах");

export const deletePost: (id: number) => Promise<void> = () =>
  endpointMissing("Барааг устгах");

export const addPostImage: (id: number | null, file: File) => Promise<void> = () =>
  endpointMissing("Зураг нэмэх");
