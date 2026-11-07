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

/** Every active store of this shop: highest tier, then most products, first. */
export async function getStores(): Promise<Store[]> {
  const res = await apiFetch<ApiStoresResponse>("/store", { method: "GET" });
  return res.data ?? [];
}
