import { CartIcon } from "../../../layout/main/bottom/icons";
import { formatMoney } from "../../../../utils/helper";
import type Category from "../../../../models/eshop/Category";
import PostCategoryBadge from "../PostCategoryBadge";
import { BoxIcon, MinusIcon, MoneyIcon, PlusIcon } from "./icons";

type PostBuyPanelProps = {
  title: string;
  category?: Category | null;
  price: number;
  remain: number;
  qty: number;
  onQtyChange: (qty: number) => void;
  onAddToCart: () => void;
  loading?: boolean;
  disabled?: boolean;
};

export default function PostBuyPanel({
  title,
  category,
  price,
  remain,
  qty,
  onQtyChange,
  onAddToCart,
  loading = false,
  disabled = false,
}: PostBuyPanelProps) {
  return (
    <div className="shrink-0 border-t border-gray-100 bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
      <h2 className="text-[17px] font-bold leading-snug text-gray-900">
        {title}
      </h2>
      {category?.name ? (
        <div className="mt-1">
          <PostCategoryBadge category={category} />
        </div>
      ) : null}

      <div className="mt-2.5 flex gap-2">
        <div className="flex flex-1 items-center gap-1.5 rounded-full bg-gray-100 px-3 py-2 text-sm text-gray-700">
          <MoneyIcon className="h-4 w-4 shrink-0 text-gray-500" />
          <span>Үнэ: {formatMoney(price)}</span>
        </div>
        <div className="flex flex-1 items-center gap-1.5 rounded-full bg-gray-100 px-3 py-2 text-sm text-gray-700">
          <BoxIcon className="h-4 w-4 shrink-0 text-gray-500" />
          <span>Үлдэгдэл: {formatMoney(remain)}</span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm text-gray-700">Тоо ширхэг:</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Хасах"
            disabled={qty <= 1 || loading}
            onClick={() => onQtyChange(Math.max(1, qty - 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-800 text-gray-800 disabled:opacity-30"
          >
            <MinusIcon className="h-4 w-4" />
          </button>
          <span className="min-w-6 text-center text-base font-semibold">
            {qty}
          </span>
          <button
            type="button"
            aria-label="Нэмэх"
            disabled={qty >= remain || loading}
            onClick={() => onQtyChange(Math.min(remain, qty + 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-800 text-gray-800 disabled:opacity-30"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onAddToCart}
        disabled={disabled || loading}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3.5 text-[15px] font-semibold text-white active:bg-brand-dark disabled:opacity-50"
      >
        {loading ? "Нэмж байна…" : "Сагслах"}
        {!loading ? <CartIcon className="h-5 w-5" /> : null}
      </button>
    </div>
  );
}
