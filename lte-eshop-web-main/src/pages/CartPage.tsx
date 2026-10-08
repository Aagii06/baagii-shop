import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/layout/main/header";
import { CartList } from "../components/custom/cart/list";
import type Cart from "../models/eshop/Cart";
import type CartDetail from "../models/eshop/CartDetail";
import {
  addProduct,
  getActiveCarts,
  deleteCart,
} from "../services/cartService";
import { useCartStore } from "../store/cart";

export function CartPage() {
  const navigate = useNavigate();
  const [carts, setCarts] = useState<Cart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyItemId, setBusyItemId] = useState<string | number | null>(null);
  const fetchProductCnt = useCartStore((s) => s.fetchProductCnt);

  const loadCarts = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getActiveCarts();
    if (!res.success || !res.data) {
      setError(res.message || "Сагс ачааллахад алдаа гарлаа.");
      setCarts([]);
    } else {
      setCarts(res.data.rows ?? []);
    }
    setLoading(false);
    void fetchProductCnt();
  }, [fetchProductCnt]);

  useEffect(() => {
    void loadCarts();
  }, [loadCarts]);

  const handleQtyChange = async (item: Partial<CartDetail>, qty: number) => {
    if (!item.id || !item.postProductId) return;

    setBusyItemId(item.id);
    const res = await addProduct({
      cartDetailId: String(item.id),
      postProductId: String(item.postProductId),
      qty,
      branchId: item.branchId,
    });
    setBusyItemId(null);

    if (!res.success) {
      setError(res.message || "Тоо ширхэг шинэчлэхэд алдаа гарлаа.");
      return;
    }
    await loadCarts();
  };

  const handleRemoveItem = async (item: Partial<CartDetail>) => {
    // Backend has no dedicated delete yet — set qty to 0 via addProduct if supported
    if (!item.id || !item.postProductId) return;
    setBusyItemId(item.id);
    const res = await addProduct({
      cartDetailId: String(item.id),
      postProductId: String(item.postProductId),
      qty: 0,
      branchId: item.branchId,
    });
    setBusyItemId(null);
    if (!res.success) {
      setError(res.message || "Мөр устгахад алдаа гарлаа.");
      return;
    }
    await loadCarts();
  };

  const handleDeleteCart = async (cartId: string) => {
    const res = await deleteCart(cartId);
    if (!res.success) {
      setError(res.message || "Сагс устгахад алдаа гарлаа.");
      return;
    }
    await loadCarts();
  };

  return (
    <>
      <PageHeader title="Миний сагс" />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-surface">
          <CartList
            carts={carts}
            loading={loading}
            error={error}
            busyItemId={busyItemId}
            onQtyChange={handleQtyChange}
            onRemoveItem={handleRemoveItem}
            onDeleteCart={handleDeleteCart}
            onPay={(cart) => {
              navigate(`/cart/${cart.id}/checkout`);
            }}
          />
      </div>
    </>
  );
}
