import { CartNav, ContactNav, HomeNav, OrdersNav, ProfileNav } from "./nav";

export default () => {
  return (
    <nav className="shrink-0 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)]">
      <ul className="grid h-[60px] grid-cols-5">
        <HomeNav />
        <OrdersNav />
        <CartNav />
        <ProfileNav />
        <ContactNav />
      </ul>
    </nav>
  );
};
