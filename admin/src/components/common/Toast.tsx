"use client";

import { CircleAlert, CircleCheck } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type Tone = "success" | "error";

interface ToastApi {
  show: (message: string, tone?: Tone) => void;
  /**
   * Runs a mutation and reports the outcome: `success` on resolve, the
   * error's message on reject. Resolves `true` when the action succeeded.
   */
  run: (action: () => Promise<unknown>, success: string) => Promise<boolean>;
}

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ id: number; message: string; tone: Tone } | null>(null);

  const show = useCallback((message: string, tone: Tone = "success") => {
    setToast({ id: Date.now(), message, tone });
  }, []);

  const run = useCallback(
    async (action: () => Promise<unknown>, success: string) => {
      try {
        await action();
        show(success);
        return true;
      } catch (err) {
        show(err instanceof Error ? err.message : "Алдаа гарлаа", "error");
        return false;
      }
    },
    [show]
  );

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const api = useMemo(() => ({ show, run }), [show, run]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* Sits above the bottom nav / action bar. */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 px-4"
      >
        {toast && (
          <p
            key={toast.id}
            role={toast.tone === "error" ? "alert" : "status"}
            className="mx-auto flex max-w-sm items-start gap-2.5 rounded-2xl bg-dark px-4 py-3 text-sm font-semibold text-dark-foreground shadow-soft"
          >
            {toast.tone === "error" ? (
              <CircleAlert className="mt-0.5 size-4 shrink-0 text-primary" />
            ) : (
              <CircleCheck className="mt-0.5 size-4 shrink-0 text-success-soft" />
            )}
            {toast.message}
          </p>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
