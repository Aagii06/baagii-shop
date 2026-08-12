"use client";

import StepIndicator from "@/components/checkout/StepIndicator";
import { Lock } from "lucide-react";
import { usePathname } from "next/navigation";

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const current = pathname.includes("/pay") ? 3 : 2;

  return (
    <div>
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <StepIndicator current={current} />
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
            <Lock className="h-3.5 w-3.5" />
            Аюулгүй төлбөр
          </span>
        </div>
      </div>
      {children}
    </div>
  );
}
