"use client";

import PlaceholderImage from "@/components/ui/placeholder-image";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatMNT } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { Minus, Plus, X } from "lucide-react";

interface CartItemProps {
  item: {
    id: number;
    variantId?: number;
    cartDetailId?: number;
    postProductId?: number;
    branchId?: number;
    name: string;
    price: number;
    image: string;
    quantity: number;
  };
}

export default function CartItem({ item }: CartItemProps) {
  const { t } = useLanguage();
  const setLineQty = useCartStore((s) => s.setLineQty);
  const removeLine = useCartStore((s) => s.removeLine);

  // Quantity / remove act on a specific server line; disabled until the
  // cart has synced and we know the line's ids.
  const syncable =
    item.cartDetailId != null &&
    item.postProductId != null &&
    item.branchId != null;

  const line = {
    cartDetailId: item.cartDetailId!,
    postProductId: item.postProductId!,
    branchId: item.branchId!,
  };

  const changeQty = (qty: number) => {
    if (!syncable) return;
    setLineQty({ ...line, qty });
  };

  return (
    <div className="flex items-start gap-4 py-4 border-b border-border last:border-b-0">
      {item.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.image}
          alt={item.name}
          className="w-20 h-20 rounded-xl shrink-0 object-cover bg-muted"
        />
      ) : (
        <PlaceholderImage className="w-20 h-20 rounded-xl shrink-0" />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-medium text-foreground text-sm sm:text-base line-clamp-2">
              {item.name}
            </h3>
            <p className="text-xs font-medium text-emerald-600 mt-1">
              {t("cart.inStock")}
            </p>
          </div>

          <button
            onClick={() => removeLine(line)}
            disabled={!syncable}
            aria-label={t("cart.removeAria")}
            className="text-muted-foreground hover:text-destructive shrink-0 p-1 disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-between mt-3 flex-wrap gap-3">
          <div className="flex items-center border border-border rounded-lg">
            <button
              onClick={() => changeQty(item.quantity - 1)}
              disabled={!syncable || item.quantity <= 1}
              className="h-8 w-8 flex items-center justify-center disabled:opacity-40 hover:bg-muted rounded-l-lg transition-colors"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="px-3 text-sm font-medium min-w-9 text-center">
              {item.quantity}
            </span>
            <button
              onClick={() => changeQty(item.quantity + 1)}
              disabled={!syncable}
              className="h-8 w-8 flex items-center justify-center disabled:opacity-40 hover:bg-muted rounded-r-lg transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <span className="text-base font-bold text-foreground">
            {formatMNT(item.price * item.quantity)}
          </span>
        </div>
      </div>
    </div>
  );
}
