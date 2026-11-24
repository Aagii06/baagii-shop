"use client";

import { atLeast, LOAD_MORE_MARGIN } from "@/components/common/LoadMore";
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
  getPartnerRequestsPage,
  partnerStatusLabel,
  rejectPartnerRequest,
  revertPartnerRequest,
  type PartnerRequest,
  type PartnerRequestsPage,
  type PartnerRequestStatus,
} from "@/lib/api/partnerRequests";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { cn, formatPhone, formatWhen } from "@/lib/utils";
import { Handshake, Loader2, Undo2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

const TABS: PartnerRequestStatus[] = ["pending", "approved", "rejected"];
const PAGE_SIZE = 20;

type Page = PartnerRequestsPage & { key: string; error?: Error };

/** Dot colour per status on the summary strip. */
const STAT_DOT: Record<PartnerRequestStatus, string> = {
  pending: "bg-warning",
  approved: "bg-success",
  rejected: "bg-destructive",
};

/** One cell of the summary strip: a small count over its label. */
/**
 * One count on the summary strip; it is also the status filter — tap to pick
 * or unpick (several at once). A picked one takes its status's colour.
 */
function Stat({
  label,
  value,
  dot,
  checked,
  activeClassName,
  onClick,
}: {
  label: string;
  value: number;
  dot?: string;
  checked: boolean;
  /** Background and text while picked (the status's soft colour). */
  activeClassName?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={onClick}
      className={cn(
        "relative min-w-0 px-2 py-2.5 text-center transition-colors",
        checked ? (activeClassName ?? "bg-primary/10 text-primary-ink") : "hover:bg-muted/60"
      )}
    >
      <span className="block font-mono text-lg font-bold leading-none">{value}</span>
      <span
        className={cn(
          "mt-1.5 flex items-center justify-center gap-1 truncate text-[11px] font-medium",
          checked ? "text-current" : "text-muted-foreground"
        )}
      >
        <span className={cn("size-1.5 shrink-0 rounded-full", dot ?? "bg-foreground/40")} aria-hidden />
        <span className="truncate">{label}</span>
      </span>
    </button>
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
 * store's name (the one sent with the request, editable) and the new
 * shopper's password first — it opens the store and their account.
 */
type Decision = "approve" | "reject" | "revert";

function RequestRow({
  request,
  onApprove,
  onReject,
  onRevert,
  busy,
}: {
  request: PartnerRequest;
  onApprove: (storeName: string, password: string) => Promise<boolean>;
  onReject: () => void;
  onRevert: () => void;
  /** This request's decision in flight — its button spins, the others lock. */
  busy?: Decision | null;
}) {
  const { t } = useLanguage();
  const passwordErrorId = useId();
  const storeNameErrorId = useId();
  const [approving, setApproving] = useState(false);
  const [storeName, setStoreName] = useState(request.storeName ?? "");
  const [password, setPassword] = useState("");
  const [tried, setTried] = useState(false);
  const storeNameError = tried && !storeName.trim() ? t("pr.storeNameRequired") : undefined;
  const passwordError =
    tried && password.length < MIN_PASSWORD ? t("pr.passwordShort", { min: MIN_PASSWORD }) : undefined;

  async function onConfirm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTried(true);
    if (!storeName.trim() || password.length < MIN_PASSWORD) return;
    if (await onApprove(storeName.trim(), password)) setApproving(false);
  }

  const contact = [request.name, request.email].filter(Boolean).join(" · ");

  return (
    <li
      className={cn(
        "relative px-4 py-4",
        // Room for the undo button, centred on the right.
        request.status !== "pending" && "pr-16"
      )}
    >
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
        {request.status !== "pending" && (
          <button
            type="button"
            onClick={onRevert}
            disabled={Boolean(busy)}
            aria-busy={busy === "revert" || undefined}
            aria-label={t("pr.revert")}
            title={t("pr.revert")}
            className="absolute right-4 top-1/2 grid size-9 -translate-y-1/2 shrink-0 place-items-center rounded-full bg-destructive/30 text-destructive transition-colors hover:bg-destructive/40"
          >
            {busy === "revert" ? <Loader2 className="size-4 animate-spin" /> : <Undo2 className="size-4" />}
          </button>
        )}
      </span>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-sm">
        <dt className="text-muted-foreground">{t("pr.store")}</dt>
        <dd className="min-w-0 truncate text-[15px] font-bold">{request.storeName || "—"}</dd>
        <dt className="text-muted-foreground">{t("pr.phone")}</dt>
        <dd className="font-mono font-semibold">{formatPhone(request.phone)}</dd>
      </dl>
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
            <Field label={t("pr.storeName")} error={storeNameError} errorId={storeNameErrorId}>
              <Input
                autoFocus
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                aria-invalid={Boolean(storeNameError)}
                aria-describedby={storeNameError ? storeNameErrorId : undefined}
              />
            </Field>
            <Field label={t("pr.password")} hint={t("pr.passwordHint")} error={passwordError} errorId={passwordErrorId}>
              <Input
                type="password"
                autoComplete="new-password"
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
              <Button type="submit" variant="ghost" className={cn("h-10", TONE.approved.solid)} loading={busy === "approve"}>
                {t("pr.approve")}
              </Button>
            </div>
          </form>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Button variant="ghost" className={cn("h-10", TONE.approved.solid)} onClick={() => setApproving(true)}>
              {t("pr.approve")}
            </Button>
            <Button variant="danger" className="h-10" loading={busy === "reject"} disabled={Boolean(busy)} onClick={onReject}>
              {t("pr.reject")}
            </Button>
          </div>
        ))}
    </li>
  );
}

export default function PartnerRequestsPage() {
  const { t } = useLanguage();
  const { run } = useToast();
  const confirm = useConfirm();
  // Several statuses can be picked at once; none picked is "all".
  const [statuses, setStatuses] = useState<PartnerRequestStatus[]>([]);
  const toggleStatus = (value: PartnerRequestStatus | "all") => {
    if (value === "all") return setStatuses([]);
    setStatuses((prev) => {
      const next = prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value];
      // Every status ticked is the same as "all".
      return next.length === TABS.length ? [] : TABS.filter((s) => next.includes(s));
    });
  };

  // Pages load as the list is scrolled. `key` ties the loaded rows to the
  // filter they were fetched for, so a stale page counts as "loading".
  const filter = useMemo(() => (statuses.length > 0 ? statuses : undefined), [statuses]);
  const key = statuses.join(",") || "all";
  const [page, setPage] = useState<Page | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreFailed, setMoreFailed] = useState(false);
  const [version, setVersion] = useState(0);
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    getPartnerRequestsPage({ skip: 0, take: PAGE_SIZE, status: filter }).then(
      (result) => {
        if (cancelled) return;
        setMoreFailed(false);
        setPage({ key, ...result });
      },
      (error: unknown) => {
        if (cancelled) return;
        setPage((prev) => ({
          key,
          rows: [],
          count: 0,
          stats: prev?.stats ?? { pending: 0, approved: 0, rejected: 0 },
          error: error instanceof Error ? error : new Error(String(error)),
        }));
      }
    );
    return () => {
      cancelled = true;
    };
  }, [key, version, filter]);

  const ready = page?.key === key;
  const rows = ready ? page.rows : [];
  const hasMore = ready && !page.error && page.rows.length < page.count;
  const reload = () => setVersion((v) => v + 1);

  const loadMore = useCallback(async () => {
    if (!page || page.key !== key || loadingMore || page.rows.length >= page.count) return;
    setLoadingMore(true);
    setMoreFailed(false);
    try {
      const result = await atLeast(getPartnerRequestsPage({ skip: page.rows.length, take: PAGE_SIZE, status: filter }));
      setPage((prev) =>
        prev && prev.key === key
          ? {
              ...prev,
              count: result.count,
              stats: result.stats,
              rows: [...prev.rows, ...result.rows.filter((r) => !prev.rows.some((o) => o.id === r.id))],
            }
          : prev
      );
    } catch {
      setMoreFailed(true);
    } finally {
      setLoadingMore(false);
    }
  }, [page, key, loadingMore, filter]);

  // Loads the next page once the bottom of the list nears the screen. A
  // failed page stops the loop; "try again" retries it.
  useEffect(() => {
    const node = sentinel.current;
    if (!node || !hasMore || moreFailed) return;
    const observer = new IntersectionObserver((entries) => entries[0]?.isIntersecting && loadMore(), {
      rootMargin: LOAD_MORE_MARGIN,
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, moreFailed, loadMore]);

  // The decision in flight: which request, and which button spins.
  const [busy, setBusy] = useState<{ id: number; kind: Decision } | null>(null);

  async function decide(id: number, kind: Decision, action: () => Promise<void>, success: string) {
    setBusy({ id, kind });
    try {
      const done = await run(action, success);
      if (done) reload();
      return Boolean(done);
    } finally {
      setBusy(null);
    }
  }

  async function approve(request: PartnerRequest, storeName: string, password: string) {
    const ok = await confirm({
      title: t("pr.approveTitle", { id: request.id }),
      description: t("pr.approveDesc", { phone: formatPhone(request.phone) }),
      confirmLabel: t("pr.approve"),
    });
    return ok ? decide(request.id, "approve", () => approvePartnerRequest(request.id, password, storeName), t("pr.approved")) : false;
  }

  async function reject(request: PartnerRequest) {
    const ok = await confirm({
      title: t("pr.rejectTitle", { id: request.id }),
      description: t("pr.rejectDesc"),
      confirmLabel: t("pr.reject"),
      tone: "danger",
    });
    if (ok) decide(request.id, "reject", () => rejectPartnerRequest(request.id), t("pr.rejected"));
  }

  async function revert(request: PartnerRequest) {
    const ok = await confirm({
      title: t("pr.revertTitle", { id: request.id }),
      description: request.status === "approved" ? t("pr.revertDesc") : t("pr.revertRejectedDesc"),
      confirmLabel: t("pr.revert"),
      tone: "danger",
    });
    if (ok) decide(request.id, "revert", () => revertPartnerRequest(request.id), t("pr.reverted"));
  }

  const stats = page?.stats;
  const total = stats ? TABS.reduce((sum, s) => sum + stats[s], 0) : 0;

  return (
    <>
      <DetailHeader backHref="/profile" title={t("pr.title")} />
      {/* The counts are the status filter: tick several; none ticked shows all. */}
      {stats && (
        <Card role="group" aria-label={t("orders.status")} className="grid grid-cols-4 divide-x divide-border overflow-hidden p-0">
          <Stat label={t("pr.total")} value={total} checked={statuses.length === 0} onClick={() => toggleStatus("all")} />
          {TABS.map((s) => (
            <Stat
              key={s}
              label={partnerStatusLabel(s)}
              value={stats[s]}
              dot={STAT_DOT[s]}
              checked={statuses.includes(s)}
              activeClassName={TONE[s].soft}
              onClick={() => toggleStatus(s)}
            />
          ))}
        </Card>
      )}

      {!ready ? (
        <PartnerRequestsSkeleton stats={!stats} />
      ) : page.error ? (
        <div className="pt-4">
          <ErrorState error={page.error} onRetry={reload} />
        </div>
      ) : rows.length === 0 ? (
        <div className="pt-4">
          <EmptyState
            icon={Handshake}
            title={
              statuses.length === 0
                ? t("pr.empty")
                : t("pr.noneInStatus", { status: statuses.map(partnerStatusLabel).join(", ") })
            }
          />
        </div>
      ) : (
        <>
          <ul className="-mx-4 mt-4 divide-y divide-border border-y border-border bg-white">
            {rows.map((request) => (
              <RequestRow
                key={request.id}
                request={request}
                onApprove={(storeName, password) => approve(request, storeName, password)}
                onReject={() => reject(request)}
                onRevert={() => revert(request)}
                busy={busy?.id === request.id ? busy.kind : null}
              />
            ))}
          </ul>

          {hasMore && (
            <div ref={sentinel}>
              {moreFailed ? (
                <Button variant="outline" className="mt-4 w-full" loading={loadingMore} onClick={loadMore}>
                  {t("common.retry")}
                </Button>
              ) : (
                <PartnerRequestsSkeleton rows={2} stats={false} />
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}
