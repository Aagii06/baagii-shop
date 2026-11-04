"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

// The shop logo in gray, at a resolution to suit where it is shown.
export const DEFAULT_IMAGES = {
  sm: "/images/no-image-sm.png",
  md: "/images/no-image-md.png",
  lg: "/images/no-image-lg.png",
} as const;

export type FallbackSize = keyof typeof DEFAULT_IMAGES;

type SafeImageProps = Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  "src"
> & {
  src?: string | null;
  /** Size of the "no image" logo: sm for thumbnails, lg for the main gallery. */
  fallback?: FallbackSize;
};

// <img> that falls back to the gray shop logo when the src is missing or
// fails to load. Shows a striped placeholder until it loads.
export default function SafeImage({
  src,
  alt = "",
  className,
  fallback = "md",
  onError,
  onLoad,
  ...rest
}: SafeImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const useDefault = !src || failedSrc === src;
  const shown = useDefault ? DEFAULT_IMAGES[fallback] : src;
  // The src that finished loading, so a new one shows the placeholder again.
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const ref = useRef<HTMLImageElement>(null);

  // A server-rendered <img> can fail before hydration, when onError isn't
  // attached yet; catch that case here.
  useEffect(() => {
    const img = ref.current;
    if (img?.complete && img.naturalWidth === 0 && !useDefault) setFailedSrc(src);
  }, [src, useDefault]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...rest}
      ref={ref}
      src={shown}
      alt={alt}
      className={cn(
        "bg-muted",
        loadedSrc !== shown && "img-placeholder",
        className,
        // The logo sits centered with some room, whatever the caller's fit.
        useDefault && "!object-contain",
        useDefault && (fallback === "sm" ? "p-[12%]" : fallback === "md" ? "p-[18%]" : "p-[24%]")
      )}
      onLoad={(e) => {
        setLoadedSrc(shown);
        onLoad?.(e);
      }}
      onError={(e) => {
        if (!useDefault) setFailedSrc(src);
        onError?.(e);
      }}
    />
  );
}
