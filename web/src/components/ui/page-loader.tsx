import { cn } from "@/lib/utils";

/**
 * Full-page loading state as a skeleton of the page that's coming:
 * - `page` (default): a heading and a few content cards (account pages, cart, orders, …)
 * - `product`: the product page — gallery on one side, details on the other
 * - `form`: a heading and one card of labelled fields (sign-in, seller request, checkout)
 */
export default function PageLoader({
  className,
  variant = "page",
}: {
  className?: string;
  variant?: "page" | "product" | "form";
}) {
  const bone = "rounded-md bg-muted animate-pulse";

  return (
    <div role="status" aria-busy="true" className={cn("container mx-auto px-4 py-6 sm:py-8", className)}>
      <span className="sr-only">Loading…</span>

      {variant === "product" ? (
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-10">
          <div className="space-y-3">
            <div className={cn(bone, "aspect-square w-full rounded-lg")} />
            <div className="flex gap-2">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className={cn(bone, "h-16 w-16")} />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className={cn(bone, "h-4 w-32")} />
            <div className={cn(bone, "h-8 w-4/5")} />
            <div className={cn(bone, "h-9 w-40")} />
            <div className="space-y-2 pt-2">
              <div className={cn(bone, "h-4 w-24")} />
              <div className="flex gap-2">
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className={cn(bone, "h-10 w-16")} />
                ))}
              </div>
            </div>
            <div className={cn(bone, "h-12 w-full")} />
            <div className="space-y-2 pt-4">
              <div className={cn(bone, "h-3.5 w-full")} />
              <div className={cn(bone, "h-3.5 w-11/12")} />
              <div className={cn(bone, "h-3.5 w-3/4")} />
            </div>
          </div>
        </div>
      ) : variant === "form" ? (
        <div className="mx-auto max-w-md space-y-4 rounded-2xl border border-border bg-card p-6 sm:p-8">
          <div className={cn(bone, "h-12 w-12 rounded-full")} />
          <div className={cn(bone, "h-6 w-2/3")} />
          <div className={cn(bone, "h-4 w-full")} />
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="space-y-2 pt-2">
              <div className={cn(bone, "h-3.5 w-24")} />
              <div className={cn(bone, "h-11 w-full rounded-lg")} />
            </div>
          ))}
          <div className={cn(bone, "mt-2 h-11 w-full rounded-lg")} />
        </div>
      ) : (
        <div className="max-w-3xl space-y-4">
          <div className={cn(bone, "h-7 w-48")} />
          <div className={cn(bone, "h-4 w-72 max-w-full")} />
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex gap-4 rounded-2xl border border-border bg-card p-4">
              <div className={cn(bone, "h-16 w-16 shrink-0 rounded-lg")} />
              <div className="flex-1 space-y-2.5 py-1">
                <div className={cn(bone, "h-4 w-3/5")} />
                <div className={cn(bone, "h-3.5 w-2/5")} />
                <div className={cn(bone, "h-3.5 w-1/4")} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
