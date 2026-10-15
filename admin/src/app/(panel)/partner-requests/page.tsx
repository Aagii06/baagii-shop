"use client";

import ChipTabs from "@/components/common/ChipTabs";
import SampleNotice from "@/components/common/SampleNotice";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { useToast } from "@/components/common/Toast";
import DetailHeader from "@/components/layout/DetailHeader";
import { ORDER_TONE } from "@/components/orders/orderTone";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  approvePartnerRequest,
  getPartnerRequests,
  partnerStatusLabel,
  rejectPartnerRequest,
  type PartnerRequestStatus,
} from "@/lib/api/partnerRequests";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useApi } from "@/lib/useApi";
import { cn, formatPhone, formatWhen } from "@/lib/utils";
import { Handshake, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const TABS: PartnerRequestStatus[] = ["pending", "approved", "rejected"];

/** Number colour per status on the summary tiles. */
const STAT_TONE: Record<PartnerRequestStatus, string> = {
  pending: "text-warning",
  approved: "text-success",
  rejected: "text-destructive",
};

function StatTile({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={cn("mt-2 font-mono text-2xl font-bold leading-none", className)}>{value}</p>
    </Card>
  );
}

// Same colours as the orders: waiting = yellow, approved = green, rejected = red.
const TONE: Record<PartnerRequestStatus, (typeof ORDER_TONE)[keyof typeof ORDER_TONE]> = {
  pending: ORDER_TONE.pending,
  approved: ORDER_TONE.delivered,
  rejected: ORDER_TONE.returned,
};

export default function PartnerRequestsPage() {
  const { t } = useLanguage();
  const { data, error, reload } = useApi(getPartnerRequests);
  const { run } = useToast();
  const [status, setStatus] = useState<PartnerRequestStatus>("pending");

  const rows = data?.filter((request) => request.status === status) ?? [];
  const pendingCount = data?.filter((request) => request.status === "pending").length ?? 0;

  async function decide(action: () => Promise<void>, success: string) {
    if (await run(action, success)) reload();
  }

  return (
    <>
      <DetailHeader
        backHref="/profile"
        title={t("pr.title")}
        aside={
          <Button asChild className="h-10 px-4">
            <Link href="/partner-requests/new">
              <Plus />
              {t("common.add")}
            </Link>
          </Button>
        }
      />
      <div className="-mx-4 -mt-4 border-b border-border px-4 py-4">
        <ChipTabs
          label={t("orders.status")}
          value={status}
          onChange={setStatus}
          options={TABS.map((s) => ({
            value: s,
            label: partnerStatusLabel(s),
            count: s === "pending" ? pendingCount : undefined,
            idleClassName: TONE[s].soft,
            activeClassName: TONE[s].solid,
            badgeClassName: "bg-warning text-white",
          }))}
        />
      </div>

      <SampleNotice className="mt-4">{t("pr.sampleNotice")}</SampleNotice>

      {data && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <StatTile label={t("pr.total")} value={data.length} />
          {TABS.map((s) => (
            <StatTile
              key={s}
              label={partnerStatusLabel(s)}
              value={data.filter((request) => request.status === s).length}
              className={STAT_TONE[s]}
            />
          ))}
        </div>
      )}

      {error && !data ? (
        <div className="pt-4">
          <ErrorState error={error} onRetry={reload} />
        </div>
      ) : !data ? (
        <LoadingState />
      ) : rows.length === 0 ? (
        <div className="pt-4">
          <EmptyState
            icon={Handshake}
            title={t("pr.noneInStatus", { status: partnerStatusLabel(status) })}
          />
        </div>
      ) : (
        <ul className="divide-y divide-border border-b border-border">
          {rows.map((request) => (
            <li key={request.id} className="py-4">
              <div className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-sm text-muted-foreground">#{request.id}</span>
                    <span
                      className={cn(
                        "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        TONE[request.status].soft
                      )}
                    >
                      {partnerStatusLabel(request.status)}
                    </span>
                  </span>
                  <span className="mt-1.5 block font-mono text-[15px] font-bold">{formatPhone(request.phone)}</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">{formatWhen(request.createdAt)}</span>
                </span>
              </div>

              {request.status === "pending" && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Button
                    variant="ghost"
                    className={cn("h-10", TONE.approved.solid)}
                    onClick={() => decide(() => approvePartnerRequest(request.id), t("pr.approved"))}
                  >
                    {t("pr.approve")}
                  </Button>
                  <Button
                    variant="danger"
                    className="h-10"
                    onClick={() => decide(() => rejectPartnerRequest(request.id), t("pr.rejected"))}
                  >
                    {t("pr.reject")}
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
