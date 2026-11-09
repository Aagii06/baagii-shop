"use client";

import type { StoreTier } from "@/lib/api/stores";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";

const RIBBON: Record<Exclude<StoreTier, "normal">, string> = {
  gold: "bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-amber-950",
  silver: "bg-gradient-to-r from-slate-200 to-slate-400 text-slate-900",
  bronze: "bg-gradient-to-r from-orange-300 to-amber-700 text-orange-950",
};

/** Card border per tier, to go with the ribbon. */
export const TIER_BORDER: Record<StoreTier, string> = {
  gold: "border-amber-400",
  silver: "border-slate-300",
  bronze: "border-orange-300",
  normal: "border-border",
};

/**
 * A diagonal ribbon across a card's top-right corner ("GOLD"). The card
 * needs `relative overflow-hidden`. Nothing for normal stores.
 */
export default function TierRibbon({ tier }: { tier: StoreTier }) {
  const { t } = useLanguage();
  if (tier === "normal" || !(tier in RIBBON)) return null;
  return (
    <span
      className={cn(
        "pointer-events-none absolute right-[-30px] top-[10px] w-[100px] rotate-45 py-0.5 text-center text-[9px] font-bold uppercase tracking-wider shadow-sm",
        RIBBON[tier],
      )}
    >
      {t(`stores.tier.${tier}`)}
    </span>
  );
}
