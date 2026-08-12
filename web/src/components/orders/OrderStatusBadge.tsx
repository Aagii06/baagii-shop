import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/types/order";

export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  if (status === "confirmed") {
    return (
      <Badge className="bg-green-600 text-white hover:bg-green-600">
        Confirmed
      </Badge>
    );
  }

  return <Badge variant="secondary">Pending Payment</Badge>;
}
