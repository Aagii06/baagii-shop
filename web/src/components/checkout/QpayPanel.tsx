"use client";

import { Button } from "@/components/ui/button";
import { checkQpay } from "@/lib/api/orders";
import { createQpayInvoice, type QpayInvoice } from "@/lib/api/payment";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatMNT } from "@/lib/utils";
import type { Order } from "@/types/order";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

// How often the page asks the backend whether QPay got the money.
const POLL_MS = 4000;

/**
 * A QPay invoice for the order: a QR to scan with any bank app, or (on a
 * phone) a link straight into one. Polls until the backend sees the payment,
 * then hands the paid order up.
 */
export default function QpayPanel({
  orderId,
  onPaid,
  onBack,
}: {
  orderId: string;
  onPaid: (order: Order) => void;
  onBack: () => void;
}) {
  const { t } = useLanguage();
  const [invoice, setInvoice] = useState<QpayInvoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [notYet, setNotYet] = useState(false);

  useEffect(() => {
    let cancelled = false;
    createQpayInvoice(orderId)
      .then((inv) => !cancelled && setInvoice(inv))
      .catch((err) => !cancelled && setError(err instanceof Error && err.message ? err.message : t("cart.error.generic")));
    return () => {
      cancelled = true;
    };
  }, [orderId, t]);

  const check = useCallback(async () => {
    const order = await checkQpay(orderId);
    if (order.status === "confirmed") onPaid(order);
    return order.status === "confirmed";
  }, [orderId, onPaid]);

  useEffect(() => {
    if (!invoice) return;
    const timer = setInterval(() => check().catch(() => undefined), POLL_MS);
    return () => clearInterval(timer);
  }, [invoice, check]);

  const checkNow = async () => {
    setChecking(true);
    setNotYet(false);
    try {
      if (!(await check())) setNotYet(true);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t("cart.error.generic"));
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">
          {t("checkout.payment.qpay.title")}
        </h2>
        <Button type="button" variant="ghost" size="sm" onClick={onBack}>
          {t("checkout.payment.qpay.back")}
        </Button>
      </div>

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : !invoice ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="flex flex-col items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- QPay returns a base64 PNG */}
            <img
              src={`data:image/png;base64,${invoice.qrImage}`}
              alt={t("checkout.payment.qpay.qrAlt")}
              className="h-56 w-56 rounded-xl border border-border bg-white p-2"
            />
            <p className="text-xl font-bold text-primary">{formatMNT(invoice.amount)}</p>
            <p className="text-sm text-muted-foreground text-center">
              {t("checkout.payment.qpay.scan")}
            </p>
          </div>

          {invoice.urls.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                {t("checkout.payment.qpay.apps")}
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {invoice.urls.map((app) => (
                  <a
                    key={app.name}
                    href={app.link}
                    className="flex flex-col items-center gap-1 rounded-xl border border-border p-2 text-center hover:border-primary/40"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- bank logos come from QPay */}
                    <img src={app.logo} alt="" className="h-9 w-9 rounded-lg" />
                    <span className="text-[11px] leading-tight text-foreground line-clamp-2">
                      {app.description || app.name}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Button type="button" variant="outline" className="w-full" onClick={checkNow} disabled={checking}>
              {checking ? t("checkout.summary.processing") : t("checkout.payment.qpay.check")}
            </Button>
            {notYet && (
              <p className="text-xs text-muted-foreground text-center">
                {t("checkout.payment.qpay.notYet")}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
