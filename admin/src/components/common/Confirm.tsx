"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CircleAlert, Trash2 } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from "react";

interface ConfirmOptions {
  title: string;
  description?: React.ReactNode;
  /** The confirming button's label (default "Тийм"). */
  confirmLabel?: string;
  /** `danger` for deleting and the like: red button, bin icon. */
  tone?: "danger" | "default";
}

type Confirm = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<Confirm | null>(null);

/**
 * An "are you sure?" modal in place of `window.confirm`. `useConfirm()`
 * returns a function that opens it and resolves `true` on the confirming
 * button, `false` on "Болих", Esc or a tap outside.
 */
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const [request, setRequest] = useState<(ConfirmOptions & { resolve: (ok: boolean) => void }) | null>(null);

  const confirm = useCallback<Confirm>(
    (options) => new Promise((resolve) => setRequest({ ...options, resolve })),
    []
  );

  useEffect(() => {
    if (request) dialogRef.current?.showModal();
  }, [request]);

  function close(ok: boolean) {
    request?.resolve(ok);
    dialogRef.current?.close();
    setRequest(null);
  }

  const danger = request?.tone === "danger";

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <dialog
        ref={dialogRef}
        role="alertdialog"
        aria-labelledby={titleId}
        aria-describedby={request?.description ? descriptionId : undefined}
        // Esc: close through `close` so the promise resolves.
        onCancel={(e) => {
          e.preventDefault();
          close(false);
        }}
        // A tap on the backdrop lands on the dialog itself, not its content.
        onClick={(e) => {
          if (e.target === e.currentTarget) close(false);
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-3xl bg-white p-0 text-foreground shadow-soft transition duration-150 ease-out backdrop:bg-black/40 starting:open:scale-95 starting:open:opacity-0"
      >
        {request && (
          <div className="p-6 text-center">
            <span
              className={cn(
                "mx-auto grid size-12 place-items-center rounded-full",
                danger ? "bg-destructive/10 text-destructive" : "bg-primary-soft text-primary-ink"
              )}
            >
              {danger ? <Trash2 className="size-5" /> : <CircleAlert className="size-5" />}
            </span>
            <h2 id={titleId} className="mt-4 text-[17px] font-bold">
              {request.title}
            </h2>
            {request.description && (
              <p id={descriptionId} className="mt-1.5 text-sm text-muted-foreground">
                {request.description}
              </p>
            )}
            <div className="mt-6 grid grid-cols-2 gap-2">
              {/* Focused first, so Enter doesn't delete by accident. */}
              <Button variant="outline" autoFocus onClick={() => close(false)}>
                Болих
              </Button>
              <Button variant={danger ? "destructive" : "default"} onClick={() => close(true)}>
                {request.confirmLabel ?? "Тийм"}
              </Button>
            </div>
          </div>
        )}
      </dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used inside <ConfirmProvider>");
  return ctx;
}
