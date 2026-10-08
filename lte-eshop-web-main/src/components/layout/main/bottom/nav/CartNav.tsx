import { useEffect } from "react";
import { useCartStore } from "../../../../../store/cart";
import { CartIcon } from "../icons";
import NavItem from "./NavItem";

export default function CartNav() {
  const badge = useCartStore((s) => s.productCnt);
  const fetchProductCnt = useCartStore((s) => s.fetchProductCnt);

  useEffect(() => {
    void fetchProductCnt();
  }, [fetchProductCnt]);

  return <NavItem to="/cart" label="Сагс" icon={CartIcon} badge={badge} />;
}
