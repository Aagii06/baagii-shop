import { tr } from "@/lib/i18n/translations";
import { endpointMissing } from "./errors";

// "Хамтран ажиллах" requests: a shopper leaves a phone number on the shop's
// /seller page (`POST /auth/register` on eshop-service), and an admin
// approves it here, which turns that user into a shopper.
//
// eshop-admin has no endpoint for any of it yet. Until it does, the reader
// serves mock requests (pages show a "sample data" notice) and the writers
// reject. Swap the bodies for `apiFetch` calls once the backend lands — the
// page won't need to change. Wanted from the backend:
//   GET  /partnerRequest            → { rows: PartnerRequest[], count }
//   POST /partnerRequest/{id}/approve  (creates the shopper role for the user)
//   POST /partnerRequest/{id}/reject

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

export async function getPartnerRequests(): Promise<PartnerRequest[]> {
  return [
    { id: 4, phone: "99112233", status: "pending", createdAt: "2026-10-15T09:12:00" },
    { id: 3, phone: "88114455", status: "pending", createdAt: "2026-10-14T17:40:00" },
    { id: 2, phone: "95067788", status: "approved", createdAt: "2026-10-12T11:05:00" },
    { id: 1, phone: "80019900", status: "rejected", createdAt: "2026-10-09T15:30:00" },
  ];
}

export const approvePartnerRequest: (id: number) => Promise<void> = () =>
  endpointMissing(tr("pr.approveAction"));

export const rejectPartnerRequest: (id: number) => Promise<void> = () =>
  endpointMissing(tr("pr.rejectAction"));
