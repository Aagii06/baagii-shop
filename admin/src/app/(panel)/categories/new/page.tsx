"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import CategoryForm from "@/components/categories/CategoryForm";
import { ErrorState, LoadingState } from "@/components/common/States";
import DetailHeader from "@/components/layout/DetailHeader";
import { getAttrs } from "@/lib/api/attrs";
import { canNestUnder, flattenCategories, getCategoryTree } from "@/lib/api/categories";
import { useApi } from "@/lib/useApi";
import { use } from "react";

async function loadForm() {
  const [tree, catalogue] = await Promise.all([getCategoryTree(), getAttrs()]);
  return { categories: flattenCategories(tree), catalogue };
}

export default function NewCategoryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // `?parentId=` from a row's "add subcategory" button.
  const { parentId } = use(searchParams);
  const { t } = useLanguage();
  const { data, error, reload } = useApi(loadForm);

  if (data) {
    const parent = data.categories.find((c) => String(c.id) === parentId);
    return (
      <CategoryForm
        category={null}
        parentId={parent && canNestUnder(parent) ? parent.id : null}
        catalogue={data.catalogue}
      />
    );
  }

  return (
    <>
      <DetailHeader backHref="/categories" title={parentId ? t("cat.addSub") : t("cat.add")} />
      {error ? <ErrorState error={error} onRetry={reload} /> : <LoadingState />}
    </>
  );
}
