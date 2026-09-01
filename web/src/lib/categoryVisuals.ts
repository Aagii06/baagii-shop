import {
  Baby,
  Home,
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
  // Keyed by category `code` from the API.
  food: { icon: UtensilsCrossed, from: "#f59e0b", to: "#ef4444" },
  clothing: { icon: Shirt, from: "#7c3aed", to: "#4338ca" },
  beauty: { icon: Sparkles, from: "#ec4899", to: "#f472b6" },
  electronics: { icon: Zap, from: "#0ea5e9", to: "#2563eb" },
  home: { icon: Home, from: "#16a34a", to: "#0d9488" },
  phone: { icon: Zap, from: "#0ea5e9", to: "#2563eb" },
  computer: { icon: Zap, from: "#6366f1", to: "#8b5cf6" },
  tv: { icon: Zap, from: "#0ea5e9", to: "#1e40af" },
  drinks: { icon: UtensilsCrossed, from: "#f59e0b", to: "#ea580c" },
  snacks: { icon: UtensilsCrossed, from: "#f59e0b", to: "#dc2626" },
  men: { icon: Shirt, from: "#7c3aed", to: "#4338ca" },
  women: { icon: Shirt, from: "#ec4899", to: "#a21caf" },
  kids: { icon: Baby, from: "#f97316", to: "#facc15" },
};

export const defaultCategoryVisual = { icon: Package, from: "#94a3b8", to: "#64748b" };
