import { Link } from "react-router-dom";
import { cdnBaseUrl } from "../../../../constant/config";
import { useAuth } from "../../../../hooks/useAuth";
import { UserIcon } from "../bottom/icons";

export default function HeaderUser() {
  const { user } = useAuth();
  const label = user
    ? user.phone || user.userName || user.name || "Профайл"
    : "Нэвтрэх";
  const initial = (user?.name || user?.userName || user?.phone || "Х").slice(
    0,
    1,
  );
  const imageSrc =
    user?.image != null
      ? `${cdnBaseUrl}/file/thumbnail/${user.image}`
      : null;

  return (
    <Link
      to={user ? "/profile" : "/login"}
      className="absolute right-2 top-1/2 flex max-w-30 -translate-y-1/2 items-center gap-1.5 rounded-full bg-white/15 py-1 pr-2.5 pl-1"
      aria-label={user ? `Профайл: ${label}` : "Нэвтрэх"}
    >
      {user && imageSrc ? (
        <img
          src={imageSrc}
          alt=""
          className="h-7 w-7 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-semibold">
          {user ? initial : <UserIcon className="h-4 w-4" />}
        </span>
      )}
      <span className="truncate text-[11px] font-semibold leading-tight">
        {label}
      </span>
    </Link>
  );
}
