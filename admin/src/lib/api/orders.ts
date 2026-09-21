import { endpointMissing } from "./errors";
import { SAMPLE_ORDERS, sampleSalesSummary } from "./sample";

// eshop-service has no order list/detail/status or sales endpoints yet (only
// `POST /order/checkOrders`, a status poll). Until they land, the readers
// below serve placeholder data from `./sample` — pages that use them show a
// "sample data" notice — and the writers reject. Swap the bodies for
// `apiFetch` calls once the endpoints exist; the pages won't need to change.

export type OrderStatus = "pending" | "confirmed" | "delivered" | "returned";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Хүлээгдэж буй",
  confirmed: "Баталгаажсан",
  delivered: "Хүргэгдсэн",
  returned: "Буцаагдсан",
};

/** Label for each step on the order's status timeline. */
export const ORDER_STEP_LABEL: Record<OrderStatus, string> = {
  pending: "Захиалга орсон",
  confirmed: "Баталгаажсан",
  delivered: "Хүргэгдсэн",
  returned: "Буцаагдсан",
};

/** The one action that moves an order forward; final states have none. */
export const NEXT_ORDER_ACTION: Record<OrderStatus, { label: string; to: OrderStatus } | null> = {
  pending: { label: "Захиалга баталгаажуулах", to: "confirmed" },
  confirmed: { label: "Хүргэгдсэн гэж тэмдэглэх", to: "delivered" },
  delivered: null,
  returned: null,
};

export interface OrderItem {
  id: number;
  name: string;
  image: string | null;
  qty: number;
  price: number;
  /** Units of this line already sent back; absent when none. */
  returnedQty?: number;
}

export interface Order {
  id: number;
  status: OrderStatus;
  createdAt: string;
  customer: { name: string; phone: string; address: string };
  items: OrderItem[];
  deliveryFee: number;
  /** When the order reached each step; steps not reached yet are absent. */
  timeline: Partial<Record<OrderStatus, string>>;
}

/** Units of the line still in the order. */
export function keptQty(item: OrderItem) {
  return item.qty - (item.returnedQty ?? 0);
}

export function orderSubtotal(order: Order) {
  return order.items.reduce((sum, item) => sum + item.qty * item.price, 0);
}

/** Value of the units sent back. */
export function orderReturnedAmount(order: Order) {
  return order.items.reduce((sum, item) => sum + (item.returnedQty ?? 0) * item.price, 0);
}

export function orderTotal(order: Order) {
  return orderSubtotal(order) - orderReturnedAmount(order) + order.deliveryFee;
}

/** Newest first. */
export async function getOrders(): Promise<Order[]> {
  return SAMPLE_ORDERS;
}

export async function getOrder(id: number): Promise<Order | null> {
  return SAMPLE_ORDERS.find((order) => order.id === id) ?? null;
}

export const setOrderStatus: (id: number, status: OrderStatus) => Promise<void> = () =>
  endpointMissing("Захиалгын төлөв солих");

/** Sends back `qty` units of one line, e.g. 1 of the 2 ordered. */
export const returnOrderItem: (orderId: number, itemId: number, qty: number) => Promise<void> = () =>
  endpointMissing("Бараа буцаах");

export type SalesRange = "today" | "yesterday" | "week" | "month";

export interface SalesSummary {
  orders: number;
  revenue: number;
  /** Change against the previous period, e.g. "+3 өчигдрөөс". */
  ordersDelta: { text: string; positive: boolean } | null;
  revenueDelta: { text: string; positive: boolean } | null;
  /** "цагаар" (hourly) or "өдрөөр" (daily). */
  seriesUnit: string;
  /** Revenue per bucket, oldest first; `tick` labels the axis under some bars. */
  series: { label: string; tick?: string; value: number }[];
}

export async function getSalesSummary(range: SalesRange): Promise<SalesSummary> {
  return sampleSalesSummary(range);
}
