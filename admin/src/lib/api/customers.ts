import { apiFetch, type ApiListResponse } from "./client";

// Shoppers who signed in on the website with their phone and an SMS code
// (../backend `/customer`, admins only). Read-only: a customer starts as
// "Зочин" and edits their own name on the website.
//   GET /customer → { rows: Customer[], count }

export interface Customer {
  id: number;
  phone: string;
  name: string | null;
  orderCount: number;
  lastOrderAt: string | null;
  createdAt: string | null;
}

export async function getCustomers(): Promise<Customer[]> {
  const res = await apiFetch<ApiListResponse<Customer>>("/customer");
  return res.data?.rows ?? [];
}
