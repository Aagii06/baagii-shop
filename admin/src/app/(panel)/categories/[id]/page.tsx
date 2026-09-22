"use client";

import CategoryForm from "@/components/categories/CategoryForm";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import DetailHeader from "@/components/layout/DetailHeader";
import { getAttrs } from "@/lib/api/attrs";
import { flattenCategories, getCategoryTree } from "@/lib/api/categories";
import { useApi } from "@/lib/useApi";
import { FolderX } from "lucide-react";
import { useParams } from "next/navigation";

async function loadForm() {
  const [tree, catalogue] = await Promise.all([getCategoryTree(), getAttrs()]);
  return { categories: flattenCategories(tree), catalogue };
}

export default function EditCategoryPage() {
  const { id } = useParams<{ id: string }>();
  const { data, error, reload } = useApi(loadForm);
  const categories = data?.categories;
  const category = categories?.find((c) => c.id === Number(id));

  if (data && category) {
    return (
      <CategoryForm key={category.id} category={category} catalogue={data.catalogue} />
    );
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
