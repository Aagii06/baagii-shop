"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";
import { AlertTriangle, Inbox, RotateCw } from "lucide-react";
import Image from "next/image";

/**
 * Loading placeholder as a skeleton of what's coming:
 * - `list` (default): rows like the list pages'
 * - `form`: labelled fields and a save button (edit / new pages)
 * - `detail`: a status card, a few info cards and line items (order detail)
 */
export function LoadingState({
  className,
  variant = "list",
}: {
  className?: string;
  variant?: "list" | "form" | "detail";
}) {
  const { t } = useLanguage();
  const bone = "block rounded-md bg-muted";
  return (
    <div role="status" aria-busy="true" className={cn("animate-pulse pt-2", className)}>
      <span className="sr-only">{t("common.loading")}</span>
      {variant === "form" ? (
        <div className="space-y-5">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="space-y-2">
              <span className={cn(bone, "h-4 w-28")} />
              <span className={cn(bone, i === 2 ? "h-24" : "h-11", "w-full rounded-xl")} />
            </div>
          ))}
          <span className={cn(bone, "h-12 w-full rounded-full")} />
        </div>
      ) : variant === "detail" ? (
        <div className="space-y-3">
          <div className="rounded-2xl border border-border p-4">
            <span className={cn(bone, "h-5 w-24 rounded-full")} />
            <span className={cn(bone, "mt-3 h-4 w-2/3")} />
            <span className={cn(bone, "mt-2 h-4 w-1/2")} />
          </div>
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-2xl border border-border p-4">
              <span className={cn(bone, "size-12 shrink-0 rounded-xl")} />
              <span className="min-w-0 grow space-y-2">
                <span className={cn(bone, "h-4 w-3/5")} />
                <span className={cn(bone, "h-3.5 w-2/5")} />
              </span>
              <span className={cn(bone, "h-4 w-16 shrink-0")} />
            </div>
          ))}
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {Array.from({ length: 6 }, (_, i) => (
            <li key={i} className="flex items-center gap-3 py-4">
              <span className={cn(bone, "size-11 shrink-0 rounded-xl")} />
              <span className="min-w-0 grow space-y-2">
                <span className={cn(bone, "h-4 w-1/2")} />
                <span className={cn(bone, "h-3.5 w-1/3")} />
              </span>
              <span className={cn(bone, "h-8 w-8 shrink-0 rounded-full")} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Whole-screen boot loader: the logo with a spinning arc running round it.
export function FullScreenLoader() {
  const { t } = useLanguage();
  return (
    <div
      role="status"
      aria-label={t("common.loading")}
      className="flex min-h-screen w-full items-center justify-center bg-background"
    >
      <div className="relative grid size-28 place-items-center">
        <svg className="absolute inset-0 size-full animate-spin [animation-duration:1.1s]" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="46" fill="none" strokeWidth="4" className="stroke-muted" />
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="72 217"
            className="stroke-primary"
          />
        </svg>
        <span className="relative size-20 overflow-hidden rounded-full bg-white shadow-sm">
          <Image src={logo} alt="" fill sizes="80px" className="object-contain" priority />
        </span>
      </div>
    </div>
  );
}

export function ErrorState({
  error,
  onRetry,
}: {
  error: Error;
  onRetry?: () => void;
}) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 px-6 py-12 text-center">
      <AlertTriangle className="size-6 text-destructive" />
      <div>
        <p className="font-bold">{t("common.loadFailed")}</p>
        <p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCw />
          {t("common.retry")}
        </Button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </span>
      <div className="max-w-md">
        <p className="font-bold">{title}</p>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}
