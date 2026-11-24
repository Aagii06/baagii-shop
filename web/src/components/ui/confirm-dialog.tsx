"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

interface ConfirmDialogProps {
  title: string;
  description?: React.ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  /** Red confirm button and icon, for destructive actions. */
  danger?: boolean;
  /** Spins the confirm button and locks the dialog while the action runs. */
  busy?: boolean;
  /** Shown under the description, e.g. the backend's reason it failed. */
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

/** Asks "are you sure?" before an action. Escape / backdrop closes it unless busy. */
export default function ConfirmDialog({
  title,
  description,
  confirmLabel,
  cancelLabel,
  danger = false,
  busy = false,
  error,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [busy, onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="absolute inset-0 bg-black/50 animate-in fade-in" onClick={busy ? undefined : onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl animate-in fade-in zoom-in-95">
        <span
          className={
            danger
              ? "grid h-11 w-11 place-items-center rounded-full bg-destructive/10 text-destructive"
              : "grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary"
          }
        >
          <AlertTriangle className="h-5 w-5" />
        </span>
        <h2 id="confirm-dialog-title" className="mt-4 text-lg font-bold text-foreground">
          {title}
        </h2>
        {description && <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>}
        {error && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button type="button" variant={danger ? "destructive" : "default"} onClick={onConfirm} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
