import type CartDetail from "../../../../models/eshop/CartDetail";
import { cdnBaseUrl } from "../../../../constant/config";
import { formatMoney } from "../../../../utils/helper";
import { TrashIcon } from "../../../layout/main/bottom/icons";
import { MinusIcon, PlusIcon } from "../../post/detail/icons";

type CartItemRowProps = {
  item: Partial<CartDetail>;
  onQtyChange?: (item: Partial<CartDetail>, qty: number) => void;
  onRemove?: (item: Partial<CartDetail>) => void;
  busy?: boolean;
};

function imageUrl(src?: string) {
  if (!src) return null;
  if (src.startsWith("http")) return src;
  return `${cdnBaseUrl}/file/thumbnail/${src}`;
}

export default function CartItemRow({
  item,
  onQtyChange,
  onRemove,
  busy = false,
}: CartItemRowProps) {
  const qty = Number(item.qty) || 0;
  const price = Number(item.price) || 0;
  const title = item.variantName || item.productName || "—";
  const subtitle = item.productName || item.variantCode || "";
  const src = imageUrl(item.image);

  return (
    <li className="flex gap-3 px-3 py-3">
      <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-md bg-gray-100">
        {src ? (
          <img src={src} alt="" className="h-full w-full object-cover" />
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">
              {title}
            </p>
            {subtitle ? (
              <p className="mt-0.5 truncate text-xs text-gray-400">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            aria-label="Устгах"
            disabled={busy}
            onClick={() => onRemove?.(item)}
            className="shrink-0 p-0.5 text-gray-700 disabled:opacity-40"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-2 flex items-end justify-between">
          <p className="text-sm font-bold text-gray-900">
            {formatMoney(price)}₮
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Хасах"
              disabled={busy || qty <= 1}
              onClick={() => onQtyChange?.(item, Math.max(1, qty - 1))}
              className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-800 text-gray-800 disabled:opacity-30"
            >
              <MinusIcon className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-4 text-center text-sm font-medium">{qty}</span>
            <button
              type="button"
              aria-label="Нэмэх"
              disabled={busy}
              onClick={() => onQtyChange?.(item, qty + 1)}
              className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-800 text-gray-800 disabled:opacity-30"
            >
              <PlusIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}
