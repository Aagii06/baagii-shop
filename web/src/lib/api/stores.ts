import { apiFetch } from "./client";

/** A seller store; `logo` is a file id. */
export interface Store {
  id: number;
  name: string;
  logo: string | null;
  /** Published products; stores with none are listed too. */
  productCount: number;
}

interface ApiStoresResponse {
  success: boolean;
  message: string;
  data: Store[];
}

/** Every active store of this shop, most products first. */
export async function getStores(): Promise<Store[]> {
  const res = await apiFetch<ApiStoresResponse>("/store", { method: "GET" });
  return res.data ?? [];
}
