import ProductListSkeleton from "@/components/home/ProductListSkeleton";

/**
 * The store banner while it loads: the same coloured banner as the real one
 * (its colour never changes), with white pulsing bars for the logo, name,
 * count and contacts.
 */
export function StoreHeaderSkeleton() {
  return (
    <section
      aria-busy="true"
      className="relative overflow-hidden rounded-2xl brand-gradient p-5 text-white shadow-lg shadow-primary/20 sm:p-7"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-white/10"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-24 right-24 size-48 rounded-full bg-white/10"
      />
      <div className="relative animate-pulse">
        <div className="flex items-center gap-4">
          <div className="size-16 shrink-0 rounded-2xl bg-white/30 sm:size-20" />
          <div className="flex-1 space-y-2.5">
            <div className="h-7 w-48 max-w-full rounded-md bg-white/30" />
            <div className="h-4 w-20 rounded-md bg-white/25" />
          </div>
        </div>
        <div className="mt-5 border-t border-white/20 pt-4">
          <div className="h-3 w-24 rounded-md bg-white/25" />
          <div className="mt-3 flex gap-2">
            <div className="h-8 w-32 rounded-full bg-white/20" />
            <div className="h-8 w-40 rounded-full bg-white/20" />
          </div>
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
