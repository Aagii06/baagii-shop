import { tr } from "@/lib/i18n/translations";
import { apiFetch, type ApiItemResponse } from "./client";

// "Хамтран ажиллах" requests: a would-be seller leaves their store's details
// and SMS-confirmed phone on the shop's /seller page (`POST /auth/register`
// on ../backend's /web). Approving one here opens that store (`/store`) and
// a shopper user for the phone, signing in with the password given.
//   GET  /partnerRequest?status=&skip=&take= → { rows, count, stats }
//   POST /partnerRequest/{id}/approve   { password }
//   POST /partnerRequest/{id}/reject
//   POST /partnerRequest/{id}/revert    approved → pending (removes the store and its shopper)

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

export type PartnerRequestStats = Record<PartnerRequestStatus, number>;

export interface PartnerRequestsPage {
  rows: PartnerRequest[];
  /** Matching `status` (all requests without one). */
  count: number;
  /** Requests per status, whatever the filter. */
  stats: PartnerRequestStats;
}

/** One page, newest first; `status` narrows to one state. */
export async function getPartnerRequestsPage({
  skip,
  take,
  status,
}: {
  skip: number;
  take: number;
  status?: PartnerRequestStatus;
}): Promise<PartnerRequestsPage> {
  const params = new URLSearchParams({ skip: String(skip), take: String(take) });
  if (status) params.set("status", status);
  const res = await apiFetch<ApiItemResponse<PartnerRequestsPage>>(`/partnerRequest?${params}`);
  return {
    rows: res.data?.rows ?? [],
    count: res.data?.count ?? 0,
    stats: res.data?.stats ?? { pending: 0, approved: 0, rejected: 0 },
  };
}

/** `password` is what the new shopper signs in to the admin with. */
export async function approvePartnerRequest(id: number, password: string): Promise<void> {
  await apiFetch(`/partnerRequest/${id}/approve`, { method: "POST", body: { password } });
}

/** Undoes an approval; refused while the store still has products. */
export async function revertPartnerRequest(id: number): Promise<void> {
  await apiFetch(`/partnerRequest/${id}/revert`, { method: "POST" });
}

export async function rejectPartnerRequest(id: number): Promise<void> {
  await apiFetch(`/partnerRequest/${id}/reject`, { method: "POST" });
}
