"use client";

import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import DetailHeader from "@/components/layout/DetailHeader";
import { getDoNotes } from "@/lib/api/doNotes";
import { useApi } from "@/lib/useApi";
import { formatDate } from "@/lib/utils";

export default function DeliveryNotesPage() {
  const { data, error, reload } = useApi(getDoNotes);

  return (
    <>
      <DetailHeader
        backHref="/profile"
        title="Хүргэлтийн тэмдэглэл"
        aside={
          data && (
            <span className="shrink-0 font-mono text-sm text-muted-foreground">{data.length}</span>
          )
        }
      />
      <p className="-mx-4 -mt-4 border-b border-border px-4 py-4 text-sm text-muted-foreground">
        Худалдан авагч захиалга хийхдээ сонгох боломжтой хүргэлтийн заавар.
      </p>

      {error && !data ? (
        <div className="pt-4">
          <ErrorState error={error} onRetry={reload} />
        </div>
      ) : !data ? (
        <LoadingState />
      ) : data.length === 0 ? (
        <div className="pt-4">
          <EmptyState title="Тэмдэглэл алга" />
        </div>
      ) : (
        <ul className="divide-y divide-border border-b border-border">
          {data.map((note) => (
            <li key={note.id} className="py-3.5">
              <div className="flex items-baseline justify-between gap-3">
                <p className="min-w-0 text-[15px] font-semibold">{note.name}</p>
                <span className="shrink-0 font-mono text-xs text-muted-foreground">
                  {formatDate(note.createdAt)}
                </span>
              </div>
              {note.description && (
                <p className="mt-0.5 text-sm text-muted-foreground">{note.description}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
