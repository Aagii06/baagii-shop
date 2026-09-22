"use client";

import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { useConfirm } from "@/components/common/Confirm";
import { useToast } from "@/components/common/Toast";
import DetailHeader from "@/components/layout/DetailHeader";
import { Swatch } from "@/components/products/AttrPickers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deleteAttr, getAttrRecords, sortedValues, type AttrRecord } from "@/lib/api/attrs";
import { useApi } from "@/lib/useApi";
import { formatQty } from "@/lib/utils";
import { Pencil, Plus, SlidersHorizontal, Trash2 } from "lucide-react";
import Link from "next/link";

function AttrRow({ attr, onChanged }: { attr: AttrRecord; onChanged: () => void }) {
  const { run } = useToast();
  const confirm = useConfirm();
  // The count is the backend's; names and swatches are the values it sent.
  const values = sortedValues(attr);
  const count = attr.valuesCnt ?? values.length;
  const preview = values.slice(0, 4).map((v) => v.name).join(", ") + (values.length > 4 ? "…" : "");

  async function onDelete() {
    const ok = await confirm({
      title: "Үзүүлэлт устгах уу?",
      description: `“${attr.name}” үзүүлэлтийг устгана. Буцаах боломжгүй.`,
      confirmLabel: "Устгах",
      tone: "danger",
    });
    if (!ok) return;
    if (await run(() => deleteAttr(attr.id), "Үзүүлэлтийг устгалаа")) onChanged();
  }

  return (
    <li className="flex items-center gap-2 py-3.5">
      <span className="min-w-0 grow">
        <span className="flex items-center gap-2">
          <span className="truncate text-[15px] font-bold">{attr.name}</span>
          <Badge className="shrink-0 px-2 py-0.5 font-mono">
            {formatQty(count)}
            <span className="sr-only"> утга</span>
          </Badge>
        </span>
        {preview && (
          <span className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            {values.some((v) => v.color) && (
              <span className="flex shrink-0 -space-x-1">
                {values.slice(0, 5).map((v, i) => (
                  <Swatch key={v.id ?? i} color={v.color} className="size-3.5" />
                ))}
              </span>
            )}
            <span className="truncate">{preview}</span>
          </span>
        )}
      </span>
      <Button asChild variant="outline" size="icon-sm" className="shrink-0">
        <Link href={`/attrs/${attr.id}`} aria-label={`“${attr.name}” засах`} title="Засах">
          <Pencil />
        </Link>
      </Button>
      <Button
        variant="danger"
        size="icon-sm"
        className="shrink-0"
        aria-label={`“${attr.name}” устгах`}
        title="Устгах"
        onClick={onDelete}
      >
        <Trash2 />
      </Button>
    </li>
  );
}

export default function AttrsPage() {
  const { data, error, reload } = useApi(getAttrRecords);

  return (
    <>
      <DetailHeader
        backHref="/profile"
        title="Үзүүлэлт"
        aside={
          <Button asChild className="h-10 px-4">
            <Link href="/attrs/new">
              <Plus />
              Нэмэх
            </Link>
          </Button>
        }
      />

      {error && !data ? (
        <div className="pt-4">
          <ErrorState error={error} onRetry={reload} />
        </div>
      ) : !data ? (
        <LoadingState />
      ) : data.length === 0 ? (
        <div className="pt-4">
          <EmptyState
            icon={SlidersHorizontal}
            title="Үзүүлэлт алга"
            description="“Нэмэх” товчоор өнгө, хэмжээ зэрэг үзүүлэлт нэмнэ үү."
          />
        </div>
      ) : (
        <ul className="divide-y divide-border border-b border-border">
          {data.map((attr) => (
            <AttrRow key={attr.id} attr={attr} onChanged={reload} />
          ))}
        </ul>
      )}
    </>
  );
}
