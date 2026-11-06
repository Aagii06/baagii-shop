import { Card } from "@/components/ui/card";

const bar = "block rounded-md bg-muted";

/**
 * Placeholder shaped like the partner-requests summary strip and list, shown
 * while it loads. `stats` off leaves out the strip (already shown, e.g. on a tab switch).
 */
export default function PartnerRequestsSkeleton({ rows = 5, stats = true }: { rows?: number; stats?: boolean }) {
  return (
    <div aria-hidden className="animate-pulse">
      {stats && (
        <Card className="mt-4 grid grid-cols-4 divide-x divide-border p-0">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex flex-col items-center px-2 py-2.5">
              <span className={`${bar} h-[18px] w-6`} />
              <span className={`${bar} mt-1.5 h-3 w-12`} />
            </div>
          ))}
        </Card>
      )}

      <ul className="-mx-4 mt-4 divide-y divide-border border-y border-border bg-white">
        {Array.from({ length: rows }, (_, i) => (
          <li key={i} className="px-4 py-4">
            <span className="flex items-center gap-2">
              <span className={`${bar} h-4 w-10`} />
              <span className="block h-5 w-20 rounded-full bg-muted" />
            </span>
            <span className={`${bar} mt-2 h-4 w-2/5`} />
            <span className={`${bar} mt-1.5 h-4 w-28`} />
            <span className={`${bar} mt-1.5 h-3.5 w-1/2`} />
            <span className={`${bar} mt-1.5 h-3 w-20`} />
            {i < 2 && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <span className="block h-10 rounded-lg bg-muted" />
                <span className="block h-10 rounded-lg bg-muted" />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
