"use client";

import { LoadingState } from "@/components/common/States";
import StoreForm from "@/components/stores/StoreForm";
import { Suspense } from "react";

// StoreForm reads `?from=` (useSearchParams), which the static export needs inside Suspense.
export default function NewStorePage() {
  return (
    <Suspense fallback={<LoadingState variant="form" />}>
      <StoreForm store={null} />
    </Suspense>
  );
}
