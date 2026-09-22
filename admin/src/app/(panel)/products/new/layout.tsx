"use client";

import { ErrorState, LoadingState } from "@/components/common/States";
import DetailHeader from "@/components/layout/DetailHeader";
import { ProductEditorProvider } from "@/components/products/ProductEditor";
import { flattenCategories, getCategoryTree } from "@/lib/api/categories";
import { useApi } from "@/lib/useApi";
import { useSelectedLayoutSegment } from "next/navigation";
import { useMemo } from "react";

// Shared by the form and its variants page so the draft survives moving between them.
export default function NewProductLayout({ children }: { children: React.ReactNode }) {
  const { data: tree, error, reload } = useApi(getCategoryTree);
  const categories = useMemo(() => (tree ? flattenCategories(tree) : null), [tree]);
  const onVariants = useSelectedLayoutSegment() === "variants";

  if (categories) {
    return (
      <ProductEditorProvider post={null} categories={categories}>
        {children}
      </ProductEditorProvider>
    );
  }

  return (
    <>
      <DetailHeader
        backHref={onVariants ? "/products/new" : "/products"}
        title={onVariants ? "Сонголт, тоо" : "Бараа нэмэх"}
      />
      {error ? <ErrorState error={error} onRetry={reload} /> : <LoadingState />}
    </>
  );
}
