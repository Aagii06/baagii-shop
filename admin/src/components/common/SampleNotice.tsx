import { cn } from "@/lib/utils";
import { Info } from "lucide-react";

/** Flags figures that come from `lib/api/sample.ts` rather than the backend. */
export default function SampleNotice({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "flex items-start gap-2 rounded-xl bg-warning-soft px-3 py-2 text-xs font-semibold text-foreground/80",
        className
      )}
    >
      <Info className="mt-px size-3.5 shrink-0 text-warning" />
      <span>{children}</span>
    </p>
  );
}
