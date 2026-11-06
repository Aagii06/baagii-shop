import { apiFetch, type ApiListResponse } from "./client";

// Shoppers who signed in on the website with their phone and an SMS code
// (../backend `/customer`, admins only). A customer starts as "Зочин" and
// edits their own name on the website; the admin can only delete one
// that has no orders.
//   GET    /customer     → { rows: Customer[], count }
//   DELETE /customer/:id { password } — the signed-in admin's own password

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

/** Soft-deletes a customer with no orders. Fails on a wrong password or if they have orders. */
export async function deleteCustomer(id: number, password: string): Promise<void> {
  await apiFetch(`/customer/${id}`, { method: "DELETE", body: { password } });
}
