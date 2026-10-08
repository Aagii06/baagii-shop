import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  PayAmountCard,
  PayCheckBar,
  PayPageHeader,
  QpayDeeplinkList,
  QpayQrCard,
} from "../components/custom/pay";
import { qpayResFromInvoice } from "../components/custom/pay/qpayFromInvoice";
import type { PayLocationState } from "../components/custom/pay/payState";
import { checkOrders } from "../services/orderService";

const POLL_MS = 10_000;

export function QpayPayPage() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state?: PayLocationState };
  const invoice = state?.invoice;
  const orders = state?.orders;
  const orderIds = useMemo(
    () => (orders ?? []).map((order) => order.id),
    [orders],
  );
  const amount = Number(invoice?.amount ?? state?.amount) || 0;
  const qpay = qpayResFromInvoice(invoice);

  const [checking, setChecking] = useState(false);
  const [checkMessage, setCheckMessage] = useState<string | null>(null);
  const [checkDanger, setCheckDanger] = useState(false);
  const inFlight = useRef(false);
  const stopped = useRef(false);

  const runCheck = useCallback(
    async (fromUser: boolean) => {
      if (stopped.current || inFlight.current) return;

      if (orderIds.length === 0) {
        if (fromUser) {
          setCheckDanger(true);
          setCheckMessage("Захиалгын мэдээлэл олдсонгүй.");
        }
        return;
      }

      inFlight.current = true;
      if (fromUser) {
        setChecking(true);
        setCheckMessage(null);
        setCheckDanger(false);
      }

      const res = await checkOrders(orderIds);
      inFlight.current = false;
      if (fromUser) setChecking(false);
      if (stopped.current) return;

      if (!res.success || !res.data) {
        if (fromUser) {
          setCheckDanger(true);
          setCheckMessage(res.message || "Төлбөр шалгахад алдаа гарлаа.");
        }
        return;
      }

      if (res.data.status === "confirmed") {
        stopped.current = true;
        navigate("/orders", { replace: true });
        return;
      }

      if (res.data.status === "cancelled") {
        stopped.current = true;
        setCheckDanger(true);
        setCheckMessage("Захиалга цуцлагдсан байна.");
        return;
      }

      setCheckDanger(false);
      setCheckMessage("Төлбөр хүлээгдэж байна. Автоматаар шалгана.");
    },
    [navigate, orderIds],
  );

  useEffect(() => {
    stopped.current = false;
    void runCheck(false);
    const timer = window.setInterval(() => {
      if (!stopped.current) void runCheck(false);
    }, POLL_MS);

    return () => {
      stopped.current = true;
      window.clearInterval(timer);
    };
  }, [runCheck]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-surface">
      <PayPageHeader title="QPay төлбөр" onBack={() => navigate(-1)} />

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pt-3 pb-4">
        <div className="flex flex-col gap-4">
          <PayAmountCard amount={amount} />
          <QpayQrCard qrImage={qpay?.qr_image} qrText={qpay?.qr_text} />
          <QpayDeeplinkList urls={qpay?.urls ?? []} />
        </div>
      </div>

      <PayCheckBar
        checking={checking}
        message={checkMessage}
        messageDanger={checkDanger}
        onCheck={() => void runCheck(true)}
      />
    </div>
  );
}
