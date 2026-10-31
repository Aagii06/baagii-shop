import { tr } from "@/lib/i18n/translations";
import { apiFetch, type ApiListResponse } from "./client";

// "Хамтран ажиллах" requests: a shopper leaves a phone number on the shop's
// /seller page (`POST /auth/register` on ../backend's /web), and an admin
// approves it here, which creates a shopper user for that number.
//   GET  /partnerRequest                → { rows: PartnerRequest[], count }
//   POST /partnerRequest/{id}/approve
//   POST /partnerRequest/{id}/reject
//   POST /partnerRequest                { phone } — added straight as approved

export type PartnerRequestStatus = "pending" | "approved" | "rejected";

export interface PartnerRequest {
  id: number;
  /** Phone number the shopper signed up with (the new user's `userName`). */
  phone: string;
  status: PartnerRequestStatus;
  createdAt: string;
}

export const PARTNER_STATUS_LABEL_KEY: Record<PartnerRequestStatus, string> = {
  pending: "pr.status.pending",
  approved: "pr.status.approved",
  rejected: "pr.status.rejected",
};

export const partnerStatusLabel = (status: PartnerRequestStatus) => tr(PARTNER_STATUS_LABEL_KEY[status]);

/** Newest first. */
export async function getPartnerRequests(): Promise<PartnerRequest[]> {
  const res = await apiFetch<ApiListResponse<PartnerRequest>>("/partnerRequest");
  return res.data?.rows ?? [];
}

export async function approvePartnerRequest(id: number): Promise<void> {
  await apiFetch(`/partnerRequest/${id}/approve`, { method: "POST" });
}

export async function rejectPartnerRequest(id: number): Promise<void> {
  await apiFetch(`/partnerRequest/${id}/reject`, { method: "POST" });
}

/**
 * An admin adds a shopper by phone number themselves — same result as
 * approving a request, so it shows up as "approved".
 */
export async function createPartnerRequest(phone: string): Promise<void> {
  await apiFetch("/partnerRequest", { method: "POST", body: { phone } });
}
