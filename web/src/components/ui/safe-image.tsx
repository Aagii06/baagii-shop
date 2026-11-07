"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

// The shop logo in gray, at a resolution to suit where it is shown. The
// margin around the logo is part of the file: CSS % padding would follow
// the parent's width and squash the logo inside wide cards.
export const DEFAULT_IMAGES = {
  sm: "/images/no-image-sm-padded.png",
  md: "/images/no-image-md-padded.png",
  lg: "/images/no-image-lg-padded.png",
} as const;

export type FallbackSize = keyof typeof DEFAULT_IMAGES;

type SafeImageProps = Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  "src"
> & {
  /** One URL, or several to try in order (e.g. thumbnail, then original). */
  src?: string | null | (string | null | undefined)[];
  /** Size of the "no image" logo: sm for thumbnails, lg for the main gallery. */
  fallback?: FallbackSize;
  /** Rendered instead of the gray logo when every src is missing or fails. */
  fallbackNode?: React.ReactNode;
};

// <img> that tries each src in turn and falls back to the gray shop logo
// when they are all missing or fail to load. Shows a shimmering skeleton until it loads.
export default function SafeImage({
  src,
  alt = "",
  className,
  fallback = "md",
  fallbackNode,
  onError,
  onLoad,
  ...rest
}: SafeImageProps) {
  const candidates = (Array.isArray(src) ? src : [src]).filter(
    (s): s is string => !!s && !!s.trim()
  );
  // URLs that failed to load (or loaded as an empty image).
  const [failed, setFailed] = useState<string[]>([]);
  const current = candidates.find((s) => !failed.includes(s)) ?? null;
  const useDefault = current === null;
  const shown = current ?? DEFAULT_IMAGES[fallback];
  const markFailed = (url: string | null) => {
    if (url) setFailed((prev) => (prev.includes(url) ? prev : [...prev, url]));
  };
  // The src that finished loading, so a new one shows the placeholder again.
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const ref = useRef<HTMLImageElement>(null);

  // A server-rendered <img> can fail before hydration, when onError isn't
  // attached yet; catch that case here.
  // A server-rendered <img> can also finish loading before hydration: drop
  // the skeleton then, or it would stay behind transparent images.
  useEffect(() => {
    const img = ref.current;
    if (!img?.complete) return;
    if (img.naturalWidth === 0) {
      if (current) setFailed((prev) => (prev.includes(current) ? prev : [...prev, current]));
    } else {
      setLoadedSrc(img.getAttribute("src"));
    }
  }, [current]);

  if (useDefault && fallbackNode !== undefined) return <>{fallbackNode}</>;

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
        // The logo sits centered, whatever the caller's fit.
        useDefault && "object-contain"
      )}
      onLoad={(e) => {
        // A response that decodes to nothing counts as a failure too.
        if (!useDefault && e.currentTarget.naturalWidth === 0) {
          markFailed(current);
          return;
        }
        setLoadedSrc(shown);
        onLoad?.(e);
      }}
      onError={(e) => {
        if (!useDefault) markFailed(current);
        onError?.(e);
      }}
    />
  );
}
