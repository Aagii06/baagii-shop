import { apiFetch, type ApiItemResponse } from "./client";

// Толгойн 🔔 мэдэгдэл (../backend `/notification`). Хэрэглэгч бүр өөрийнхөө
// мэдэгдлийг л харна: ADMIN — бүгдийг, SHOPPER — өөрийн дэлгүүрийн нөөц.
//   GET  /notification?skip=&take= → { rows, count, unread }
//   GET  /notification/unread      → { unread }
//   POST /notification/{id}/read
//   POST /notification/readAll

export type NotificationType = "order" | "order_paid" | "partner" | "feedback" | "low_stock";

export interface AppNotification {
  id: number;
  type: NotificationType;
  title: string;
  body: string | null;
  /** Admin path to open, e.g. "/orders/12". */
  link: string | null;
  read: boolean;
  createdAt: string;
}

export interface NotificationsPage {
  rows: AppNotification[];
  count: number;
  unread: number;
}

export async function getNotifications(skip = 0, take = 30): Promise<NotificationsPage> {
  const res = await apiFetch<ApiItemResponse<NotificationsPage>>(`/notification?skip=${skip}&take=${take}`);
  return { rows: res.data?.rows ?? [], count: res.data?.count ?? 0, unread: res.data?.unread ?? 0 };
}

export async function getUnreadCount(): Promise<number> {
  const res = await apiFetch<ApiItemResponse<{ unread: number }>>("/notification/unread");
  return res.data?.unread ?? 0;
}

export async function markNotificationRead(id: number): Promise<void> {
  await apiFetch(`/notification/${id}/read`, { method: "POST" });
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiFetch("/notification/readAll", { method: "POST" });
}
