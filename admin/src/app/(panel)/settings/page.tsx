"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import DetailHeader from "@/components/layout/DetailHeader";
import { Card } from "@/components/ui/card";
import { ChevronRight, CreditCard, LayoutGrid, SlidersHorizontal, type LucideIcon } from "lucide-react";
import Link from "next/link";

const MENU: { href: string; labelKey: string; descKey: string; icon: LucideIcon; tone: string }[] = [
  {
    href: "/categories",
    labelKey: "common.category",
    descKey: "profile.categories",
    icon: LayoutGrid,
    tone: "bg-amber-100 text-amber-600 ring-amber-200",
  },
  {
    href: "/attrs",
    labelKey: "attrs.title",
    descKey: "profile.attrs",
    icon: SlidersHorizontal,
    tone: "bg-pink-100 text-pink-600 ring-pink-200",
  },
  {
    href: "/payment",
    labelKey: "pay.title",
    descKey: "profile.payment",
    icon: CreditCard,
    tone: "bg-teal-100 text-teal-600 ring-teal-200",
  },
];

/** Shop setup reached from the profile menu: categories, attributes, payment. */
export default function SettingsPage() {
  const { t } = useLanguage();

  return (
    <>
      <DetailHeader backHref="/profile" title={t("settings.title")} />

      <div className="pt-4">
        <Card className="overflow-hidden">
          <ul className="divide-y divide-border">
            {MENU.map(({ href, labelKey, descKey, icon: Icon, tone }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/60 active:bg-muted"
                >
                  <span
                    className={`grid size-11 shrink-0 place-items-center rounded-2xl ring-1 ring-inset transition-transform group-hover:scale-105 ${tone}`}
                  >
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0 grow">
                    <span className="block truncate text-[15px] font-bold">{t(labelKey)}</span>
                    <span className="block truncate text-sm text-muted-foreground">{t(descKey)}</span>
                  </span>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
