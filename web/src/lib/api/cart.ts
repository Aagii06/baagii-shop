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
