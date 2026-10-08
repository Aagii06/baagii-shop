import type Cart from "../../../../models/eshop/Cart";
import { formatMoney } from "../../../../utils/helper";
import { ChevronRightIcon } from "../../../layout/main/bottom/icons";

type CartPayBarProps = {
  amount: number;
  onPay?: () => void;
  className?: string;
};

export default function CartPayBar({
  amount,
  onPay,
  className = "",
}: CartPayBarProps) {
  return (
    <div
      className={[
        "flex items-center justify-between gap-3 bg-white px-4 py-3",
        className,
      ].join(" ")}
    >
      <p className="text-xl font-bold text-brand">{formatMoney(amount)}₮</p>
      <button
        type="button"
        onClick={onPay}
        className="flex items-center gap-1 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white active:bg-brand-dark"
      >
        Төлбөр төлөх
        <ChevronRightIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

export function cartAmount(cart: Cart) {
  return Number(cart.amount) || 0;
}
