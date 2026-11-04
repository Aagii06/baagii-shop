"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

export const DEFAULT_IMAGE = "/images/NoImage.jpg";

type SafeImageProps = Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  "src"
> & {
  src?: string | null;
};

// <img> that falls back to the default "no image" picture when the src is
// missing or fails to load. Shows a striped placeholder until it loads.
export default function SafeImage({
  src,
  alt = "",
  className,
  onError,
  onLoad,
  ...rest
}: SafeImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const useDefault = !src || failedSrc === src;
  const shown = useDefault ? DEFAULT_IMAGE : src;
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
      className={cn("bg-muted", loadedSrc !== shown && "img-placeholder", className)}
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
