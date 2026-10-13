"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";

export const DEFAULT_IMAGE = "/images/NoImage.jpg";

type SafeImageProps = Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  "src"
> & {
  src?: string | null;
};

// <img> that falls back to the default "no image" picture when the src is
// missing or fails to load.
export default function SafeImage({
  src,
  alt = "",
  className,
  onError,
  ...rest
}: SafeImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const useDefault = !src || failedSrc === src;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...rest}
      src={useDefault ? DEFAULT_IMAGE : src}
      alt={alt}
      className={cn("bg-muted", className)}
      onError={(e) => {
        if (!useDefault) setFailedSrc(src);
        onError?.(e);
      }}
    />
  );
}
