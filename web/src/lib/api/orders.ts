import type { Order } from "@/types/order";
import { apiFetch } from "./client";

export type CreateOrderPayload = Omit<
  Order,
  "id" | "status" | "createdAt" | "confirmedAt"
>;

export function getOrders() {
  return apiFetch<Order[]>("/orders");
}

export function getOrder(id: string) {
  return apiFetch<Order>(`/orders/${id}`);
}

export function createOrder(payload: CreateOrderPayload) {
  return apiFetch<Order>("/orders", { method: "POST", body: payload });
}

export function confirmOrder(id: string, paymentMethod?: Order["paymentMethod"]) {
  return apiFetch<Order>(`/orders/${id}/confirm`, {
    method: "POST",
    body: { paymentMethod },
  });
}
