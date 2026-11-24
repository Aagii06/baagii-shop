import { cn } from "@/lib/utils";

/**
 * Placeholder rows shaped like the product list's, shown while a page loads.
 * `flush` matches the products page: the photo flush to the row's left edge,
 * full row height; otherwise the compact rows (order product picker).
 */
export default function ProductListSkeleton({
  rows = 8,
  flush = false,
  className,
}: {
  rows?: number;
  flush?: boolean;
  className?: string;
}) {
  return (
    <ul aria-hidden className={cn("-mx-4 divide-y divide-border border-b border-border bg-white", className)}>
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className={cn("flex animate-pulse", flush ? "items-stretch pr-4" : "items-center gap-3 px-4 py-3.5")}>
          <span className={flush ? "min-h-[84px] w-24 shrink-0 bg-muted" : "size-[52px] shrink-0 rounded-xl bg-muted"} />
          <span className={cn("min-w-0 grow space-y-2", flush && "self-center py-3 pl-3.5 pr-2")}>
            <span className="block h-4 w-3/5 rounded-md bg-muted" />
            <span className="block h-3 w-2/5 rounded-md bg-muted" />
          </span>
          <span className={cn("shrink-0 space-y-2", flush && "self-center")}>
            <span className="ml-auto block h-4 w-16 rounded-md bg-muted" />
            <span className="ml-auto block h-3 w-12 rounded-md bg-muted" />
          </span>
        </li>
      ))}
    </ul>
  );
}
