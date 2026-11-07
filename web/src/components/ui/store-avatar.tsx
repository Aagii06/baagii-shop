"use client";

import SafeImage from "@/components/ui/safe-image";
import { cn } from "@/lib/utils";

/**
 * Initials for a store with no logo: the first letter of a one-word name,
 * or the first letters of the first two words ("Номин Супермаркет" → "НС").
 * Quotes and other symbols are skipped.
 */
export function storeInitials(name: string): string {
  const letters = name
    .split(/\s+/)
    .map((word) => word.match(/[\p{L}\p{N}]/u)?.[0])
    .filter((c): c is string => !!c);
  return letters.slice(0, 2).join("").toLocaleUpperCase() || "?";
}

/**
 * A store's logo, or — when it has none or it fails to load — a circle-free
 * tile with the store's initials. Fills its parent; size it from outside.
 */
export default function StoreAvatar({
  name,
  src,
  className,
  initialsClassName,
}: {
  name: string;
  src: string | null | undefined;
  /** Classes for the logo <img>. */
  className?: string;
  /** Classes for the initials tile (e.g. text size). */
  initialsClassName?: string;
}) {
  return (
    <SafeImage
      src={src}
      alt=""
      loading="lazy"
      fallback="sm"
      className={className}
      fallbackNode={
        <span
          aria-hidden
          className={cn(
            "grid size-full place-items-center rounded-[inherit] bg-primary/10 text-lg font-bold text-primary select-none",
            initialsClassName
          )}
        >
          {storeInitials(name)}
        </span>
      }
    />
  );
}
