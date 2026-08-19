import { apiFetch } from "./client";

export interface AddProductToCartPayload {
  postProductId: number;
  qty: number;
  branchId: number;
  cartDetailId?: number;
}

interface ApiItemResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Assumes `data` is the new/updated cart line's id (cartDetailId), needed
// later for DELETE /cart/{id}. Unconfirmed against a live authenticated
// call — the Swagger schema only shows a generic placeholder.
export async function addProductToCart(payload: AddProductToCartPayload) {
  const res = await apiFetch<ApiItemResponse<number>>("/cart/addProduct", {
    method: "POST",
    body: { cartDetailId: 0, ...payload },
  });
  return res.data;
}

export function removeCartItem(cartDetailId: number) {
  return apiFetch<ApiItemResponse<unknown>>(`/cart/${cartDetailId}`, {
    method: "DELETE",
  });
}

// Field shape inside each cart row is unconfirmed (same generic Swagger
// placeholder as the other cart endpoints) — kept untyped until verified
// against a live authenticated response.
export async function getActiveCarts() {
  const res = await apiFetch<ApiItemResponse<unknown[]>>(
    "/cart/getActiveCarts"
  );
  return res.data;
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
