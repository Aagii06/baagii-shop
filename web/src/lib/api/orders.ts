import type { Order, PaymentMethod, ShippingInfo } from "@/types/order";
import { apiFetch } from "./client";
import { fileThumbnailUrl } from "./files";

interface ApiItemResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface ApiListResponse<T> {
  success: boolean;
  message: string;
  data: { rows: T[]; count: number; summary: unknown[] };
}

// Orders of the phone-signed-in shopper (../backend `/order`). Checkout turns
// the server cart into an order; prices, delivery and the coupon are worked
// out by the backend, which also takes the stock.
export type BackendOrderStatus = "pending" | "confirmed" | "delivered" | "returned";

interface ApiOrder extends Omit<Order, "status" | "confirmedAt" | "paymentMethod"> {
  /** Where the shop has it — confirmed and delivered by the shop's staff. */
  status: BackendOrderStatus;
  paymentMethod: PaymentMethod | null;
  paidAt: string | null;
}

// The shop's own `status` is about payment: "confirmed" once paid.
function toOrder(o: ApiOrder): Order {
  return {
    ...o,
    items: o.items.map((item) => ({ ...item, image: fileThumbnailUrl(item.image) ?? "" })),
    status: o.paidAt ? "confirmed" : "pending",
    paymentMethod: o.paymentMethod ?? undefined,
    confirmedAt: o.paidAt ?? undefined,
  };
}

/** Newest first. */
export async function getMyOrders(): Promise<Order[]> {
  const res = await apiFetch<ApiListResponse<ApiOrder>>("/order");
  return res.data.rows.map(toOrder);
}

export async function placeOrder(input: {
  shippingInfo: ShippingInfo;
  couponCode?: string | null;
}): Promise<Order> {
  const res = await apiFetch<ApiItemResponse<ApiOrder>>("/order", {
    method: "POST",
    body: input,
  });
  return toOrder(res.data);
}

// No payment provider yet: the backend records the method as paid.
export async function payOrder(id: string, paymentMethod: PaymentMethod): Promise<Order> {
  const res = await apiFetch<ApiItemResponse<ApiOrder>>(`/order/${id}/pay`, {
    method: "POST",
    body: { paymentMethod },
  });
  return toOrder(res.data);
}
