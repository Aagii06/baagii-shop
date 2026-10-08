import type Cart from "../../../../models/eshop/Cart";
import type CartDetail from "../../../../models/eshop/CartDetail";
import { StoreIcon, TrashIcon } from "../../../layout/main/bottom/icons";
import CartItemRow from "./CartItemRow";
import CartPayBar, { cartAmount } from "./CartPayBar";

type CartGroupProps = {
  cart: Cart;
  showPayFooter?: boolean;
  onDeleteCart?: (cartId: string) => void;
  onPay?: (cart: Cart) => void;
  onQtyChange?: (item: Partial<CartDetail>, qty: number) => void;
  onRemoveItem?: (item: Partial<CartDetail>) => void;
  busyItemId?: string | number | null;
};

export default function CartGroup({
  cart,
  showPayFooter = true,
  onDeleteCart,
  onPay,
  onQtyChange,
  onRemoveItem,
  busyItemId,
}: CartGroupProps) {
  const details = cart.cartDetails ?? [];
  const title =
    cart.name ||
    [cart.company?.name, cart.cartType?.name].filter(Boolean).join(" · ") ||
    "Сагс";

  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-3 py-3">
        <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-gray-800">
          <StoreIcon className="h-5 w-5 shrink-0 text-brand" />
          <span className="truncate">{title}</span>
        </div>
        <button
          type="button"
          onClick={() => onDeleteCart?.(cart.id)}
          className="flex shrink-0 items-center gap-1 rounded-md bg-danger-bg px-2.5 py-1 text-xs font-medium text-danger"
        >
          <TrashIcon className="h-3.5 w-3.5" />
          Устгах
        </button>
      </div>

      {details.length === 0 ? (
        <p className="px-3 py-6 text-center text-sm text-gray-400">
          Хоосон сагс
        </p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {details.map((item) => (
            <CartItemRow
              key={item.id}
              item={item}
              busy={busyItemId != null && busyItemId === item.id}
              onQtyChange={onQtyChange}
              onRemove={onRemoveItem}
            />
          ))}
        </ul>
      )}

      {showPayFooter ? (
        <CartPayBar
          amount={cartAmount(cart)}
          onPay={() => onPay?.(cart)}
          className="border-t border-gray-100 px-3"
        />
      ) : null}
    </section>
  );
}
