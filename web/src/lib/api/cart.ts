import { apiFetch } from "./client";
import { ApiError } from "./errors";

export interface AddProductToCartPayload {
  postProductId: number;
  /** New absolute quantity for the line. `0` removes the line. */
  qty: number;
  branchId: number;
  /** Omit / `0` to add a new line; pass an existing line id to update it. */
  cartDetailId?: number;
}

interface ApiItemResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface ApiListResponse<T> {
  success: boolean;
  message: string;
  data: {
    rows: T[];
    count: number;
    summary: unknown[];
  };
}

// One line of an active cart, as returned by `/cart/addProduct` (the whole
// row) and inside `/cart/getActiveCarts` (`rows[].cartDetails[]`). Shapes
// match the eshop-service OpenAPI doc; `postId` / `postProductId` are
// nullable there (e.g. after the catalogue post is removed).
export interface ApiCartDetail {
  id: number;
  cartId: number;
  branchId: number;
  postId: number | null;
  postProductId: number | null;
  productId: number;
  productCode: string;
  productName: string;
  variantId: number;
  variantCode: string;
  variantName: string;
  image: string | null;
  price: string;
  qty: string;
  amount: string;
}

export interface ApiActiveCart {
  id: number;
  qty: string;
  productCnt: number;
  amount: string;
  cartTypeId: number;
  cartStatusId: number;
  cartDetails: ApiCartDetail[];
}

// Adds / updates / removes a single cart line and returns its id
// (cartDetailId), needed later to update or remove that same line.
// `qty` is the resulting absolute quantity, not a delta.
export async function addProductToCart(payload: AddProductToCartPayload) {
  const res = await apiFetch<ApiItemResponse<ApiCartDetail | null>>(
    "/cart/addProduct",
    {
      method: "POST",
      body: { cartDetailId: 0, ...payload },
    }
  );
  // Per the doc `data` is nullable even on success; a successful add/update
  // always carries the line, so treat a missing body as a failure.
  if (!res.data) {
    throw new ApiError(200, res.message || "cart.error.generic", res);
  }
  return res.data.id;
}

// Deletes the whole cart (`id` is the cartId, not a line id). The backend
// has no per-line delete endpoint — remove a single line by calling
// `addProductToCart` with `qty: 0` instead.
export function deleteCart(cartId: number) {
  return apiFetch<ApiItemResponse<null>>(`/cart/${cartId}`, {
    method: "DELETE",
  });
}

export async function getActiveCarts() {
  const res = await apiFetch<ApiListResponse<ApiActiveCart>>(
    "/cart/getActiveCarts"
  );
  return res.data.rows;
}

export async function getCartsProductCnt() {
  const res = await apiFetch<ApiItemResponse<number>>(
    "/cart/getCartsProductCnt"
  );
  return res.data;
}

export interface CreatePaymentAndInvoicePayload {
  cartId: number;
  ctPaymentMethodId: number;
  deliveryOrder: {
    notes: number[];
    customerAddressId: number;
    note?: string;
  };
}

// Return shape unconfirmed (generic Swagger placeholder). Not yet wired
// into the checkout flow — see conversation for why.
export async function createPaymentAndInvoice(
  payload: CreatePaymentAndInvoicePayload
) {
  const res = await apiFetch<ApiItemResponse<unknown>>(
    "/cart/createPaymentAndInvoice",
    { method: "POST", body: payload }
  );
  return res.data;
}
