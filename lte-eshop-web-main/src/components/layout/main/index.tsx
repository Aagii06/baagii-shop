import { Outlet, useLocation } from "react-router-dom";
import BottomNav from "./bottom";

export default () => {
  const { pathname } = useLocation();
  const hideBottomNav =
    pathname.startsWith("/post/") ||
    pathname.includes("/checkout") ||
    pathname.includes("/pay/") ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/profile/addresses");

  return (
    <div className="app-shell flex flex-col">
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <Outlet />
      </main>
      {!hideBottomNav ? <BottomNav /> : null}
    </div>
  );
};
