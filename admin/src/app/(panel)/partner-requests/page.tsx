"use client";

import ChipTabs from "@/components/common/ChipTabs";
import { useConfirm } from "@/components/common/Confirm";
import { EmptyState, ErrorState } from "@/components/common/States";
import { useToast } from "@/components/common/Toast";
import DetailHeader from "@/components/layout/DetailHeader";
import { ORDER_TONE } from "@/components/orders/orderTone";
import PartnerRequestsSkeleton from "@/components/partners/PartnerRequestsSkeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Field from "@/components/common/Field";
import { Input } from "@/components/ui/input";
import {
  approvePartnerRequest,
  getPartnerRequests,
  partnerStatusLabel,
  rejectPartnerRequest,
  revertPartnerRequest,
  type PartnerRequest,
  type PartnerRequestStatus,
} from "@/lib/api/partnerRequests";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useApi } from "@/lib/useApi";
import { cn, formatPhone, formatWhen } from "@/lib/utils";
import { Handshake } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";

const TABS: PartnerRequestStatus[] = ["pending", "approved", "rejected"];

/** Dot colour per status on the summary strip. */
const STAT_DOT: Record<PartnerRequestStatus, string> = {
  pending: "bg-warning",
  approved: "bg-success",
  rejected: "bg-destructive",
};

/** One cell of the summary strip: a small count over its label. */
function Stat({ label, value, dot }: { label: string; value: number; dot?: string }) {
  return (
    <div className="min-w-0 px-2 py-2.5 text-center">
      <p className="font-mono text-lg font-bold leading-none">{value}</p>
      <p className="mt-1.5 flex items-center justify-center gap-1 truncate text-[11px] font-medium text-muted-foreground">
        <span className={cn("size-1.5 shrink-0 rounded-full", dot ?? "bg-foreground/40")} aria-hidden />
        <span className="truncate">{label}</span>
      </p>
    </div>
  );
}

// Same colours as the orders: waiting = yellow, approved = green, rejected = red.
const TONE: Record<PartnerRequestStatus, (typeof ORDER_TONE)[keyof typeof ORDER_TONE]> = {
  pending: ORDER_TONE.pending,
  approved: ORDER_TONE.delivered,
  rejected: ORDER_TONE.returned,
};

const MIN_PASSWORD = 6;

/**
 * One request with the store details it came with. Approving asks for the
 * new shopper's password first — it opens the store and their account.
 */
function RequestRow({
  request,
  onApprove,
  onReject,
  onRevert,
}: {
  request: PartnerRequest;
  onApprove: (password: string) => Promise<boolean>;
  onReject: () => void;
  onRevert: () => void;
}) {
  const { t } = useLanguage();
  const passwordErrorId = useId();
  const [approving, setApproving] = useState(false);
  const [password, setPassword] = useState("");
  const [tried, setTried] = useState(false);
  const passwordError =
    tried && password.length < MIN_PASSWORD ? t("pr.passwordShort", { min: MIN_PASSWORD }) : undefined;

  async function onConfirm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTried(true);
    if (password.length < MIN_PASSWORD) return;
    if (await onApprove(password)) setApproving(false);
  }

  const contact = [request.name, request.email].filter(Boolean).join(" · ");

  return (
    <li className="py-4">
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
      {request.storeName && <span className="mt-1.5 block text-[15px] font-bold">{request.storeName}</span>}
      <span className="mt-0.5 block font-mono text-sm font-semibold">{formatPhone(request.phone)}</span>
      {contact && <span className="mt-0.5 block text-sm text-muted-foreground">{contact}</span>}
      {request.address && <span className="mt-0.5 block text-sm text-muted-foreground">{request.address}</span>}
      <span className="mt-0.5 block text-xs text-muted-foreground">{formatWhen(request.createdAt)}</span>
      {request.storeId && (
        <Link
          href={`/stores/edit?id=${request.storeId}`}
          className="mt-1 inline-block text-sm font-semibold text-primary-ink underline-offset-4 hover:underline"
        >
          {t("pr.openStore")}
        </Link>
      )}

      {request.status === "pending" &&
        (approving ? (
          <form onSubmit={onConfirm} noValidate className="mt-3 space-y-3">
            <Field label={t("pr.password")} hint={t("pr.passwordHint")} error={passwordError} errorId={passwordErrorId}>
              <Input
                type="password"
                autoComplete="new-password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={Boolean(passwordError)}
                aria-describedby={passwordError ? passwordErrorId : undefined}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Button type="button" variant="outline" className="h-10" onClick={() => setApproving(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" variant="ghost" className={cn("h-10", TONE.approved.solid)}>
                {t("pr.approve")}
              </Button>
            </div>
          </form>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Button variant="ghost" className={cn("h-10", TONE.approved.solid)} onClick={() => setApproving(true)}>
              {t("pr.approve")}
            </Button>
            <Button variant="danger" className="h-10" onClick={onReject}>
              {t("pr.reject")}
            </Button>
          </div>
        ))}

      {request.status === "approved" && (
        <Button variant="outline" className="mt-3 h-10 w-full" onClick={onRevert}>
          {t("pr.revert")}
        </Button>
      )}
    </li>
  );
}

export default function PartnerRequestsPage() {
  const { t } = useLanguage();
  const { data, error, reload } = useApi(getPartnerRequests);
  const { run } = useToast();
  const confirm = useConfirm();
  const [status, setStatus] = useState<PartnerRequestStatus | "all">("all");

  const rows = data?.filter((request) => status === "all" || request.status === status) ?? [];
  const pendingCount = data?.filter((request) => request.status === "pending").length ?? 0;

  async function decide(action: () => Promise<void>, success: string) {
    const done = await run(action, success);
    if (done) reload();
    return Boolean(done);
  }

  async function revert(request: PartnerRequest) {
    const ok = await confirm({
      title: t("pr.revertTitle", { id: request.id }),
      description: t("pr.revertDesc"),
      confirmLabel: t("pr.revert"),
      tone: "danger",
    });
    if (ok) decide(() => revertPartnerRequest(request.id), t("pr.reverted"));
  }

  return (
    <>
      <DetailHeader backHref="/profile" title={t("pr.title")} />
      <div className="-mx-4 -mt-4 border-b border-border px-4 py-4">
        <ChipTabs
          label={t("orders.status")}
          value={status}
          onChange={setStatus}
          options={[
            { value: "all" as const, label: t("common.all") },
            ...TABS.map((s) => ({
              value: s,
              label: partnerStatusLabel(s),
              count: s === "pending" ? pendingCount : undefined,
              idleClassName: TONE[s].soft,
              activeClassName: TONE[s].solid,
              badgeClassName: "bg-warning text-white",
            })),
          ]}
        />
      </div>

      {data && (
        <Card className="mt-4 grid grid-cols-4 divide-x divide-border p-0">
          <Stat label={t("pr.total")} value={data.length} />
          {TABS.map((s) => (
            <Stat
              key={s}
              label={partnerStatusLabel(s)}
              value={data.filter((request) => request.status === s).length}
              dot={STAT_DOT[s]}
            />
          ))}
        </Card>
      )}

      {error && !data ? (
        <div className="pt-4">
          <ErrorState error={error} onRetry={reload} />
        </div>
      ) : !data ? (
        <PartnerRequestsSkeleton />
      ) : rows.length === 0 ? (
        <div className="pt-4">
          <EmptyState
            icon={Handshake}
            title={
              status === "all"
                ? t("pr.empty")
                : t("pr.noneInStatus", { status: partnerStatusLabel(status) })
            }
          />
        </div>
      ) : (
        <ul className="divide-y divide-border border-b border-border">
          {rows.map((request) => (
            <RequestRow
              key={request.id}
              request={request}
              onApprove={(password) => decide(() => approvePartnerRequest(request.id, password), t("pr.approved"))}
              onReject={() => decide(() => rejectPartnerRequest(request.id), t("pr.rejected"))}
              onRevert={() => revert(request)}
            />
          ))}
        </ul>
      )}
    </>
  );
}
