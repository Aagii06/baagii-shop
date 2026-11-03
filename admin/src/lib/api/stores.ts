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
}

/** By name. */
export async function getStores(): Promise<Store[]> {
  const res = await apiFetch<ApiListResponse<Store>>("/store");
  return res.data?.rows ?? [];
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
