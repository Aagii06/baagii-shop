import { apiFetch, type ApiItemResponse } from "./client";

// Seller stores' sales and what the shop has paid them (../backend `/storeReport`, admins only).
// Each order line keeps the store it was bought from; the shop's own products aren't here.
//   delivered — delivered orders, returns taken off: money owed to the seller
//   pending   — pending / confirmed orders: owed once delivered
// `from`/`to` (YYYY-MM-DD, both inclusive) pick orders by the day they were placed;
// `balance` is all-time: everything delivered minus everything paid.
//   GET  /storeReport?from=&to=
//   GET  /storeReport/:storeId            — the account: unpaid lines, pending, payouts
//   POST /storeReport/:storeId/settle      { expected, note? } — pays every unpaid line

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

/** Lines rolled up per product (variant). */
export interface StoreSoldItem {
  productId: number | null;
  variantId: number | null;
  name: string;
  image: string | null;
  /** Orders it was in. */
  orders: number;
  /** Units — negative when returned after a payout (taken off the next one). */
  qty: number;
  amount: number;
}

/** A delivered order's lines that haven't been paid to the store yet. */
export interface UnsettledOrder {
  id: number;
  orderNumber: string;
  deliveredAt: string | null;
  amount: number;
  items: { id: number; name: string; image: string | null; qty: number; price: number }[];
}

export interface StoreSettlement {
  id: number;
  amount: number;
  note: string | null;
  createdAt: string;
  orders: number;
  qty: number;
  /** The orders this payout covered, with their lines. */
  orderList?: SettlementOrder[];
}

export interface SettlementOrder {
  id: number;
  orderNumber: string;
  amount: number;
  items: { id: number; name: string; image: string | null; qty: number; price: number }[];
}

export interface StoreAccount extends StoreSales {
  /** All-time: delivered sales and not-yet-delivered. */
  allTime: { delivered: number; pending: number };
  /** What the next payout covers (`balance` in total). */
  unsettled: { items: StoreSoldItem[]; orders: UnsettledOrder[] };
  /** In pending / confirmed orders — joins the payout once delivered. */
  pendingItems: StoreSoldItem[];
  settlements: StoreSettlement[];
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

export async function getStoreAccount(storeId: number) {
  const res = await apiFetch<ApiItemResponse<StoreAccount | null>>(`/storeReport/${storeId}`);
  return res.data ?? null;
}

/**
 * Marks every unpaid line as paid. `expected` is the amount the admin saw;
 * the backend refuses if it changed meanwhile (a delivery or a return).
 */
export async function settleStore(storeId: number, expected: number, note: string): Promise<void> {
  await apiFetch(`/storeReport/${storeId}/settle`, { method: "POST", body: { expected, note } });
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
