"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import AttrForm from "@/components/attrs/AttrForm";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import DetailHeader from "@/components/layout/DetailHeader";
import { getAttr } from "@/lib/api/attrs";
import { useApi } from "@/lib/useApi";
import { SearchX } from "lucide-react";
import { useParams } from "next/navigation";

export default function EditAttrPage() {
  const { t } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const { data, error, loading, reload } = useApi(() => getAttr(Number(id)), id);

  if (data) return <AttrForm key={data.id} attr={data} />;

  return (
    <>
      <DetailHeader backHref="/attrs" title={t("attrs.edit")} />
      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : loading ? (
        <LoadingState />
      ) : (
        <EmptyState
          icon={SearchX}
          title={t("attrs.notFound")}
          description={t("attrs.idNotFound", { id })}
        />
      )}
    </>
  );
}
