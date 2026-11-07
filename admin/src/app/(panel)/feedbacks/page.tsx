"use client";

import ChipTabs from "@/components/common/ChipTabs";
import { useConfirm } from "@/components/common/Confirm";
import { EmptyState, ErrorState } from "@/components/common/States";
import { useToast } from "@/components/common/Toast";
import DetailHeader from "@/components/layout/DetailHeader";
import { ORDER_TONE } from "@/components/orders/orderTone";
import { Button } from "@/components/ui/button";
import {
  deleteFeedback,
  feedbackStatusLabel,
  getFeedbacks,
  markFeedbackRead,
  markFeedbackUnread,
  type Feedback,
  type FeedbackStatus,
} from "@/lib/api/feedbacks";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useApi } from "@/lib/useApi";
import { cn, formatPhone, formatWhen } from "@/lib/utils";
import { Check, Mail, MessageSquareText, Phone, Reply, Trash2, Undo2 } from "lucide-react";
import { useState } from "react";

const TABS: FeedbackStatus[] = ["new", "read"];

// New = yellow like a waiting order, read = green.
const TONE: Record<FeedbackStatus, (typeof ORDER_TONE)[keyof typeof ORDER_TONE]> = {
  new: ORDER_TONE.pending,
  read: ORDER_TONE.delivered,
};

/** Placeholder rows shaped like the list, shown while it loads. */
function FeedbacksSkeleton() {
  const bar = "block rounded-md bg-muted";
  return (
    <ul aria-hidden className="animate-pulse divide-y divide-border border-b border-border">
      {Array.from({ length: 4 }, (_, i) => (
        <li key={i} className="py-4">
          <span className="flex items-center gap-2">
            <span className={`${bar} h-4 w-10`} />
            <span className="block h-5 w-16 rounded-full bg-muted" />
          </span>
          <span className={`${bar} mt-2 h-4 w-2/5`} />
          <span className={`${bar} mt-1.5 h-4 w-3/5`} />
          <span className="mt-2 block h-16 rounded-xl bg-muted" />
          <div className="mt-3 flex gap-2">
            <span className="block h-10 grow rounded-lg bg-muted" />
            <span className="block h-10 grow rounded-lg bg-muted" />
            <span className="block size-10 rounded-lg bg-muted" />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** One message: who sent it, its subject and full text, and what to do with it. */
function FeedbackRow({ feedback, onChanged }: { feedback: Feedback; onChanged: () => void }) {
  const { t } = useLanguage();
  const { run } = useToast();
  const confirm = useConfirm();
  const isNew = feedback.status === "new";

  const [toggling, setToggling] = useState(false);
  async function onToggleRead() {
    const action = isNew ? () => markFeedbackRead(feedback.id) : () => markFeedbackUnread(feedback.id);
    setToggling(true);
    try {
      if (await run(action, isNew ? t("fb.markedRead") : t("fb.markedUnread"))) onChanged();
    } finally {
      setToggling(false);
    }
  }

  const [deleting, setDeleting] = useState(false);
  async function onDelete() {
    const ok = await confirm({
      title: t("fb.deleteTitle"),
      description: t("fb.deleteDesc", { name: feedback.name }),
      confirmLabel: t("common.delete"),
      tone: "danger",
    });
    if (!ok) return;
    setDeleting(true);
    try {
      if (await run(() => deleteFeedback(feedback.id), t("fb.deleted"))) onChanged();
    } finally {
      setDeleting(false);
    }
  }

  // Answering by mail also marks it read.
  function onReply() {
    if (isNew) void markFeedbackRead(feedback.id).then(onChanged, () => {});
  }

  const replyHref = feedback.subject
    ? `mailto:${feedback.email}?subject=${encodeURIComponent(`Re: ${feedback.subject}`)}`
    : `mailto:${feedback.email}`;

  return (
    <li className="py-4">
      <span className="flex items-center gap-2">
        <span className="font-mono text-sm text-muted-foreground">#{feedback.id}</span>
        <span
          className={cn(
            "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold",
            TONE[feedback.status].soft
          )}
        >
          {feedbackStatusLabel(feedback.status)}
        </span>
        <span className="ml-auto text-xs text-muted-foreground">{formatWhen(feedback.createdAt)}</span>
      </span>
      {feedback.subject && (
        <span className={cn("mt-1.5 block text-[15px]", isNew ? "font-bold" : "font-semibold")}>
          {feedback.subject}
        </span>
      )}
      <span
        className={cn(
          "flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground",
          feedback.subject ? "mt-0.5" : "mt-1.5"
        )}
      >
        <span
          className={cn(
            "truncate text-foreground",
            feedback.subject ? "font-medium" : cn("text-[15px]", isNew ? "font-bold" : "font-semibold")
          )}
        >
          {feedback.name}
        </span>
        <span aria-hidden>·</span>
        <a href={`mailto:${feedback.email}`} className="inline-flex min-w-0 items-center gap-1 hover:underline">
          <Mail className="size-3.5 shrink-0" />
          <span className="truncate">{feedback.email}</span>
        </a>
      </span>
      {feedback.phone && (
        <a
          href={`tel:${feedback.phone}`}
          className="mt-0.5 inline-flex items-center gap-1 font-mono text-sm text-muted-foreground hover:underline"
        >
          <Phone className="size-3.5 shrink-0" />
          {formatPhone(feedback.phone)}
        </a>
      )}
      <p className="mt-2 whitespace-pre-wrap break-words rounded-xl bg-muted/60 px-3 py-2.5 text-sm leading-relaxed">
        {feedback.message}
      </p>

      <div className="mt-3 flex gap-2">
        <Button asChild variant="outline" className="h-10 grow">
          <a href={replyHref} onClick={onReply}>
            <Reply />
            {t("fb.reply")}
          </a>
        </Button>
        <Button variant="outline" className="h-10 grow" loading={toggling} onClick={onToggleRead}>
          {isNew ? <Check /> : <Undo2 />}
          {isNew ? t("fb.markRead") : t("fb.markUnread")}
        </Button>
        <Button
          variant="danger"
          size="icon"
          className="size-10 shrink-0"
          aria-label={t("fb.deleteAria", { name: feedback.name })}
          title={t("common.delete")}
          loading={deleting} onClick={onDelete}
        >
          <Trash2 />
        </Button>
      </div>
    </li>
  );
}

export default function FeedbacksPage() {
  const { t } = useLanguage();
  const { data, error, reload } = useApi(getFeedbacks);
  const [status, setStatus] = useState<FeedbackStatus | "all">("all");

  const rows = data?.filter((feedback) => status === "all" || feedback.status === status) ?? [];
  const newCount = data?.filter((feedback) => feedback.status === "new").length ?? 0;

  return (
    <>
      <DetailHeader backHref="/profile" title={t("fb.title")} />
      <div className="-mx-4 -mt-4 border-b border-border px-4 py-4">
        <ChipTabs
          label={t("orders.status")}
          value={status}
          onChange={setStatus}
          options={[
            { value: "all" as const, label: t("common.all") },
            ...TABS.map((s) => ({
              value: s,
              label: feedbackStatusLabel(s),
              count: s === "new" ? newCount : undefined,
              idleClassName: TONE[s].soft,
              activeClassName: TONE[s].solid,
              badgeClassName: "bg-warning text-white",
            })),
          ]}
        />
      </div>

      {error && !data ? (
        <div className="pt-4">
          <ErrorState error={error} onRetry={reload} />
        </div>
      ) : !data ? (
        <FeedbacksSkeleton />
      ) : rows.length === 0 ? (
        <div className="pt-4">
          <EmptyState
            icon={MessageSquareText}
            title={status === "all" ? t("fb.empty") : t("fb.noneInStatus", { status: feedbackStatusLabel(status) })}
          />
        </div>
      ) : (
        <ul className="divide-y divide-border border-b border-border">
          {rows.map((feedback) => (
            <FeedbackRow key={feedback.id} feedback={feedback} onChanged={reload} />
          ))}
        </ul>
      )}
    </>
  );
}
