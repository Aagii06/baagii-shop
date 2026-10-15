import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/api/orders";
import { cn } from "@/lib/utils";
import { ORDER_TONE } from "./orderTone";


export default function OrderStatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold",
        ORDER_TONE[status].soft,
        className
      )}
    >
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}
