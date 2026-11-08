import { apiFetch } from "./client";

/** Store tiers, highest first. Set by the shop admin only. */
export const STORE_TIERS = ["gold", "silver", "bronze", "normal"] as const;
export type StoreTier = (typeof STORE_TIERS)[number];

/** 0 for gold … 3 for normal (unknown tiers count as normal). */
export function tierRank(tier: string | undefined): number {
  const i = STORE_TIERS.indexOf(tier as StoreTier);
  return i === -1 ? STORE_TIERS.length - 1 : i;
}

/** A seller store; `logo` is a file id. */
export interface Store {
  id: number;
  name: string;
  logo: string | null;
  tier: StoreTier;
  /** Published products; stores with none are listed too. */
  productCount: number;
}

interface ApiStoresResponse {
  success: boolean;
  message: string;
  data: Store[];
}

/**
 * A store's own page: only its products. `back` is the page it was opened
 * from (path + query, e.g. "/search?q=цүнх"); its back link returns there.
 */
export function storeHref(id: number, back?: string) {
  return back ? `/store?id=${id}&back=${encodeURIComponent(back)}` : `/store?id=${id}`;
}

/** One store with its contacts — for its own page. */
export interface StoreDetail extends Store {
  phones: string[];
  emails: string[];
  addresses: string[];
}

/**
 * `GET /store/{id}`. Falls back to the list entry (no contacts) if the
 * backend doesn't have the endpoint yet; `null` for an unknown store.
 */
export async function getStore(id: number): Promise<StoreDetail | null> {
  try {
    const res = await apiFetch<{ success: boolean; data: StoreDetail | null }>(`/store/${id}`, { method: "GET" });
    if (res.data) return res.data;
  } catch {
    // older backend or unknown id — see below
  }
  const store = (await getStores()).find((s) => s.id === id);
  return store ? { ...store, phones: [], emails: [], addresses: [] } : null;
}

/** Every active store of this shop: highest tier, then most products, first. */
export async function getStores(): Promise<Store[]> {
  const res = await apiFetch<ApiStoresResponse>("/store", { method: "GET" });
  return res.data ?? [];
}
