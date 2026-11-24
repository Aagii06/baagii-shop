import Thumb from "@/components/common/Thumb";
import { cn } from "@/lib/utils";

/**
 * Two letters for a store with no logo: the first letters of its first two
 * words ("Номин Супермаркет" → "НС"), or a one-word name's first two ("Alpha" → "AL").
 */
export function storeInitials(name: string): string {
  const words = name.split(/\s+/).map((w) => w.replace(/[^\p{L}\p{N}]/gu, "")).filter(Boolean);
  const letters = words.length >= 2 ? words[0][0] + words[1][0] : (words[0] ?? "").slice(0, 2);
  return letters.toLocaleUpperCase() || "?";
}

/**
 * A store's logo; when it has none, or its file is missing, the store's two
 * letters on the brand colour instead of the no-image placeholder.
 */
export default function StoreLogo({
  id,
  name,
  size,
  className,
}: {
  id: string | null | undefined;
  name: string;
  size: number;
  /** Rounding etc., e.g. "rounded-xl"; applies to the letters tile too. */
  className?: string;
}) {
  return (
    <Thumb
      id={id}
      variant={size > 64 ? "thumbnail" : "icon"}
      size={size}
      className={cn("shrink-0", className)}
      fallback={
        <span
          className="grid size-full place-items-center bg-primary font-bold leading-none tracking-tight text-primary-foreground"
          style={{ fontSize: Math.max(10, Math.round(size * 0.38)) }}
        >
          {storeInitials(name)}
        </span>
      }
    />
  );
}
