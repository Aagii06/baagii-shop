"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { clearCartError } from "@/store/cartUiSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

// Transient bottom toast for cart mutation errors (out of stock, network,
// ...). `error` is either an i18n key ("cart.error.*") or a raw message
// from the backend; `t` returns the key/string unchanged when unknown.
export default function CartErrorToast() {
  const { t } = useLanguage();
  const dispatch = useAppDispatch();
  const error = useAppSelector((state) => state.cartUi.error);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => dispatch(clearCartError()), 4000);
    return () => clearTimeout(timer);
  }, [error, dispatch]);

  if (!error) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <button
        onClick={() => dispatch(clearCartError())}
        className="flex items-center gap-2 rounded-xl bg-destructive px-4 py-3 text-sm font-medium text-destructive-foreground shadow-lg max-w-md text-left"
      >
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>{t(error)}</span>
      </button>
    </div>
  );
}
