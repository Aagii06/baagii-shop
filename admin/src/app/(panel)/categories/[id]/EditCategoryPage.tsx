"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import CategoryForm from "@/components/categories/CategoryForm";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import DetailHeader from "@/components/layout/DetailHeader";
import { getAttrs } from "@/lib/api/attrs";
import { flattenCategories, getCategoryTree } from "@/lib/api/categories";
import { useApi } from "@/lib/useApi";
import { FolderX } from "lucide-react";
import { useRouteId } from "@/lib/useRouteId";

async function loadForm() {
  const [tree, catalogue] = await Promise.all([getCategoryTree(), getAttrs()]);
  return { categories: flattenCategories(tree), catalogue };
}

export default function EditCategoryPage() {
  const { t } = useLanguage();
  const id = useRouteId("id", 1);
  const { data, error, reload } = useApi(loadForm);
  const categories = data?.categories;
  const category = categories?.find((c) => c.id === Number(id));

  if (data && category) {
    return (
      <CategoryForm key={category.id} category={category} catalogue={data.catalogue} categories={data.categories} />
    );
  }

  return (
    <>
      <DetailHeader backHref="/categories" title={t("cat.edit")} />
      {error && !categories ? (
        <ErrorState error={error} onRetry={reload} />
      ) : !categories ? (
        <LoadingState variant="form" />
      ) : (
        <EmptyState
          icon={FolderX}
          title={t("cat.notFound")}
          description={t("cat.idNotFound", { id })}
        />
      )}
    </>
  );
}
