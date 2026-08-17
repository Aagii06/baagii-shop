import type { Product } from "@/types/product";
import { apiFetch } from "./client";

export interface GetProductsParams {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export function getProducts(params?: GetProductsParams) {
  const query = params
    ? "?" +
      new URLSearchParams(
        Object.entries(params).reduce<Record<string, string>>(
          (acc, [key, value]) => {
            if (value !== undefined) acc[key] = String(value);
            return acc;
          },
          {}
        )
      ).toString()
    : "";

  return apiFetch<Product[]>(`/products${query}`, { auth: false });
}

export function getProduct(id: number) {
  return apiFetch<Product>(`/products/${id}`, { auth: false });
}
