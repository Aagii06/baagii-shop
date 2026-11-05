import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function Bar({ className }: { className?: string }) {
  return <span className={cn("block rounded-md bg-muted", className)} />;
}

/** Placeholder for the stat tiles + sales chart, shown while the summary loads. */
export function SalesSectionSkeleton() {
  // Fixed heights so the bars don't jump between renders.
  const bars = [35, 55, 40, 70, 50, 85, 60, 45, 75, 65, 90, 50];

  return (
    <div aria-hidden className="animate-pulse space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <Card key={i} className="p-4">
            <Bar className="h-4 w-1/2" />
            <Bar className="mt-2.5 h-6 w-3/4" />
            <Bar className="mt-2.5 h-3 w-1/3" />
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <Bar className="h-4 w-28" />
          <Bar className="h-3 w-12" />
        </div>
        <div className="mt-5 flex h-28 items-end gap-1.5">
          {bars.map((h, i) => (
            <span key={i} className="flex-1 rounded-t-[3px] bg-muted" style={{ height: `${h}%` }} />
          ))}
        </div>
        <Bar className="mt-2 h-3 w-full" />
      </Card>
    </div>
  );
}

/** Placeholder rows for a list card (low stock / recent orders). */
export function ListRowsSkeleton({ rows = 4, twoLine = false }: { rows?: number; twoLine?: boolean }) {
  return (
    <ul aria-hidden className="animate-pulse divide-y divide-border">
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="flex items-center gap-3 px-4 py-3.5">
          <span className="min-w-0 grow space-y-2">
            <Bar className="h-4 w-2/5" />
            {twoLine && <Bar className="h-3 w-1/4" />}
          </span>
          <span className="shrink-0 space-y-1.5">
            <Bar className="ml-auto h-4 w-16" />
            {twoLine && <Bar className="ml-auto h-4 w-12 rounded-full" />}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Whole list card placeholder, including its title row. */
export function ListCardSkeleton({ rows = 4, twoLine = false }: { rows?: number; twoLine?: boolean }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex animate-pulse items-center justify-between gap-3 border-b border-border px-4 py-3.5">
        <Bar className="h-4 w-32" />
        <Bar className="h-4 w-14" />
      </div>
      <ListRowsSkeleton rows={rows} twoLine={twoLine} />
    </Card>
  );
}
