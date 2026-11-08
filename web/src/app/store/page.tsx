import type { Metadata } from "next";
import { Suspense } from "react";
import StorePage from "./StorePage";
import StorePageSkeleton from "./StoreSkeleton";

export const metadata: Metadata = {
  title: "Дэлгүүр | UVSSHOP.COM",
};

// `/store?id=<id>` — a query, not a path segment, so the static export needs
// no extra nginx rule (like the admin's `/stores/edit?id=`).
export default function Page() {
  return (
    <Suspense fallback={<StorePageSkeleton />}>
      <StorePage />
    </Suspense>
  );
}
