import { cdnBaseUrl } from "../../../constant/config";
import type CartDetail from "../../../models/eshop/CartDetail";
import { formatMoney } from "../../../utils/helper";

type CheckoutProductStripProps = {
  items: Partial<CartDetail>[];
};

function imageUrl(src?: string) {
  if (!src) return null;
  if (src.startsWith("http")) return src;
  return `${cdnBaseUrl}/file/thumbnail/${src}`;
}

export default function CheckoutProductStrip({
  items,
}: CheckoutProductStripProps) {
  return (
    <section>
      <h2 className="mb-2 px-0.5 text-[15px] font-semibold text-gray-900">
        Бараа ({items.length})
      </h2>
      {items.length === 0 ? (
        <p className="rounded-2xl bg-white px-3 py-8 text-center text-sm text-gray-400 shadow-sm">
          Бараа алга
        </p>
      ) : (
        <div className="-mx-3 overflow-x-auto scrollbar-none">
          <ul className="flex gap-2.5 px-3">
            {items.map((item, i) => {
              const src = imageUrl(item.image);
              const title = item.variantName || item.productName || "—";
              return (
                <li
                  key={item.id ?? i}
                  className="w-[120px] shrink-0 rounded-2xl bg-white p-2 shadow-sm"
                >
                  <div className="aspect-square overflow-hidden rounded-xl bg-gray-100">
                    {src ? (
                      <img
                        src={src}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <p className="mt-1.5 line-clamp-2 min-h-[2rem] text-[11px] font-semibold leading-tight text-gray-900">
                    {title}
                  </p>
                  <p className="mt-1 text-[11px] text-gray-500">
                    {Number(item.qty) || 0} ш
                  </p>
                  <p className="text-xs font-bold text-brand">
                    {formatMoney(Number(item.price) || 0)}₮
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
