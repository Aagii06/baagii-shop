"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export default function StepIndicator({ current }: { current: number }) {
  const { t } = useLanguage();

  const steps = [
    { n: 1, label: t("checkout.step.cart") },
    { n: 2, label: t("checkout.step.shipping") },
    { n: 3, label: t("checkout.step.payment") },
  ];

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {steps.map((step, i) => {
        const done = step.n < current;
        const active = step.n === current;
        return (
          <div key={step.n} className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  done && "bg-emerald-600 text-white",
                  active && "brand-gradient text-white",
                  !done && !active && "bg-muted text-muted-foreground"
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : step.n}
              </span>
              <span
                className={cn(
                  "text-sm font-medium hidden xs:inline",
                  active
                    ? "text-foreground"
                    : done
                    ? "text-emerald-600"
                    : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span className="w-6 sm:w-10 h-px bg-border" />
            )}
          </div>
        );
      })}
    </div>
  );
}
