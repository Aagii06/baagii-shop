"use client";

import OrderProgress from "@/components/orders/OrderProgress";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import { Button } from "@/components/ui/button";
import PlaceholderImage from "@/components/ui/placeholder-image";
import { formatMNT } from "@/lib/utils";
import { useAppSelector } from "@/store/hooks";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

const deliveryLabels: Record<string, string> = {
  city: "Хотын хүргэлт, 1-2 хоног",
  region: "Орон нутаг, шуудан, 3-5 хоног",
};

export default function OrderDetailPage() {
  const { orderId } = useParams();

  const order = useAppSelector((state) =>
    state.orders.find((order) => order.id === orderId)
  );

  if (!order) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Захиалга олдсонгүй
        </h1>
        <Button asChild>
          <Link href="/orders">Захиалгууд руу очих</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-3xl">
      <Button
        variant="ghost"
        asChild
        className="text-muted-foreground hover:text-foreground mb-4 -ml-4"
      >
        <Link href="/orders" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Захиалгууд руу буцах
        </Link>
      </Button>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            #{order.id}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {new Date(order.createdAt).toLocaleString("mn-MN")}-д үүсгэсэн
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 mb-6">
        <OrderProgress
          status={order.status}
          caption={
            order.status === "confirmed"
              ? "Удахгүй хүргэгдэнэ"
              : "Төлбөр хүлээгдэж байна"
          }
        />
      </div>

      {order.status === "pending" && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-6 flex items-center justify-between gap-4 flex-wrap mb-6">
          <p className="text-sm text-amber-800">
            Энэ захиалгын төлбөр хараахан төлөгдөөгүй байна.
          </p>
          <Button
            asChild
            size="sm"
            className="brand-gradient text-white shrink-0"
          >
            <Link href={`/checkout/${order.id}/pay`}>Одоо төлөх</Link>
          </Button>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Бараа
        </h2>
        <div className="space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-4">
              <PlaceholderImage className="w-16 h-16 rounded-lg shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground line-clamp-1">
                  {item.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatMNT(item.price)} × {item.quantity}
                </p>
              </div>
              <span className="font-semibold text-foreground shrink-0">
                {formatMNT(item.price * item.quantity)}
              </span>
            </div>
          ))}

          <div className="space-y-2 pt-4 border-t border-border">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Барааны дүн</span>
              <span className="font-medium">{formatMNT(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Хүргэлт</span>
              <span className="font-medium">
                {order.shipping === 0 ? "Үнэгүй" : formatMNT(order.shipping)}
              </span>
            </div>
            {order.coupon > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Купон</span>
                <span className="font-medium text-emerald-600">
                  -{formatMNT(order.coupon)}
                </span>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-3 border-t border-border">
            <span className="text-lg font-semibold">Нийт дүн</span>
            <span className="text-lg font-bold text-primary">
              {formatMNT(order.total)}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Хүргэлтийн мэдээлэл
        </h2>
        <div className="text-sm text-muted-foreground space-y-1">
          <p className="text-foreground font-medium">
            {order.shippingInfo.fullName}
          </p>
          <p>{order.shippingInfo.phone}</p>
          <p>
            {order.shippingInfo.addressLabel} · {order.shippingInfo.address}
          </p>
          <p>{deliveryLabels[order.shippingInfo.deliveryMethod]}</p>
          {order.shippingInfo.note && <p>Тайлбар: {order.shippingInfo.note}</p>}
        </div>
      </div>
    </div>
  );
}
