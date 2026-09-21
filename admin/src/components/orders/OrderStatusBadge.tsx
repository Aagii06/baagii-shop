import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/api/orders";
import { cn } from "@/lib/utils";

const TONE: Record<OrderStatus, string> = {
  pending: "bg-primary-soft text-primary-ink",
  confirmed: "bg-tint-lavender text-tint-lavender-ink",
  delivered: "bg-tint-mint text-tint-mint-ink",
  returned: "bg-muted text-muted-foreground",
};

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
        TONE[status],
        className
      )}
    >
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}
