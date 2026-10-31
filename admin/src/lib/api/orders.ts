import { tr } from "@/lib/i18n/translations";
import { apiFetch, type ApiItemResponse, type ApiListResponse } from "./client";

// Orders live in ../backend (`/order`): shop orders placed at checkout and
// ones an admin enters here. Placing one takes its lines' stock; sending
// items back returns it.

export type OrderStatus = "pending" | "confirmed" | "delivered" | "returned";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  get pending() {
    return tr("os.pending");
  },
  get confirmed() {
    return tr("os.confirmed");
  },
  get delivered() {
    return tr("os.delivered");
  },
  get returned() {
    return tr("os.returned");
  },
};

/** Label for each step on the order's status timeline. */
export const ORDER_STEP_LABEL: Record<OrderStatus, string> = {
  get pending() {
    return tr("os.step.pending");
  },
  get confirmed() {
    return tr("os.step.confirmed");
  },
  get delivered() {
    return tr("os.step.delivered");
  },
  get returned() {
    return tr("os.step.returned");
  },
};

/** The one action that moves an order forward; final states have none. */
export const NEXT_ORDER_ACTION: Record<OrderStatus, { label: string; to: OrderStatus } | null> = {
  pending: {
    get label() {
      return tr("os.action.confirm");
    },
    to: "confirmed",
  },
  confirmed: {
    get label() {
      return tr("os.action.deliver");
    },
    to: "delivered",
  },
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
  const res = await apiFetch<ApiListResponse<Order>>("/order");
  return res.data?.rows ?? [];
}

export async function getOrder(id: number): Promise<Order | null> {
  const res = await apiFetch<ApiItemResponse<Order | null>>(`/order/${id}`);
  return res.data;
}

/** `returned` sends back every unit still in the order. */
export async function setOrderStatus(id: number, status: OrderStatus): Promise<void> {
  await apiFetch(`/order/${id}/status`, { method: "PUT", body: { status } });
}

/** Sends back `qty` units of one line, e.g. 1 of the 2 ordered. */
export async function returnOrderItem(orderId: number, itemId: number, qty: number): Promise<void> {
  await apiFetch(`/order/${orderId}/return`, { method: "POST", body: { itemId, qty } });
}

/** What an admin enters to place an order on a customer's behalf. */
export interface OrderInput {
  customer: { phone: string; address: string };
  items: {
    /** The product's variant (`PostProduct.id`), which carries the stock and price. */
    variantId: number;
    name: string;
    qty: number;
    price: number;
  }[];
  deliveryFee: number;
}

/** The order starts as "pending" and takes its lines' stock. */
export async function createOrder(input: OrderInput): Promise<void> {
  await apiFetch("/order", { method: "POST", body: input });
}

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

/** `GET /order/sales` — revenue per hour or day of the range, and the period before it. */
interface SalesData {
  unit: "hour" | "day";
  orders: number;
  revenue: number;
  previous: { orders: number; revenue: number };
  series: { start: string; value: number }[];
}

const WEEKDAYS = ["Ня", "Да", "Мя", "Лх", "Пү", "Ба", "Бя"];

function delta(now: number, before: number, against: string, percent: boolean) {
  if (now === before) return null;
  const diff = now - before;
  const sign = diff > 0 ? "+" : "−";
  const text = percent
    ? before === 0
      ? null
      : `${sign}${Math.abs((diff / before) * 100).toFixed(1)}%`
    : `${sign}${Math.abs(diff)} ${against}`;
  return text ? { text, positive: diff > 0 } : null;
}

export async function getSalesSummary(range: SalesRange): Promise<SalesSummary> {
  const res = await apiFetch<ApiItemResponse<SalesData>>(`/order/sales?range=${range}`);
  const data = res.data;
  const hourly = data.unit === "hour";
  const tickEvery = hourly ? 6 : data.series.length <= 7 ? 1 : 7;
  return {
    orders: data.orders,
    revenue: data.revenue,
    ordersDelta: delta(data.orders, data.previous.orders, tr(`dash.vs.${range}`), false),
    revenueDelta: delta(data.revenue, data.previous.revenue, "", true),
    seriesUnit: tr(hourly ? "dash.unit.hour" : "dash.unit.day"),
    series: data.series.map((point, i) => {
      const date = new Date(point.start);
      const label = hourly
        ? `${String(date.getHours()).padStart(2, "0")}:00`
        : data.series.length <= 7
          ? WEEKDAYS[date.getDay()]
          : `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      return { label, tick: i % tickEvery === 0 ? label : undefined, value: point.value };
    }),
  };
}
