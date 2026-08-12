import { cn } from "@/lib/utils";

export default function PlaceholderImage({
  label,
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "img-placeholder flex items-center justify-center overflow-hidden",
        className
      )}
    >
      {label && (
        <span className="text-muted-foreground text-[11px] text-center px-2 leading-snug">
          {label}
        </span>
      )}
    </div>
  );
}
