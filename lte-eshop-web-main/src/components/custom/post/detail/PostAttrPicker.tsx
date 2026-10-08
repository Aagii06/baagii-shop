import type PostAttr from "../../../../models/eshop/PostAttr";
import type PostAttrValue from "../../../../models/eshop/PostAttrValue";
import { cdnBaseUrl } from "../../../../constant/config";
import { CheckIcon } from "./icons";

type PostAttrPickerProps = {
  attr: Partial<PostAttr>;
  selectedValue?: string;
  availableValues: Set<string>;
  onSelect: (value: string) => void;
};

function thumbUrl(value: Partial<PostAttrValue>) {
  const src = value.image || value.images?.[0];
  if (!src) return null;
  if (src.startsWith("http")) return src;
  return `${cdnBaseUrl}/file/thumbnail/${src}`;
}

export default function PostAttrPicker({
  attr,
  selectedValue,
  availableValues,
  onSelect,
}: PostAttrPickerProps) {
  const values = [...(attr.postAttrValues ?? [])].sort(
    (a, b) => (a.orderNumber ?? 0) - (b.orderNumber ?? 0),
  );

  if (!values.length) return null;

  const isImage = attr.viewType === "image" || attr.viewType === "iconText";

  return (
    <section className="mx-3 rounded-2xl border border-gray-200 bg-white px-3 py-3">
      <h3 className="mb-2.5 text-[15px] font-bold text-gray-900">
        {attr.attrName}
      </h3>

      {isImage ? (
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {values.map((v) => {
            const value = v.value ?? "";
            const selected = selectedValue === value;
            const enabled = availableValues.has(value);
            const src = thumbUrl(v);

            return (
              <button
                key={v.id ?? value}
                type="button"
                disabled={!enabled}
                onClick={() => onSelect(value)}
                className={[
                  "h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-gray-50",
                  selected ? "border-select" : "border-transparent",
                  enabled ? "" : "opacity-40",
                ].join(" ")}
              >
                {src ? (
                  <img
                    src={src}
                    alt={value}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center text-[10px] text-gray-500">
                    {value}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {values.map((v) => {
            const value = v.value ?? "";
            const selected = selectedValue === value;
            const enabled = availableValues.has(value);

            return (
              <button
                key={v.id ?? value}
                type="button"
                disabled={!enabled}
                onClick={() => onSelect(value)}
                className={[
                  "inline-flex items-center gap-1.5 rounded-full border-2 px-4 py-2 text-sm font-medium",
                  selected
                    ? "border-select bg-white text-gray-900"
                    : "border-gray-200 bg-white text-gray-800",
                  enabled ? "" : "opacity-40",
                ].join(" ")}
              >
                {value}
                {selected ? (
                  <CheckIcon className="h-4 w-4 text-select" />
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
