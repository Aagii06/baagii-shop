import { useEffect, useRef, useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/counter.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import { cdnBaseUrl } from "../../../../constant/config";
import { ChevronRightIcon } from "../../../layout/main/bottom/icons";

type PostGalleryProps = {
  images?: string[];
};

function imageUrl(src: string) {
  if (src.startsWith("http")) return src;
  return `${cdnBaseUrl}/file/${src}`;
}

export default function PostGallery({ images }: PostGalleryProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const imageKey = (images ?? []).join("|");
  const slides = (images ?? []).map((src) => ({ src: imageUrl(src) }));

  useEffect(() => {
    setActive(0);
    scrollerRef.current?.scrollTo({ left: 0 });
  }, [imageKey]);

  const onScroll = () => {
    const el = scrollerRef.current;
    if (!el || !el.clientWidth) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    setActive(Math.min(Math.max(i, 0), (images?.length ?? 1) - 1));
  };

  const goTo = (index: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: el.clientWidth * index, behavior: "smooth" });
  };

  const goNext = () => {
    if (!images?.length) return;
    goTo((active + 1) % images.length);
  };

  if (!images?.length) {
    return (
      <div className="mx-3 flex aspect-[4/3] items-center justify-center rounded-2xl bg-gray-200 text-sm text-gray-400">
        Зураггүй
      </div>
    );
  }

  return (
    <>
      <div className="relative mx-3 overflow-hidden rounded-2xl bg-gray-200">
        <div
          ref={scrollerRef}
          onScroll={onScroll}
          className="flex snap-x snap-mandatory overflow-x-auto scrollbar-none"
        >
          {images.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setLightboxIndex(i)}
              className="flex w-full min-w-full shrink-0 snap-center cursor-zoom-in items-center justify-center p-4"
            >
              <img
                src={imageUrl(src)}
                alt=""
                className="max-h-64 w-full rounded-xl object-contain"
                loading={i === 0 ? "eager" : "lazy"}
              />
            </button>
          ))}
        </div>

        {images.length > 1 ? (
          <>
            <button
              type="button"
              aria-label="Дараах зураг"
              onClick={goNext}
              className="absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-sm"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
            <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`${i + 1}-р зураг`}
                  onClick={() => goTo(i)}
                  className={`pointer-events-auto h-1.5 rounded-full transition-all ${
                    i === active ? "w-4 bg-brand" : "w-1.5 bg-white/80"
                  }`}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>

      <Lightbox
        open={lightboxIndex >= 0}
        index={lightboxIndex}
        close={() => setLightboxIndex(-1)}
        slides={slides}
        plugins={[Zoom, Thumbnails, Counter]}
        zoom={{
          scrollToZoom: true,
          maxZoomPixelRatio: 3,
        }}
        thumbnails={{
          position: "bottom",
          border: 0,
          borderRadius: 8,
          padding: 8,
          gap: 8,
        }}
        counter={{ container: { style: { top: 0 } } }}
        labels={{
          Next: "Дараах",
          Previous: "Өмнөх",
          Close: "Хаах",
          "Zoom in": "Томруулах",
          "Zoom out": "Жижигрүүлэх",
        }}
      />
    </>
  );
}
