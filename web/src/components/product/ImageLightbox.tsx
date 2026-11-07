"use client";

import SafeImage from "@/components/ui/safe-image";
import { resizedFileUrl } from "@/lib/api/files";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Full-screen gallery over a dark backdrop: the image fitted whole, arrows
 * and a counter, a thumbnail strip below. Swipe, arrow keys and Escape
 * work; page scroll is locked while it's open. Reports the image it closes
 * on, so the page gallery can follow.
 */
export default function ImageLightbox({
  images,
  startIndex,
  alt,
  onClose,
}: {
  images: string[];
  startIndex: number;
  alt: string;
  onClose: (index: number) => void;
}) {
  const [index, setIndex] = useState(startIndex);
  // Latest index and onClose for the key handler, which is set up once.
  const latest = useRef({ index, onClose });
  useEffect(() => {
    latest.current = { index, onClose };
  });
  const stripRef = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);
  const count = images.length;

  const go = (i: number) => setIndex(Math.max(0, Math.min(count - 1, i)));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") latest.current.onClose(latest.current.index);
      else if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
      else if (e.key === "ArrowRight") setIndex((i) => Math.min(count - 1, i + 1));
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [count]);

  // Keep the current thumbnail in view.
  useEffect(() => {
    const thumb = stripRef.current?.children[index] as HTMLElement | undefined;
    thumb?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [index]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      className="fixed inset-0 z-[100] flex flex-col bg-black/95 text-white animate-in fade-in duration-200"
    >
      <div className="flex shrink-0 items-center justify-between px-4 py-3 sm:px-6">
        <span className="text-sm font-medium tabular-nums text-white/80">
          {index + 1} / {count}
        </span>
        <button
          type="button"
          onClick={() => onClose(index)}
          aria-label="Close"
          className="grid size-10 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
        >
          <X className="size-5" />
        </button>
      </div>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-16"
        onClick={(e) => e.target === e.currentTarget && onClose(index)}
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
        }}
      >
        <SafeImage
          key={images[index]}
          src={images[index]}
          alt={alt}
          fallback="lg"
          className="max-h-full max-w-full select-none bg-transparent object-contain"
        />

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(index - 1)}
              disabled={index === 0}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 transition hover:bg-white/25 disabled:opacity-0 sm:left-4 sm:size-12"
            >
              <ChevronLeft className="size-6" />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              disabled={index === count - 1}
              aria-label="Next image"
              className="absolute right-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 transition hover:bg-white/25 disabled:opacity-0 sm:right-4 sm:size-12"
            >
              <ChevronRight className="size-6" />
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <div
          ref={stripRef}
          className="no-scrollbar flex shrink-0 justify-start gap-2 overflow-x-auto px-4 py-3 sm:justify-center sm:px-6 sm:py-4"
        >
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i)}
              aria-label={`${i + 1} / ${count}`}
              aria-current={i === index}
              className={cn(
                "size-14 shrink-0 overflow-hidden rounded-lg border-2 bg-white transition sm:size-16",
                i === index ? "border-white opacity-100" : "border-transparent opacity-50 hover:opacity-80"
              )}
            >
              <SafeImage
                src={[resizedFileUrl(src, "icon"), src]}
                fallback="sm"
                alt=""
                className="size-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body
  );
}
