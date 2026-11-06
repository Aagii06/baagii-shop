import { tr } from "@/lib/i18n/translations";
import { apiFetch, type ApiListResponse } from "./client";

// Messages left on the shop's /contact page ("Бидэнд бичнэ үү", `POST /feedback`
// on ../backend's /web). Read here in the admin panel.
//   GET    /feedback              → { rows: Feedback[], count }
//   POST   /feedback/{id}/read
//   POST   /feedback/{id}/unread
//   DELETE /feedback/{id}

export type FeedbackStatus = "new" | "read";

export interface Feedback {
  id: number;
  name: string;
  email: string;
  /** Asked by AjrugShop's form instead of a subject. */
  phone: string | null;
  subject: string | null;
  message: string;
  status: FeedbackStatus;
  createdAt: string;
  readAt: string | null;
}

export const feedbackStatusLabel = (status: FeedbackStatus) => tr(`fb.status.${status}`);

/** Newest first. */
export async function getFeedbacks(): Promise<Feedback[]> {
  const res = await apiFetch<ApiListResponse<Feedback>>("/feedback");
  return res.data?.rows ?? [];
}

export async function markFeedbackRead(id: number): Promise<void> {
  await apiFetch(`/feedback/${id}/read`, { method: "POST" });
}

export async function markFeedbackUnread(id: number): Promise<void> {
  await apiFetch(`/feedback/${id}/unread`, { method: "POST" });
}

export async function deleteFeedback(id: number): Promise<void> {
  await apiFetch(`/feedback/${id}`, { method: "DELETE" });
}
