import { cn } from "@/lib/utils";

/** Placeholder rows shaped like the attribute list's, shown while it loads. */
export default function AttrListSkeleton({ rows = 8, className }: { rows?: number; className?: string }) {
  return (
    <ul aria-hidden className={cn("divide-y divide-border border-b border-border", className)}>
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="flex animate-pulse items-center gap-2 py-3.5">
          <span className="min-w-0 grow space-y-2">
            <span className="flex items-center gap-2">
              <span className="block h-4 w-1/3 rounded-md bg-muted" />
              <span className="block h-5 w-7 rounded-full bg-muted" />
            </span>
            <span className="block h-3 w-1/2 rounded-md bg-muted" />
          </span>
          <span className="size-9 shrink-0 rounded-lg bg-muted" />
          <span className="size-9 shrink-0 rounded-lg bg-muted" />
        </li>
      ))}
    </ul>
  );
}
