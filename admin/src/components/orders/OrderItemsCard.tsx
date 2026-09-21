"use client";

import Thumb from "@/components/common/Thumb";
import { useToast } from "@/components/common/Toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  keptQty,
  orderReturnedAmount,
  orderSubtotal,
  orderTotal,
  returnOrderItem,
  type Order,
  type OrderItem,
} from "@/lib/api/orders";
import { cn, formatMNT } from "@/lib/utils";
import { CircleAlert, Minus, Plus, Undo2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1 text-muted-foreground">
      <dt>{label}</dt>
      <dd className="font-mono">{value}</dd>
    </div>
  );
}

/**
 * Modal for sending back some units of one line. A native <dialog> sits in
 * the top layer, so page toasts can't show over it — errors render inline.
 */
function ReturnItemDialog({
  orderId,
  item,
  onClose,
  onReturned,
}: {
  orderId: number;
  item: OrderItem;
  onClose: () => void;
  onReturned: (qty: number) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const max = keptQty(item);
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await returnOrderItem(orderId, item.id, qty);
      onReturned(qty);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Алдаа гарлаа");
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby="return-item-title"
      // Escape fires `cancel`; let the parent unmount us instead of the browser closing.
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      // A click that lands on the <dialog> itself is on the backdrop.
      onClick={(event) => event.target === event.currentTarget && onClose()}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-border bg-card p-0 text-card-foreground shadow-soft backdrop:bg-dark/40"
    >
      <div className="p-5">
        <h2 id="return-item-title" className="text-lg font-extrabold">
          Бараа буцаах
        </h2>

        <div className="mt-4 flex items-center gap-3">
          <Thumb id={item.image} size={44} className="rounded-xl" />
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-bold">{item.name}</span>
            <span className="block font-mono text-xs text-muted-foreground">
              {max} ширхэг · {formatMNT(item.price)}
            </span>
          </span>
        </div>

        <div className="mt-5 flex items-center justify-between rounded-xl bg-muted/60 px-4 py-3">
          <span className="text-sm text-muted-foreground">Буцаах тоо</span>
          {max > 1 ? (
            <span className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Хасах"
                disabled={qty <= 1}
                onClick={() => setQty(qty - 1)}
              >
                <Minus />
              </Button>
              <span aria-live="polite" className="w-9 text-center font-mono text-[15px] font-bold">
                {qty}
              </span>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Нэмэх"
                disabled={qty >= max}
                onClick={() => setQty(qty + 1)}
              >
                <Plus />
              </Button>
            </span>
          ) : (
            <span className="font-mono text-[15px] font-bold">1</span>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between px-1 text-sm">
          <span className="text-muted-foreground">Буцаах дүн</span>
          <span className="font-mono font-bold">{formatMNT(qty * item.price)}</span>
        </div>

        {error && (
          <p role="alert" className="mt-4 flex items-start gap-2 text-sm text-destructive">
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            {error}
          </p>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={onClose}>
            Болих
          </Button>
          <Button variant="destructive" disabled={busy} onClick={submit}>
            Буцаах
          </Button>
        </div>
      </div>
    </dialog>
  );
}

/**
 * The order's lines and totals. While the order isn't returned as a whole,
 * each line with units left has a button that opens the return modal.
 */
export default function OrderItemsCard({ order, onChanged }: { order: Order; onChanged: () => void }) {
  const { show } = useToast();
  const [returning, setReturning] = useState<OrderItem | null>(null);

  const canReturn = order.status !== "returned";
  const returnedAmount = orderReturnedAmount(order);

  return (
    <Card className="overflow-hidden">
      <h2 className="border-b border-border px-4 py-3.5 text-[15px] font-bold">Бараа</h2>
      <ul className="divide-y divide-border">
        {order.items.map((item) => {
          const kept = keptQty(item);
          return (
            <li key={item.id} className="flex items-center gap-3 px-4 py-3">
              <Thumb id={item.image} size={44} className="rounded-xl" />
              <span className="min-w-0 grow">
                <span
                  className={cn(
                    "block truncate text-[15px]",
                    kept === 0 && "text-muted-foreground line-through"
                  )}
                >
                  {item.name}
                </span>
                <span className="block font-mono text-xs text-muted-foreground">
                  {item.qty} × {formatMNT(item.price)}
                </span>
                {item.returnedQty ? (
                  <span className="block text-xs font-semibold text-destructive">
                    {item.returnedQty} ширхэг буцаагдсан
                  </span>
                ) : null}
              </span>
              <span className="shrink-0 font-mono text-sm font-bold">
                {formatMNT(kept * item.price)}
              </span>
              {canReturn && (
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label={`“${item.name}” буцаах`}
                  title="Буцаах"
                  disabled={kept === 0}
                  onClick={() => setReturning(item)}
                >
                  <Undo2 />
                </Button>
              )}
            </li>
          );
        })}
      </ul>
      <dl className="border-t border-border px-4 py-3 text-sm">
        <SummaryRow label="Барааны дүн" value={formatMNT(orderSubtotal(order))} />
        {returnedAmount > 0 && (
          <SummaryRow label="Буцаалт" value={`−${formatMNT(returnedAmount)}`} />
        )}
        <SummaryRow label="Хүргэлт" value={formatMNT(order.deliveryFee)} />
        <div className="mt-2 flex items-center justify-between border-t border-border pt-3">
          <dt className="text-base font-extrabold">Нийт</dt>
          <dd className="font-mono text-lg font-bold">{formatMNT(orderTotal(order))}</dd>
        </div>
      </dl>

      {returning && (
        <ReturnItemDialog
          key={returning.id}
          orderId={order.id}
          item={returning}
          onClose={() => setReturning(null)}
          onReturned={(qty) => {
            show(`“${returning.name}” ${qty} ширхэг буцаагдлаа`);
            setReturning(null);
            onChanged();
          }}
        />
      )}
    </Card>
  );
}
