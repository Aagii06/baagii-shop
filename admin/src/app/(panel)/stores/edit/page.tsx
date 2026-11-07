"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import DetailHeader from "@/components/layout/DetailHeader";
import StoreForm from "@/components/stores/StoreForm";
import { getStore } from "@/lib/api/stores";
import { useApi } from "@/lib/useApi";
import { SearchX } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// `/stores/edit?id=5` — a query string rather than `/stores/[id]`, so the
// static export needs no extra nginx route.
function EditStore() {
  const { t } = useLanguage();
  const id = useSearchParams().get("id") ?? "";
  const { data, error, loading, reload } = useApi(() => getStore(Number(id)), id);

  if (data) return <StoreForm key={data.id} store={data} />;

  return (
    <>
      <DetailHeader backHref="/stores" title={t("st.edit")} />
      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : loading ? (
        <LoadingState variant="form" />
      ) : (
        <EmptyState icon={SearchX} title={t("st.notFound")} />
      )}
    </>
  );
}

export default function EditStorePage() {
  return (
    <Suspense fallback={<LoadingState variant="form" />}>
      <EditStore />
    </Suspense>
  );
}
