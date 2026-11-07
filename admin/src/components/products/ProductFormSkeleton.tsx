import { cn } from "@/lib/utils";

/** A label over a rounded input. */
function FieldRow({ className, tall }: { className?: string; tall?: boolean }) {
  return (
    <div className={cn("min-w-0 space-y-1.5", className)}>
      <span className="block h-3.5 w-24 rounded-md bg-muted" />
      <span className={cn("block w-full bg-muted", tall ? "h-40 rounded-2xl" : "h-12 rounded-full")} />
    </div>
  );
}

/** Placeholder shaped like the product form, shown while the product loads. */
export function ProductFormSkeleton() {
  return (
    <div aria-hidden className="animate-pulse space-y-4">
      <FieldRow />
      <div className="grid grid-cols-2 gap-3">
        <FieldRow />
        <FieldRow />
      </div>
      <FieldRow />
      <FieldRow />
      {/* Variants link */}
      <div className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3.5">
        <span className="size-10 shrink-0 rounded-full bg-muted" />
        <span className="min-w-0 grow space-y-2">
          <span className="block h-4 w-1/2 rounded-md bg-muted" />
          <span className="block h-3 w-2/3 rounded-md bg-muted" />
        </span>
      </div>
      {/* Images */}
      <div className="space-y-2.5">
        <span className="block h-3.5 w-16 rounded-md bg-muted" />
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }, (_, i) => (
            <span key={i} className="aspect-square rounded-2xl bg-muted" />
          ))}
        </div>
      </div>
      <FieldRow tall />
    </div>
  );
}

/** Placeholder shaped like the variants page: value chips, then a row per variant. */
export function ProductVariantsSkeleton() {
  return (
    <div aria-hidden className="animate-pulse space-y-6">
      {Array.from({ length: 2 }, (_, i) => (
        <div key={i} className="space-y-2.5">
          <span className="block h-5 w-32 rounded-md bg-muted" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 5 }, (_, j) => (
              <span key={j} className="h-10 w-16 rounded-full bg-muted" />
            ))}
          </div>
        </div>
      ))}
      <div className="space-y-3 rounded-2xl border border-border px-2.5 py-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="space-y-1.5">
            <span className="block h-4 w-1/3 rounded-md bg-muted" />
            <div className="grid grid-cols-[4.5rem_minmax(0,1fr)_minmax(0,1fr)] gap-1.5">
              {Array.from({ length: 3 }, (_, j) => (
                <span key={j} className="h-11 rounded-full bg-muted" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
