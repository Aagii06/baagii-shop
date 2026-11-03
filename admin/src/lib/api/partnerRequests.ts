import { tr } from "@/lib/i18n/translations";
import { apiFetch, type ApiListResponse } from "./client";

// "Хамтран ажиллах" requests: a would-be seller leaves their store's details
// and SMS-confirmed phone on the shop's /seller page (`POST /auth/register`
// on ../backend's /web). Approving one here opens that store (`/store`) and
// a shopper user for the phone, signing in with the password given.
//   GET  /partnerRequest                → { rows: PartnerRequest[], count }
//   POST /partnerRequest/{id}/approve   { password }
//   POST /partnerRequest/{id}/reject

export type PartnerRequestStatus = "pending" | "approved" | "rejected";

export interface PartnerRequest {
  id: number;
  /** Phone number the shopper signed up with (the new user's `userName`). */
  phone: string;
  /** Absent on requests sent before the form asked for them. */
  storeName: string | null;
  /** The applicant's own name. */
  name: string | null;
  email: string | null;
  address: string | null;
  status: PartnerRequestStatus;
  /** The store approving it opened. */
  storeId: number | null;
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

/** `password` is what the new shopper signs in to the admin with. */
export async function approvePartnerRequest(id: number, password: string): Promise<void> {
  await apiFetch(`/partnerRequest/${id}/approve`, { method: "POST", body: { password } });
}

export async function rejectPartnerRequest(id: number): Promise<void> {
  await apiFetch(`/partnerRequest/${id}/reject`, { method: "POST" });
}
