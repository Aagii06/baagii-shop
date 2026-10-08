import type Cart from "../../../../models/eshop/Cart";
import type CartDetail from "../../../../models/eshop/CartDetail";
import CartGroup from "./CartGroup";
import CartPayBar, { cartAmount } from "./CartPayBar";

type CartListProps = {
  carts: Cart[];
  loading?: boolean;
  error?: string | null;
  onDeleteCart?: (cartId: string) => void;
  onPay?: (cart: Cart) => void;
  onQtyChange?: (item: Partial<CartDetail>, qty: number) => void;
  onRemoveItem?: (item: Partial<CartDetail>) => void;
  busyItemId?: string | number | null;
};

export default function CartList({
  carts,
  loading,
  error,
  onDeleteCart,
  onPay,
  onQtyChange,
  onRemoveItem,
  busyItemId,
}: CartListProps) {
  if (loading) {
    return (
      <p className="py-8 text-center text-sm text-gray-400">Ачаалж байна…</p>
    );
  }

  if (error) {
    return <p className="py-8 text-center text-sm text-danger">{error}</p>;
  }

  if (carts.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-400">Сагс хоосон байна</p>
    );
  }

  const singleCart = carts.length === 1;
  const showGroupPay = !singleCart;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pt-3 pb-4">
        <div className="flex flex-col gap-3">
          {carts.map((cart) => (
            <CartGroup
              key={cart.id}
              cart={cart}
              showPayFooter={showGroupPay}
              onDeleteCart={onDeleteCart}
              onPay={onPay}
              onQtyChange={onQtyChange}
              onRemoveItem={onRemoveItem}
              busyItemId={busyItemId}
            />
          ))}
        </div>
      </div>

      {singleCart ? (
        <CartPayBar
          amount={cartAmount(carts[0])}
          onPay={() => onPay?.(carts[0])}
          className="shrink-0 shadow-[0_-2px_8px_rgba(0,0,0,0.04)] pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        />
      ) : null}
    </div>
  );
}
