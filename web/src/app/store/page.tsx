import type { Metadata } from "next";
import { Suspense } from "react";
import PageLoader from "@/components/ui/page-loader";
import StorePage from "./StorePage";

export const metadata: Metadata = {
  title: "Дэлгүүр | UVSSHOP.COM",
};

// `/store?id=<id>` — a query, not a path segment, so the static export needs
// no extra nginx rule (like the admin's `/stores/edit?id=`).
export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <StorePage />
    </Suspense>
  );
}
