"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";
import { AlertTriangle, Inbox, Loader2, RotateCw } from "lucide-react";
import Image from "next/image";

export function LoadingState({ className }: { className?: string }) {
  const { t } = useLanguage();
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground",
        className
      )}
    >
      <Loader2 className="size-4 animate-spin" />
      {t("common.loading")}
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
