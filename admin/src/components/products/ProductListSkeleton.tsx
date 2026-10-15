import { cn } from "@/lib/utils";

/** Placeholder rows shaped like the product list's, shown while a page loads. */
export default function ProductListSkeleton({ rows = 8, className }: { rows?: number; className?: string }) {
  return (
    <ul aria-hidden className={cn("divide-y divide-border border-b border-border", className)}>
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="flex animate-pulse items-center gap-3 py-3.5">
          <span className="size-[52px] shrink-0 rounded-xl bg-muted" />
          <span className="min-w-0 grow space-y-2">
            <span className="block h-4 w-3/5 rounded-md bg-muted" />
            <span className="block h-3 w-2/5 rounded-md bg-muted" />
          </span>
          <span className="shrink-0 space-y-2">
            <span className="ml-auto block h-4 w-16 rounded-md bg-muted" />
            <span className="ml-auto block h-3 w-12 rounded-md bg-muted" />
          </span>
        </li>
      ))}
    </ul>
  );
}
