"use client";

import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import DetailHeader from "@/components/layout/DetailHeader";
import { ProductEditorProvider } from "@/components/products/ProductEditor";
import { flattenCategories, getCategoryTree } from "@/lib/api/categories";
import { getPost } from "@/lib/api/posts";
import { useApi } from "@/lib/useApi";
import { PackageX } from "lucide-react";
import { useParams, useSelectedLayoutSegment } from "next/navigation";

async function loadEditor(id: number) {
  if (!Number.isInteger(id) || id <= 0) return { post: null, categories: [] };
  const [post, tree] = await Promise.all([getPost(id), getCategoryTree()]);
  return { post, categories: flattenCategories(tree) };
}

// Shared by the form and its variants page so the draft survives moving between them.
export default function EditProductLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const { data, error, reload } = useApi(() => loadEditor(Number(id)), id);
  const onVariants = useSelectedLayoutSegment() === "variants";

  if (data?.post) {
    return (
      <ProductEditorProvider key={data.post.id} post={data.post} categories={data.categories}>
        {children}
      </ProductEditorProvider>
    );
  }

  return (
    <>
      <DetailHeader
        backHref={onVariants ? `/products/${id}` : "/products"}
        title={onVariants ? "Сонголт, тоо" : "Бараа засах"}
      />
      {error && !data ? (
        <ErrorState error={error} onRetry={reload} />
      ) : !data ? (
        <LoadingState />
      ) : (
        <EmptyState
          icon={PackageX}
          title="Бараа олдсонгүй"
          description={`#${id} дугаартай бараа байхгүй байна.`}
        />
      )}
    </>
  );
}
