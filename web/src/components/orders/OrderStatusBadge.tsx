import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/types/order";

export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  if (status === "confirmed") {
    return (
      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-transparent">
        Бэлтгэгдэж байна
      </Badge>
    );
  }

  return (
    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-transparent">
      Төлбөр хүлээгдэж байна
    </Badge>
  );
}
