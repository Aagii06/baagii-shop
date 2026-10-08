import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AddressDialog } from "../components/custom/address";
import {
  CheckoutAddressPicker,
  CheckoutNotePicker,
  CheckoutOrderNote,
  CheckoutProductStrip,
  DeliveryTypePicker,
  PaymentMethodPicker,
  type DeliveryType,
} from "../components/custom/checkout";
import { ChevronLeftIcon } from "../components/custom/post/detail";
import { ChevronRightIcon } from "../components/layout/main/bottom/icons";
import { useAuth } from "../hooks/useAuth";
import type CustomerAddress from "../models/customerAddress/CustomerAddress";
import type DONote from "../models/delivery/DONote";
import type Cart from "../models/eshop/Cart";
import type CTPaymentMethod from "../models/eshop/CTPaymentMethod";
import {
  getActiveCarts,
  createPaymentAndInvoice,
} from "../services/cartService";
import { getCustomerAddresses } from "../services/customerAddressService";
import { getDONotes } from "../services/doNoteService";
import { formatMoney } from "../utils/helper";

const FALLBACK_PAYMENTS: Partial<CTPaymentMethod>[] = [
  {
    id: 1,
    name: "QPay",
    description: "QR код уншуулан төлөх",
    paymentMethodId: "qpay",
  },
  {
    id: 2,
    name: "Банкны данс",
    description: "Шилжүүлэг хийх",
    paymentMethodId: "bank",
    bankName: "Хаан банк",
    bankAccountOwner: "LTE ESHOP LLC",
    bankAccountNo: "5123456789",
    bankAccountIban: "MN12 0005 1234 5678 90",
  },
];

export function CheckoutPage() {
  const { cartId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("delivery");
  const [paymentId, setPaymentId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [addressesError, setAddressesError] = useState<string | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null,
  );
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [notes, setNotes] = useState<DONote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [selectedNoteIds, setSelectedNoteIds] = useState<number[]>([]);
  const [orderNote, setOrderNote] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      const res = await getActiveCarts();
      if (cancelled) return;

      const found =
        res.success && res.data
          ? (res.data.rows ?? []).find((c) => String(c.id) === String(cartId))
          : undefined;
      setCart(found ?? null);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [cartId]);

  useEffect(() => {
    if (!user) {
      setAddresses([]);
      setAddressesError(null);
      setAddressesLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setAddressesLoading(true);
      setAddressesError(null);
      const res = await getCustomerAddresses();
      if (cancelled) return;

      if (!res.success || !res.data) {
        setAddressesError(res.message || "Хаяг ачааллахад алдаа гарлаа.");
        setAddresses([]);
      } else {
        setAddresses(res.data.rows ?? []);
      }
      setAddressesLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setNotesLoading(true);
      setNotesError(null);
      const res = await getDONotes();
      if (cancelled) return;

      if (!res.success || !res.data) {
        setNotesError(res.message || "Тэмдэглэл ачааллахад алдаа гарлаа.");
        setNotes([]);
      } else {
        setNotes(res.data.rows ?? []);
      }
      setNotesLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const methods = useMemo(() => {
    const fromCart = cart?.cartType?.ctPaymentMethods?.filter(
      (m) => m.id != null,
    );
    return fromCart && fromCart.length > 0 ? fromCart : FALLBACK_PAYMENTS;
  }, [cart]);

  useEffect(() => {
    if (paymentId == null && methods[0]?.id != null) {
      setPaymentId(methods[0].id);
    }
  }, [methods, paymentId]);

  useEffect(() => {
    if (selectedAddressId != null) return;
    const main = addresses.find((a) => a.isMain);
    const nextId = main?.id ?? addresses[0]?.id;
    if (nextId != null) setSelectedAddressId(nextId);
  }, [addresses, selectedAddressId]);

  const items = cart?.cartDetails ?? [];
  const amount = Number(cart?.amount) || 0;
  const selectedMethod = methods.find((m) => m.id === paymentId);
  const needsAddress = deliveryType === "delivery";
  const canContinue =
    paymentId != null &&
    !submitting &&
    (!needsAddress || selectedAddressId != null);

  const handleAddressSaved = (address: CustomerAddress) => {
    setAddresses((prev) => {
      if (prev.some((item) => item.id === address.id)) return prev;
      return [address, ...prev];
    });
    setSelectedAddressId(address.id);
  };

  const handleNoteToggle = (id: number) => {
    setSelectedNoteIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleContinue = async () => {
    if (!cartId || paymentId == null || submitting) return;
    if (needsAddress && selectedAddressId == null) return;

    setSubmitting(true);
    setSubmitError(null);
    const res = await createPaymentAndInvoice({
      cartId,
      ctPaymentMethodId: paymentId,
      deliveryOrder:
        needsAddress && selectedAddressId != null
          ? {
              customerAddressId: selectedAddressId,
              notes: selectedNoteIds,
              note: orderNote.trim() || undefined,
            }
          : null,
    });
    setSubmitting(false);

    if (!res.success || !res.data?.invoice) {
      setSubmitError(res.message || "Нэхэмжлэх үүсгэхэд алдаа гарлаа.");
      return;
    }

    const invoice = res.data.invoice;
    const orders = res.data.orders ?? [];
    const kind = (
      invoice.paymentMethodId || selectedMethod?.paymentMethodId
    )?.toLowerCase();
    const state = {
      amount: Number(invoice.amount) || amount,
      method: selectedMethod,
      invoice,
      orders,
    };

    if (kind === "qpay" || invoice.qpayInvoice) {
      navigate(`/cart/${cartId}/pay/qpay`, { state });
      return;
    }
    if (kind === "bank") {
      navigate(`/cart/${cartId}/pay/bank`, { state });
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-surface">
      <header className="relative flex h-14 shrink-0 items-center justify-center bg-brand px-12 text-white">
        <button
          type="button"
          aria-label="Буцах"
          onClick={() => navigate(-1)}
          className="absolute left-3 top-1/2 -translate-y-1/2 p-1"
        >
          <ChevronLeftIcon className="h-6 w-6" />
        </button>
        <h1 className="truncate text-[17px] font-semibold tracking-wide">
          Захиалга
        </h1>
      </header>

      {loading ? (
        <p className="py-12 text-center text-sm text-gray-400">Ачаалж байна…</p>
      ) : (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto px-3 pt-3 pb-4">
            <div className="flex flex-col gap-5">
              <DeliveryTypePicker
                value={deliveryType}
                onChange={setDeliveryType}
              />
              {needsAddress ? (
                <CheckoutAddressPicker
                  loggedIn={Boolean(user)}
                  addresses={addresses}
                  selectedId={selectedAddressId}
                  loading={addressesLoading}
                  error={addressesError}
                  onSelect={setSelectedAddressId}
                  onAdd={() => setAddressDialogOpen(true)}
                />
              ) : null}
              {needsAddress ? (
                <CheckoutNotePicker
                  notes={notes}
                  selectedIds={selectedNoteIds}
                  loading={notesLoading}
                  error={notesError}
                  onToggle={handleNoteToggle}
                />
              ) : null}
              {needsAddress ? (
                <CheckoutOrderNote value={orderNote} onChange={setOrderNote} />
              ) : null}
              <CheckoutProductStrip items={items} />
              <PaymentMethodPicker
                methods={methods}
                selectedId={paymentId}
                onSelect={setPaymentId}
              />
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-2 bg-white px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {submitError ? (
              <p className="text-center text-xs text-danger">{submitError}</p>
            ) : null}
            <div className="flex items-center justify-between gap-3">
              <p className="text-xl font-bold text-brand">
                {formatMoney(amount)}₮
              </p>
              <button
                type="button"
                onClick={() => void handleContinue()}
                disabled={!canContinue}
                className="flex items-center gap-1 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white active:bg-brand-dark disabled:opacity-40"
              >
                {submitting ? "Үүсгэж байна…" : "Үргэлжлүүлэх"}
                {!submitting ? <ChevronRightIcon className="h-4 w-4" /> : null}
              </button>
            </div>
          </div>
        </>
      )}

      <AddressDialog
        open={addressDialogOpen}
        onClose={() => setAddressDialogOpen(false)}
        onSaved={handleAddressSaved}
      />
    </div>
  );
}
