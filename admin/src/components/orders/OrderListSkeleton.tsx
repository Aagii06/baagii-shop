import { cn } from "@/lib/utils";

/** Placeholder rows shaped like the order list's, shown while it loads. */
export default function OrderListSkeleton({ rows = 6, className }: { rows?: number; className?: string }) {
  return (
    <ul aria-hidden className={cn("-mx-4 divide-y divide-border border-b border-border bg-white", className)}>
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="animate-pulse px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <span className="min-w-0 grow">
              <span className="flex items-center gap-2">
                <span className="block h-4 w-10 rounded-md bg-muted" />
                <span className="block h-5 w-20 rounded-full bg-muted" />
              </span>
              <span className="mt-2 block h-4 w-2/5 rounded-md bg-muted" />
              <span className="mt-1.5 block h-3.5 w-1/3 rounded-md bg-muted" />
            </span>
            <span className="block h-4 w-20 shrink-0 rounded-md bg-muted" />
          </div>
          {i % 2 === 0 && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <span className="block h-10 rounded-lg bg-muted" />
              <span className="block h-10 rounded-lg bg-muted" />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
