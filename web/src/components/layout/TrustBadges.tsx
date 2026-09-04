"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { BadgeCheck, Headset, RefreshCcw, Truck } from "lucide-react";

export default function TrustBadges() {
  const { t } = useLanguage();

  const trustItems = [
    {
      icon: Truck,
      title: t("trust.delivery.title"),
      desc: t("trust.delivery.desc"),
      tint: "bg-emerald-100 text-emerald-700",
    },
    {
      icon: RefreshCcw,
      title: t("trust.returns.title"),
      desc: t("trust.returns.desc"),
      tint: "bg-violet-100 text-violet-700",
    },
    {
      icon: BadgeCheck,
      title: t("trust.verified.title"),
      desc: t("trust.verified.desc"),
      tint: "bg-blue-100 text-blue-700",
    },
    {
      icon: Headset,
      title: t("trust.support.title"),
      desc: t("trust.support.desc"),
      tint: "bg-amber-100 text-amber-700",
    },
  ];

  // return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
      {trustItems.map(({ icon: Icon, title, desc, tint }) => (
        <div key={title} className="flex items-start gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tint}`}
          >
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground leading-tight">
              {title}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
