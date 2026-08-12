import {
  Baby,
  Backpack,
  Home,
  NotebookPen,
  Package,
  Shirt,
  Sparkles,
  UtensilsCrossed,
  Zap,
  type LucideIcon,
} from "lucide-react";

export const categoryVisuals: Record<
  string,
  { icon: LucideIcon; from: string; to: string }
> = {
  huns: { icon: UtensilsCrossed, from: "#f59e0b", to: "#ef4444" },
  huvtsas: { icon: Shirt, from: "#7c3aed", to: "#4338ca" },
  "goo-saihan": { icon: Sparkles, from: "#ec4899", to: "#f472b6" },
  "tsahilgaan-baraa": { icon: Zap, from: "#0ea5e9", to: "#2563eb" },
  "ger-akhui": { icon: Home, from: "#16a34a", to: "#0d9488" },
  "huuhdiin-baraa": { icon: Baby, from: "#f97316", to: "#facc15" },
  "sport-ayalal": { icon: Backpack, from: "#059669", to: "#0891b2" },
  "bichig-hereg": { icon: NotebookPen, from: "#6366f1", to: "#8b5cf6" },
};

export const defaultCategoryVisual = { icon: Package, from: "#94a3b8", to: "#64748b" };
