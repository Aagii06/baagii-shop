import ProductListSkeleton from "@/components/home/ProductListSkeleton";

/** The store banner while it loads: logo, name, count and a contacts row, in grey. */
export function StoreHeaderSkeleton() {
  return (
    <section
      aria-busy="true"
      className="animate-pulse rounded-2xl border border-border bg-card p-5 sm:p-7"
    >
      <div className="flex items-center gap-4">
        <div className="size-16 shrink-0 rounded-2xl bg-muted sm:size-20" />
        <div className="flex-1 space-y-2.5">
          <div className="h-7 w-48 max-w-full rounded-md bg-muted" />
          <div className="h-4 w-20 rounded-md bg-muted" />
        </div>
      </div>
      <div className="mt-5 border-t border-border pt-4">
        <div className="h-3 w-24 rounded bg-muted" />
        <div className="mt-3 flex gap-2">
          <div className="h-8 w-32 rounded-full bg-muted" />
          <div className="h-8 w-40 rounded-full bg-muted" />
        </div>
      </div>
    </section>
  );
}

/** The whole store page while it starts: back link, banner, filter sidebar and the product grid. */
export default function StorePageSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      className="container mx-auto space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
    >
      <div>
        <div className="mb-4 h-9 w-36 animate-pulse rounded-full bg-muted" />
        <StoreHeaderSkeleton />
      </div>
      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="hidden w-64 shrink-0 animate-pulse space-y-3 bg-card px-5 py-4 shadow-sm lg:block">
          <div className="h-5 w-24 rounded bg-muted" />
          {["70%", "55%", "80%", "60%", "72%"].map((width, i) => (
            <div key={i} className="h-3.5 rounded bg-muted" style={{ width }} />
          ))}
        </aside>
        <div className="min-w-0 flex-1 space-y-5">
          <div className="flex justify-end">
            <div className="h-10 w-52 animate-pulse rounded-xl bg-muted" />
          </div>
          <ProductListSkeleton />
        </div>
      </div>
    </div>
  );
}
