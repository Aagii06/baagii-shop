"use client";

import { fileUrl } from "@/lib/api/files";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useState } from "react";

// Image from the file service, square by default. Pass `size` for a fixed
// pixel box, or omit it and size the box with `className`. `unoptimized`
// serves the file-service URL as-is, so no remotePatterns entry is needed.
// With no image, or one that fails to load, the shop logo in gray stands in.
export default function Thumb({
  id,
  alt = "",
  size,
  variant = "thumbnail",
  eager = false,
  className,
}: {
  id: string | null | undefined;
  alt?: string;
  /** Fixed box size in px; omit to size via `className`. */
  size?: number;
  /** "icon" for boxes ≤64px, "thumbnail" for ≤150px, "grid" for larger tiles. */
  variant?: "thumbnail" | "original" | "grid" | "icon";
  /** Load immediately — for the above-the-fold hero image. */
  eager?: boolean;
  className?: string;
}) {
  const small = fileUrl(id, variant);
  const original = fileUrl(id, "original");
  // URLs that failed, so a new id gets its own try. A missing resized file
  // falls back to the original image; only when that fails too does the
  // placeholder show.
  const [failed, setFailed] = useState<string[]>([]);
  const src = small && !failed.includes(small) ? small : original;
  const missing = !src || failed.includes(src);

  return (
    <span
      className={cn(
        "relative block shrink-0 overflow-hidden rounded-lg border border-border",
        missing ? "flex items-center justify-center bg-muted" : "img-placeholder",
        className
      )}
      style={size ? { width: size, height: size } : undefined}
    >
      {missing ? (
        // Small fixed boxes get the small logo file, everything else the medium one.
        <Image
          src={size && size <= 96 ? "/images/no-image-sm.png" : "/images/no-image-md.png"}
          alt=""
          fill
          sizes={size ? `${size}px` : "(min-width: 28rem) 28rem, 100vw"}
          className="object-contain p-[14%]"
          unoptimized
        />
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={size ? `${size}px` : "(min-width: 28rem) 28rem, 100vw"}
          className="object-cover"
          loading={eager ? "eager" : undefined}
          unoptimized
          onError={() => setFailed((prev) => (prev.includes(src) ? prev : [...prev, src]))}
        />
      )}
    </span>
  );
}
