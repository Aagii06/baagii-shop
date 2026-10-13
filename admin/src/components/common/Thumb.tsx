"use client";

import { fileUrl } from "@/lib/api/files";
import { cn } from "@/lib/utils";
import { ImageOff } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

// Image from the file service, square by default. Pass `size` for a fixed
// pixel box, or omit it and size the box with `className`. `unoptimized`
// serves the file-service URL as-is, so no remotePatterns entry is needed.
// With no image, or one that fails to load, an image icon stands in.
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
  variant?: "thumbnail" | "original";
  /** Load immediately — for the above-the-fold hero image. */
  eager?: boolean;
  className?: string;
}) {
  const src = fileUrl(id, variant);
  // The src that failed, so a new one gets its own try.
  const [failed, setFailed] = useState<string | null>(null);
  const missing = !src || failed === src;

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
        <ImageOff aria-hidden className="size-2/5 max-h-12 max-w-12 text-muted-foreground/60" strokeWidth={1.5} />
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={size ? `${size}px` : "(min-width: 28rem) 28rem, 100vw"}
          className="object-cover"
          loading={eager ? "eager" : undefined}
          unoptimized
          onError={() => setFailed(src)}
        />
      )}
    </span>
  );
}
