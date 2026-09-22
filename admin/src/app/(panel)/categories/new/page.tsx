"use client";

import CategoryForm from "@/components/categories/CategoryForm";
import { ErrorState, LoadingState } from "@/components/common/States";
import DetailHeader from "@/components/layout/DetailHeader";
import { flattenCategories, getCategoryTree } from "@/lib/api/categories";
import { useApi } from "@/lib/useApi";
import { useMemo } from "react";

export default function NewCategoryPage() {
  const { data: tree, error, reload } = useApi(getCategoryTree);
  const categories = useMemo(() => (tree ? flattenCategories(tree) : null), [tree]);

  if (categories) return <CategoryForm category={null} categories={categories} />;

  return (
    <>
      <DetailHeader backHref="/categories" title="Категори нэмэх" />
      {error ? <ErrorState error={error} onRetry={reload} /> : <LoadingState />}
    </>
  );
}
