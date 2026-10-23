import { Card, CardContent } from "@/components/ui/card";

// Mirrors ProductCard's layout so the grid doesn't shift once products load.
function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden bg-card border-border py-0 gap-0">
      <div className="aspect-square bg-muted animate-pulse" />
      <CardContent className="p-4 space-y-2">
        <div className="min-h-10 space-y-2">
          <div className="h-3.5 w-full rounded bg-muted animate-pulse" />
          <div className="h-3.5 w-2/3 rounded bg-muted animate-pulse" />
        </div>
        <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
        <div className="flex items-end justify-between pt-1">
          <div className="h-5 w-20 rounded bg-muted animate-pulse" />
          <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProductListSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div
      aria-busy="true"
      className="grid gap-4 sm:gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
    >
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
