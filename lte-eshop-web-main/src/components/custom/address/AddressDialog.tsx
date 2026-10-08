import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type CustomerAddress from "../../../models/customerAddress/CustomerAddress";
import type { CustomerAddressWrite } from "../../../models/customerAddress/CustomerAddress";
import { createCustomerAddress } from "../../../services/customerAddressService";
import { CloseIcon } from "../category/icons";
import AddressForm from "./AddressForm";

type AddressDialogProps = {
  open: boolean;
  onClose: () => void;
  onSaved: (address: CustomerAddress) => void;
};

export default function AddressDialog({
  open,
  onClose,
  onSaved,
}: AddressDialogProps) {
  const [present, setPresent] = useState(open);
  const [entered, setEntered] = useState(false);
  const [shell, setShell] = useState<Element | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setShell(document.querySelector(".app-shell"));
  }, []);

  useEffect(() => {
    if (open) {
      setPresent(true);
      setError(null);
      setSubmitting(false);
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setEntered(true));
      });
      return () => cancelAnimationFrame(id);
    }
    setEntered(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleSubmit = async (data: CustomerAddressWrite) => {
    setSubmitting(true);
    setError(null);
    const res = await createCustomerAddress(data);
    setSubmitting(false);

    if (!res.success || !res.data) {
      setError(res.message || "Хаяг хадгалахад алдаа гарлаа.");
      return;
    }

    onSaved(res.data);
    onClose();
  };

  if (!present || !shell) return null;

  return createPortal(
    <div className="absolute inset-0 z-50">
      <button
        type="button"
        aria-label="Хаах"
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
          entered ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Хаяг нэмэх"
        onTransitionEnd={() => {
          if (!open) setPresent(false);
        }}
        className={`absolute inset-x-0 bottom-0 top-8 flex flex-col overflow-hidden rounded-t-2xl bg-surface shadow-2xl transition-transform duration-300 ease-out ${
          entered ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <header className="flex h-14 shrink-0 items-center justify-between bg-brand px-4 text-white">
          <h2 className="text-[17px] font-semibold tracking-wide">Хаяг нэмэх</h2>
          <button
            type="button"
            aria-label="Хаах"
            onClick={onClose}
            className="rounded-full p-1 hover:bg-white/15"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </header>
        <AddressForm
          key={open ? "open" : "closed"}
          submitting={submitting}
          error={error}
          submitLabel="Хадгалах"
          onSubmit={(data) => void handleSubmit(data)}
        />
      </div>
    </div>,
    shell,
  );
}
