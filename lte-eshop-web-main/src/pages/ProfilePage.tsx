import { Link } from "react-router-dom";
import PageHeader from "../components/layout/main/header";
import { ChevronRightIcon } from "../components/layout/main/bottom/icons";
import { useAuth } from "../hooks/useAuth";

export function ProfilePage() {
  const { user, logout } = useAuth();

  return (
    <>
      <PageHeader title="Хэрэглэгч" />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {user ? (
          <div className="flex flex-col gap-3">
            <section className="rounded-2xl bg-white px-4 py-4 shadow-sm">
              <p className="text-lg font-bold text-gray-900">
                {user.name || user.userName}
              </p>
              {user.phone || user.userName ? (
                <p className="mt-1 text-sm text-gray-500">
                  {user.phone || user.userName}
                </p>
              ) : null}
            </section>
            <Link
              to="/profile/addresses"
              className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3.5 shadow-sm"
            >
              <span className="text-[15px] font-semibold text-gray-900">
                Хаяг
              </span>
              <ChevronRightIcon className="h-4 w-4 shrink-0 text-gray-300" />
            </Link>
            <button
              type="button"
              onClick={() => void logout()}
              className="w-full rounded-xl border border-danger py-3.5 text-[15px] font-semibold text-danger"
            >
              Гарах
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pt-6">
            <p className="text-center text-sm text-gray-500">
              Захиалга, профайл харахын тулд нэвтэрнэ үү
            </p>
            <Link
              to="/login"
              className="block w-full rounded-xl bg-brand py-3.5 text-center text-[15px] font-semibold text-white"
            >
              Нэвтрэх
            </Link>
            <Link
              to="/register"
              className="block w-full rounded-xl border border-brand py-3.5 text-center text-[15px] font-semibold text-brand"
            >
              Бүртгүүлэх
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
