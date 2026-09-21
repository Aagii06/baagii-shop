import { fileUrl } from "@/lib/api/files";
import { cn } from "@/lib/utils";
import Image from "next/image";

// Image from the file service, square by default. Pass `size` for a fixed
// pixel box, or omit it and size the box with `className`. `unoptimized`
// serves the file-service URL as-is, so no remotePatterns entry is needed.
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

  return (
    <span
      className={cn(
        "img-placeholder relative block shrink-0 overflow-hidden rounded-lg border border-border",
        className
      )}
      style={size ? { width: size, height: size } : undefined}
    >
      {src && (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={size ? `${size}px` : "(min-width: 28rem) 28rem, 100vw"}
          className="object-cover"
          loading={eager ? "eager" : undefined}
          unoptimized
        />
      )}
    </span>
  );
}
