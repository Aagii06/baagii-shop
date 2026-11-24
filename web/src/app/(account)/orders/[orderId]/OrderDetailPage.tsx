"use client";

import OrderProgress from "@/components/orders/OrderProgress";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import PayDeadlineNotice from "@/components/orders/PayDeadlineNotice";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import PlaceholderImage from "@/components/ui/placeholder-image";
import { cancelMyOrder } from "@/lib/api/orders";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatDateTime, formatMNT } from "@/lib/utils";
import { useOrderStore } from "@/store/orderStore";
import PageLoader from "@/components/ui/page-loader";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouteId } from "@/lib/useRouteId";
import { useState } from "react";

export default function OrderDetailPage() {
  const { t, locale } = useLanguage();
  const orderId = useRouteId("orderId", 1);

  const ordersLoaded = useOrderStore((s) => s.loaded);
  const replaceOrder = useOrderStore((s) => s.replaceOrder);
  // Cancelling: only a waiting, unpaid order ("pending" here) — the backend checks it too.
  const [askCancel, setAskCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const order = useOrderStore((s) =>
    s.orders.find((order) => order.id === orderId)
  );

  if (!ordersLoaded) {
    return <PageLoader className="px-0 py-0 sm:py-0" />;
  }

  if (!order) {
    return (
      <div className="py-10 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {t("orders.detailPage.notFound")}
        </h1>
        <Button asChild>
          <Link href="/orders">{t("orders.detailPage.goToOrders")}</Link>
        </Button>
      </div>
    );
  }

  const deliveryLabel = t("orders.delivery.standard");
  const shownId = order.id;

  const handleCancel = async () => {
    setCancelling(true);
    setCancelError(null);
    try {
      replaceOrder(await cancelMyOrder(shownId));
      setAskCancel(false);
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : t("orders.cancel.error"));
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <Button
        variant="ghost"
        asChild
        className="text-muted-foreground hover:text-foreground mb-4 -ml-4"
      >
        <Link href="/orders" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          {t("orders.detailPage.back")}
        </Link>
      </Button>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {order.id}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("orders.detailPage.placedAt", {
              date: formatDateTime(order.createdAt, locale),
            })}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 mb-6">
        <OrderProgress
          status={order.status}
          caption={
            t(`orders.caption.${order.status}`)
          }
        />
      </div>

      {order.status === "pending" && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-6 flex items-center justify-between gap-4 flex-wrap mb-6">
          <p className="text-sm text-amber-800">
            {t("orders.detailPage.unpaidNotice")}
          </p>
          <div className="flex shrink-0 gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-amber-300 bg-white text-destructive hover:bg-destructive/5 hover:text-destructive"
              onClick={() => {
                setCancelError(null);
                setAskCancel(true);
              }}
            >
              {t("orders.cancel.button")}
            </Button>
            <Button
              asChild
              size="sm"
              className="brand-gradient text-white"
            >
              <Link href={`/checkout/${order.id}/pay`}>
                {t("orders.detailPage.payNow")}
              </Link>
            </Button>
          </div>
        </div>
      )}

      {order.status === "pending" && (
        <PayDeadlineNotice
          deadline={order.payDeadline}
          hours={order.unpaidCancelHours}
          className="-mt-3 mb-6"
        />
      )}

      {askCancel && (
        <ConfirmDialog
          danger
          title={t("orders.cancel.title", { id: order.id })}
          description={t("orders.cancel.desc")}
          confirmLabel={t("orders.cancel.confirm")}
          cancelLabel={t("orders.cancel.keep")}
          busy={cancelling}
          error={cancelError}
          onConfirm={handleCancel}
          onClose={() => setAskCancel(false)}
        />
      )}

      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          {t("orders.detailPage.itemsTitle")}
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
              <span className="text-muted-foreground">
                {t("cart.summary.subtotal")}
              </span>
              <span className="font-medium">{formatMNT(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {t("cart.summary.shipping")}
              </span>
              <span className="font-medium">
                {order.shipping === 0
                  ? t("cart.summary.free")
                  : formatMNT(order.shipping)}
              </span>
            </div>
            {order.coupon > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {t("cart.summary.couponGeneric")}
                </span>
                <span className="font-medium text-emerald-600">
                  -{formatMNT(order.coupon)}
                </span>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-3 border-t border-border">
            <span className="text-lg font-semibold">
              {t("cart.summary.total")}
            </span>
            <span className="text-lg font-bold text-primary">
              {formatMNT(order.total)}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          {t("orders.detailPage.deliveryInfoTitle")}
        </h2>
        <div className="text-sm text-muted-foreground space-y-1">
          <p className="text-foreground font-medium">
            {order.shippingInfo.fullName}
          </p>
          <p>
            {[order.shippingInfo.phone, order.shippingInfo.extraPhone]
              .filter(Boolean)
              .join(", ")}
          </p>
          <p>
            {order.shippingInfo.addressLabel} · {order.shippingInfo.address}
          </p>
          <p>{deliveryLabel}</p>
          {order.shippingInfo.note && (
            <p>
              {t("orders.detailPage.note", { note: order.shippingInfo.note })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
