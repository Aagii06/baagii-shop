import { apiFetch, type ApiItemResponse } from "./client";
import type { OrderStatus } from "./orders";

// Seller stores' sales and what the shop has paid them (../backend `/storeReport`, admins only).
// Each order line keeps the store it was bought from; the shop's own products aren't here.
//   delivered — delivered orders, returns taken off: money owed to the seller
//   pending   — pending / confirmed orders: owed once delivered
// `from`/`to` (YYYY-MM-DD, both inclusive) pick orders by the day they were placed;
// `balance` is all-time: everything delivered minus everything paid.
//   GET  /storeReport?from=&to=
//   GET  /storeReport/:storeId?from=&to=
//   POST /storeReport/:storeId/settle { amount, note? }

export interface StoreSales {
  storeId: number;
  storeName: string;
  logo: string | null;
  orders: number;
  deliveredQty: number;
  delivered: number;
  pending: number;
  settled: number;
  balance: number;
}

export interface StoreSalesOrder {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  createdAt: string;
  deliveredAt: string | null;
  /** This store's lines only, returns taken off. */
  amount: number;
  items: { id: number; name: string; image: string | null; qty: number; returnedQty: number; price: number }[];
}

export interface StoreSettlement {
  id: number;
  amount: number;
  note: string | null;
  createdAt: string;
}

export interface Period {
  from?: string;
  to?: string;
}

const query = ({ from, to }: Period) => {
  const qs = new URLSearchParams();
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  const s = qs.toString();
  return s ? `?${s}` : "";
};

export async function getStoreSales(period: Period) {
  const res = await apiFetch<ApiItemResponse<{ rows: StoreSales[]; total: { delivered: number; pending: number; balance: number } }>>(
    `/storeReport${query(period)}`
  );
  return res.data ?? { rows: [], total: { delivered: 0, pending: 0, balance: 0 } };
}

export async function getStoreSalesDetail(storeId: number, period: Period) {
  const res = await apiFetch<ApiItemResponse<(StoreSales & { orders: StoreSalesOrder[]; settlements: StoreSettlement[] }) | null>>(
    `/storeReport/${storeId}${query(period)}`
  );
  return res.data ?? null;
}

export async function settleStore(storeId: number, amount: number, note: string): Promise<void> {
  await apiFetch(`/storeReport/${storeId}/settle`, { method: "POST", body: { amount, note } });
}

export type PeriodKey = "month" | "lastMonth" | "days30" | "all";

const day = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** The chips' date ranges, in the viewer's local time. */
export function periodOf(key: PeriodKey): Period {
  const now = new Date();
  if (key === "month") return { from: day(new Date(now.getFullYear(), now.getMonth(), 1)), to: day(now) };
  if (key === "lastMonth")
    return { from: day(new Date(now.getFullYear(), now.getMonth() - 1, 1)), to: day(new Date(now.getFullYear(), now.getMonth(), 0)) };
  if (key === "days30") return { from: day(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29)), to: day(now) };
  return {};
}

export const PERIOD_KEYS: PeriodKey[] = ["month", "lastMonth", "days30", "all"];

export const periodLabelKey: Record<PeriodKey, string> = {
  month: "ss.month",
  lastMonth: "ss.lastMonth",
  days30: "ss.days30",
  all: "ss.all",
};

/** `?period=` — so the detail page and back button keep the chosen range. */
export function readPeriod(value: string | null): PeriodKey {
  return PERIOD_KEYS.includes(value as PeriodKey) ? (value as PeriodKey) : "month";
}
