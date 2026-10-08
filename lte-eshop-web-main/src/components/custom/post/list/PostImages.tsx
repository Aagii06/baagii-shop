import { cdnBaseUrl } from "../../../../constant/config";

type PostImagesProps = {
  images?: string[];
};

export default function PostImages({ images }: PostImagesProps) {
  if (!images?.length) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-gray-100 text-[11px] text-gray-400">
        Зураггүй
      </div>
    );
  }

  return (
    <div className="-mx-2.5 flex snap-x snap-mandatory overflow-x-auto overflow-y-hidden rounded-none scrollbar-none">
      {images.map((src, i) => (
        <img
          key={`${src}-${i}`}
          src={`${cdnBaseUrl}/file/thumbnail/${src}`}
          alt=""
          className="aspect-square w-full min-w-full shrink-0 snap-center object-cover bg-gray-100"
          loading="lazy"
        />
      ))}
    </div>
  );
}
