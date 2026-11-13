import { apiFetch } from "./client";

export interface FeedbackInput {
  name: string;
  email: string;
  /** Optional. */
  phone?: string;
  subject?: string;
  message: string;
  /** Google reCAPTCHA v2 token, when the checkbox is turned on. */
  recaptchaToken?: string;
}

// "Бидэнд бичнэ үү" (/contact): `POST /feedback` on ../backend's /web, no
// sign-in needed. The admin panel reads them under Профайл → Санал хүсэлт.
export async function sendFeedback(input: FeedbackInput): Promise<void> {
  await apiFetch("/feedback", { method: "POST", auth: false, body: input });
}
