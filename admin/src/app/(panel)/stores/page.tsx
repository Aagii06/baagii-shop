"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import AttrListSkeleton from "@/components/attrs/AttrListSkeleton";
import { useConfirm } from "@/components/common/Confirm";
import { EmptyState, ErrorState } from "@/components/common/States";
import Thumb from "@/components/common/Thumb";
import { useToast } from "@/components/common/Toast";
import DetailHeader from "@/components/layout/DetailHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deleteStore, getStores, TIER_BADGE, type Store } from "@/lib/api/stores";
import { useApi } from "@/lib/useApi";
import { formatPhone, formatQty } from "@/lib/utils";
import { Pencil, Plus, Store as StoreIcon, Trash2 } from "lucide-react";
import Link from "next/link";

function StoreRow({ store, onChanged }: { store: Store; onChanged: () => void }) {
  const { t } = useLanguage();
  const { run } = useToast();
  const confirm = useConfirm();
  const contact = [store.phone && formatPhone(store.phone), store.email].filter(Boolean).join(" · ");

  async function onDelete() {
    const ok = await confirm({
      title: t("st.deleteTitle"),
      description: t("st.deleteDesc", { name: store.name }),
      confirmLabel: t("common.delete"),
      tone: "danger",
    });
    if (!ok) return;
    if (await run(() => deleteStore(store.id), t("st.deleted"))) onChanged();
  }

  return (
    <li className="flex items-center gap-3 px-4 py-3.5">
      <Thumb id={store.logo} variant="icon" size={48} className="rounded-xl" />
      <span className="min-w-0 grow">
        <span className="flex items-center gap-2">
          <span className="truncate text-[15px] font-bold">{store.name}</span>
          {store.tier && store.tier !== "normal" && (
            <Badge className={`shrink-0 px-2 py-0.5 ${TIER_BADGE[store.tier]}`}>{t(`st.tier.${store.tier}`)}</Badge>
          )}
          <Badge className="shrink-0 px-2 py-0.5 font-mono">
            {formatQty(store.productsCnt ?? 0)}
            <span className="sr-only">{t("st.productsSr")}</span>
          </Badge>
        </span>
        {contact && <span className="mt-0.5 block truncate font-mono text-xs text-muted-foreground">{contact}</span>}
        {store.address && <span className="mt-0.5 block truncate text-xs text-muted-foreground">{store.address}</span>}
      </span>
      <Button asChild variant="outline" size="icon-sm" className="shrink-0">
        <Link href={`/stores/edit?id=${store.id}`} aria-label={t("st.editAria", { name: store.name })} title={t("common.edit")}>
          <Pencil />
        </Link>
      </Button>
      <Button
        variant="danger"
        size="icon-sm"
        className="shrink-0"
        aria-label={t("st.deleteAria", { name: store.name })}
        title={t("common.delete")}
        onClick={onDelete}
      >
        <Trash2 />
      </Button>
    </li>
  );
}

export default function StoresPage() {
  const { t } = useLanguage();
  const { data, error, reload } = useApi(getStores);

  return (
    <>
      <DetailHeader
        backHref="/profile"
        title={t("st.title")}
        aside={
          <Button asChild className="h-10 px-4">
            <Link href="/stores/new">
              <Plus />
              {t("common.add")}
            </Link>
          </Button>
        }
      />

      {error && !data ? (
        <div className="pt-4">
          <ErrorState error={error} onRetry={reload} />
        </div>
      ) : !data ? (
        <AttrListSkeleton />
      ) : data.length === 0 ? (
        <div className="pt-4">
          <EmptyState icon={StoreIcon} title={t("st.empty")} description={t("st.emptyHint")} />
        </div>
      ) : (
        <ul className="-mx-4 divide-y divide-border border-b border-border bg-white">
          {data.map((store) => (
            <StoreRow key={store.id} store={store} onChanged={reload} />
          ))}
        </ul>
      )}
    </>
  );
}
