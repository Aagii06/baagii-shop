"use client";

import CategoryForm from "@/components/categories/CategoryForm";
import { ErrorState, LoadingState } from "@/components/common/States";
import DetailHeader from "@/components/layout/DetailHeader";
import { getAttrs } from "@/lib/api/attrs";
import { flattenCategories, getCategoryTree } from "@/lib/api/categories";
import { useApi } from "@/lib/useApi";

async function loadForm() {
  const [tree, catalogue] = await Promise.all([getCategoryTree(), getAttrs()]);
  return { categories: flattenCategories(tree), catalogue };
}

export default function NewCategoryPage() {
  const { data, error, reload } = useApi(loadForm);

  if (data) return <CategoryForm category={null} categories={data.categories} catalogue={data.catalogue} />;

  return (
    <>
      <DetailHeader backHref="/categories" title="Категори нэмэх" />
      {error ? <ErrorState error={error} onRetry={reload} /> : <LoadingState />}
    </>
  );
}
