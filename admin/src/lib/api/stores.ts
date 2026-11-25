import { apiFetch, type ApiItemResponse, type ApiListResponse } from "./client";

// Seller stores within the shop (../backend `/store`). A shopper user
// belongs to one and only sees its products; an admin picks the store when
// adding a product. A shopper's list holds just their own store.
//   GET    /store       → { rows: Store[], count }
//   GET    /store/{id}
//   POST   /store       StoreInput        (admin)
//   PUT    /store/{id}  StoreInput        (admin)
//   DELETE /store/{id}                    (admin; refused while it has products or shoppers)

/** Phones, emails and addresses a store can have, each. */
export const MAX_STORE_CONTACTS = 5;

/** Store tiers, highest first. Only an admin sets them; the shop's
 *  Stores page lists higher tiers' products first. */
export const STORE_TIERS = ["gold", "silver", "bronze", "normal"] as const;
export type StoreTier = (typeof STORE_TIERS)[number];

/** Badge colours per tier; `normal` shows no badge. */
export const TIER_BADGE: Record<Exclude<StoreTier, "normal">, string> = {
  gold: "bg-amber-100 text-amber-800",
  silver: "bg-slate-200 text-slate-700",
  bronze: "bg-orange-100 text-orange-800",
};

/** Mongolian banks for the store's payout account. */
export const BANKS = [
  "Хаан банк",
  "Голомт банк",
  "Худалдаа хөгжлийн банк",
  "Хас банк",
  "Төрийн банк",
  "Капитрон банк",
  "Богд банк",
  "Ариг банк",
  "Үндэсний хөрөнгө оруулалтын банк",
  "Чингис хаан банк",
  "Тээвэр хөгжлийн банк",
  "М банк",
] as const;

/** Payout accounts a store can have. */
export const MAX_STORE_BANKS = 5;

export interface StoreBank {
  /** Only on saved accounts. */
  id?: number;
  name: string | null;
  /** Account number or IBAN (MN + 18 digits), no spaces. */
  account: string | null;
  holder: string | null;
}

export interface Store {
  id: number;
  name: string;
  /** The main (first) of `phones`; likewise `email`, `address`. */
  phone: string | null;
  phones: string[];
  email: string | null;
  emails: string[];
  address: string | null;
  addresses: string[];
  /** Logo file id. */
  logo: string | null;
  tier: StoreTier;
  /** Where the shop pays the store's settlements (copied by hand into a bank app); the first is the main one. */
  banks: StoreBank[];
  /** Active products; only on the list. */
  productsCnt?: number;
  createdAt: string;
}

export interface StoreInput {
  name: string;
  /** At least one; the first is the main. */
  phones: string[];
  emails: string[];
  addresses: string[];
  logo: string | null;
  tier: StoreTier;
  banks: StoreBank[];
}

/** By tier (gold first), then oldest first; id breaks ties. */
export async function getStores(): Promise<Store[]> {
  const res = await apiFetch<ApiListResponse<Store>>("/store");
  const rank = (s: Store) => {
    const i = STORE_TIERS.indexOf(s.tier);
    return i < 0 ? STORE_TIERS.length : i;
  };
  return (res.data?.rows ?? []).sort(
    (a, b) =>
      rank(a) - rank(b) ||
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() ||
      a.id - b.id,
  );
}

export async function getStore(id: number): Promise<Store | null> {
  const res = await apiFetch<ApiItemResponse<Store | null>>(`/store/${id}`);
  return res.data;
}

export async function createStore(input: StoreInput): Promise<void> {
  await apiFetch("/store", { method: "POST", body: input });
}

export async function updateStore(id: number, input: StoreInput): Promise<void> {
  await apiFetch(`/store/${id}`, { method: "PUT", body: input });
}

export async function deleteStore(id: number): Promise<void> {
  await apiFetch(`/store/${id}`, { method: "DELETE" });
}
