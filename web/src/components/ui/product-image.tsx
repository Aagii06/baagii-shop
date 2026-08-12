import { categoryVisuals, defaultCategoryVisual } from "@/lib/categoryVisuals";
import { cn } from "@/lib/utils";

export default function ProductImage({
  category,
  className,
}: {
  category?: string;
  className?: string;
}) {
  const visual =
    (category && categoryVisuals[category]) || defaultCategoryVisual;
  const Icon = visual.icon;

  return (
    <div
      className={cn("flex items-center justify-center overflow-hidden", className)}
      style={{
        backgroundImage: `linear-gradient(135deg, ${visual.from}, ${visual.to})`,
      }}
    >
      <Icon className="h-1/3 w-1/3 text-white/90" strokeWidth={1.5} />
    </div>
  );
}
