import { apiFetch } from "./client";

export interface AddProductToCartPayload {
  postProductId: number;
  qty: number;
  branchId: number;
  cartDetailId?: number;
}

export function addProductToCart(payload: AddProductToCartPayload) {
  return apiFetch<unknown>("/cart/addProduct", {
    method: "POST",
    body: { cartDetailId: 0, ...payload },
  });
}
