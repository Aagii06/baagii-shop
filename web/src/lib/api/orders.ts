import { apiFetch } from "./client";

interface ApiItemResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// The eshop-service has no REST CRUD for orders — creating one goes through
// `POST /cart/createPaymentAndInvoice` (see `./cart`). The only order
// endpoint is a status poll used after checkout to reconcile the local
// (Redux) order with the backend.
export type BackendOrderStatus =
  | "draft"
  | "pending"
  | "confirmed"
  | "cancelled";

// `POST /order/checkOrders` — body `{ orderIds }`, returns the resolved
// status. `data` is nullable when none of the ids match.
export async function checkOrders(
  orderIds: number[]
): Promise<{ status: BackendOrderStatus } | null> {
  const res = await apiFetch<
    ApiItemResponse<{ status: BackendOrderStatus } | null>
  >("/order/checkOrders", { method: "POST", body: { orderIds } });
  return res.data;
}
