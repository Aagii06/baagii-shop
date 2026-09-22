"use client";

import { ErrorState, LoadingState } from "@/components/common/States";
import DetailHeader from "@/components/layout/DetailHeader";
import { ProductEditorProvider } from "@/components/products/ProductEditor";
import { getAttrs } from "@/lib/api/attrs";
import { flattenCategories, getCategoryTree } from "@/lib/api/categories";
import { useApi } from "@/lib/useApi";
import { useSelectedLayoutSegment } from "next/navigation";

async function loadEditor() {
  const [tree, catalogue] = await Promise.all([getCategoryTree(), getAttrs()]);
  return { categories: flattenCategories(tree), catalogue };
}

// Shared by the form and its variants page so the draft survives moving between them.
export default function NewProductLayout({ children }: { children: React.ReactNode }) {
  const { data, error, reload } = useApi(loadEditor);
  const onVariants = useSelectedLayoutSegment() === "variants";

  if (data) {
    return (
      <ProductEditorProvider post={null} categories={data.categories} catalogue={data.catalogue}>
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
