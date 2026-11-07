"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import DetailHeader from "@/components/layout/DetailHeader";
import UserForm from "@/components/users/UserForm";
import { getUser } from "@/lib/api/users";
import { useApi } from "@/lib/useApi";
import { SearchX } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// `/users/edit?id=5` — a query string, so the static export needs no extra nginx route.
function EditUser() {
  const { t } = useLanguage();
  const id = useSearchParams().get("id") ?? "";
  const { data, error, loading, reload } = useApi(() => getUser(Number(id)), id);

  if (data) return <UserForm key={data.id} user={data} />;

  return (
    <>
      <DetailHeader backHref="/users" title={t("us.edit")} />
      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : loading ? (
        <LoadingState variant="form" />
      ) : (
        <EmptyState icon={SearchX} title={t("us.notFound")} />
      )}
    </>
  );
}

export default function EditUserPage() {
  return (
    <Suspense fallback={<LoadingState variant="form" />}>
      <EditUser />
    </Suspense>
  );
}
