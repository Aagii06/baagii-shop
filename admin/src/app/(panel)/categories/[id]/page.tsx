"use client";

import CategoryForm from "@/components/categories/CategoryForm";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import DetailHeader from "@/components/layout/DetailHeader";
import { flattenCategories, getCategoryTree } from "@/lib/api/categories";
import { useApi } from "@/lib/useApi";
import { FolderX } from "lucide-react";
import { useParams } from "next/navigation";
import { useMemo } from "react";

export default function EditCategoryPage() {
  const { id } = useParams<{ id: string }>();
  const { data: tree, error, reload } = useApi(getCategoryTree);
  const categories = useMemo(() => (tree ? flattenCategories(tree) : null), [tree]);
  const category = categories?.find((c) => c.id === Number(id));

  if (categories && category) {
    return <CategoryForm key={category.id} category={category} categories={categories} />;
  }

  return (
    <>
      <DetailHeader backHref="/categories" title="Категори засах" />
      {error && !categories ? (
        <ErrorState error={error} onRetry={reload} />
      ) : !categories ? (
        <LoadingState />
      ) : (
        <EmptyState
          icon={FolderX}
          title="Категори олдсонгүй"
          description={`#${id} дугаартай категори байхгүй байна.`}
        />
      )}
    </>
  );
}
