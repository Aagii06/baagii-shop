import { apiFetch } from "./client";

// Notifications of the phone-signed-in shopper (../backend `/web/notification`):
// order status changes (paid, confirmed, delivered, cancelled, returned) and
// the answer to a partner ("Хамтран ажиллах") request.
//   GET  /notification?skip=&take= → { rows, count, unread }
//   GET  /notification/unread      → { unread }
//   POST /notification/{id}/read
//   POST /notification/readAll

export type CustomerNotificationType =
  | "order_paid"
  | "order_confirmed"
  | "order_delivered"
  | "order_cancelled"
  | "order_returned"
  | "partner_approved"
  | "partner_rejected";

export interface CustomerNotification {
  id: number;
  type: CustomerNotificationType;
  title: string;
  body: string | null;
  /** Site path to open, e.g. "/orders/12". */
  link: string | null;
  read: boolean;
  createdAt: string;
}

interface ApiItemResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface NotificationsPage {
  rows: CustomerNotification[];
  count: number;
  unread: number;
}

export async function getNotifications(skip = 0, take = 30): Promise<NotificationsPage> {
  const res = await apiFetch<ApiItemResponse<NotificationsPage>>(`/notification?skip=${skip}&take=${take}`);
  return { rows: res.data?.rows ?? [], count: res.data?.count ?? 0, unread: res.data?.unread ?? 0 };
}

export async function getUnreadNotifications(): Promise<number> {
  const res = await apiFetch<ApiItemResponse<{ unread: number }>>("/notification/unread");
  return res.data?.unread ?? 0;
}

export async function markNotificationRead(id: number): Promise<void> {
  await apiFetch(`/notification/${id}/read`, { method: "POST" });
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiFetch("/notification/readAll", { method: "POST" });
}
