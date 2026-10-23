import { cn } from "@/lib/utils";

/** Placeholder rows shaped like the category list's, shown while it loads. */
export default function CategoryListSkeleton({ rows = 8, className }: { rows?: number; className?: string }) {
  return (
    <ul aria-hidden className={cn("divide-y divide-border border-b border-border", className)}>
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="flex animate-pulse items-center gap-2 py-3.5">
          <span className="-ml-1 size-8 shrink-0" />
          <span className="min-w-0 grow space-y-2">
            <span className="block h-4 w-2/5 rounded-md bg-muted" />
            <span className="block h-3 w-1/4 rounded-md bg-muted" />
          </span>
          <span className="size-9 shrink-0 rounded-lg bg-muted" />
          <span className="size-9 shrink-0 rounded-lg bg-muted" />
          <span className="size-9 shrink-0 rounded-lg bg-muted" />
        </li>
      ))}
    </ul>
  );
}
