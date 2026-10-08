import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useState, type FormEvent } from "react";
import { ChevronLeftIcon } from "../components/custom/post/detail";
import { useAuth } from "../hooks/useAuth";

export function LoginPage() {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const location = useLocation() as {
    state?: { userName?: string; message?: string };
  };

  const [userName, setUserName] = useState(location.state?.userName ?? "");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info] = useState(location.state?.message ?? null);
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/profile" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const name = userName.trim();
    if (!name) {
      setError("Утасны дугаар оруулна уу.");
      return;
    }
    if (!pin) {
      setError("PIN код оруулна уу.");
      return;
    }

    setSubmitting(true);
    setError(null);
    const res = await login(name, pin);
    setSubmitting(false);

    if (!res.success || !res.data?.user) {
      setError(res.message || "Нэвтрэхэд алдаа гарлаа.");
      return;
    }

    navigate("/profile", { replace: true });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-surface">
      <header className="relative flex h-14 shrink-0 items-center justify-center bg-brand px-12 text-white">
        <button
          type="button"
          aria-label="Буцах"
          onClick={() => navigate(-1)}
          className="absolute left-3 top-1/2 -translate-y-1/2 p-1"
        >
          <ChevronLeftIcon className="h-6 w-6" />
        </button>
        <h1 className="truncate text-[17px] font-semibold tracking-wide">
          Нэвтрэх
        </h1>
      </header>

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pt-8 pb-6"
      >
        <p className="text-center text-2xl font-bold text-gray-900">Нэвтрэх</p>
        <p className="mt-1 text-center text-sm text-gray-400">
          Утасны дугаар болон PIN-ээ оруулна уу
        </p>

        {info ? (
          <p className="mt-4 text-center text-sm text-brand">{info}</p>
        ) : null}

        <label className="mt-8 text-xs font-medium text-gray-500">
          Утасны дугаар
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="username"
            value={userName}
            onChange={(e) =>
              setUserName(e.target.value.replace(/\D/g, "").slice(0, 12))
            }
            placeholder="99112233"
            className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-900 outline-none focus:border-brand"
          />
        </label>

        <label className="mt-4 text-xs font-medium text-gray-500">
          PIN код
          <input
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            value={pin}
            onChange={(e) =>
              setPin(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            placeholder="****"
            className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-900 outline-none focus:border-brand"
          />
        </label>

        {error ? (
          <p className="mt-3 text-center text-sm text-danger">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="mt-8 w-full rounded-xl bg-brand py-3.5 text-[15px] font-semibold text-white active:bg-brand-dark disabled:opacity-50"
        >
          {submitting ? "Нэвтэрч байна…" : "Нэвтрэх"}
        </button>

        <Link
          to="/register"
          className="mt-3 block w-full rounded-xl border border-brand py-3.5 text-center text-[15px] font-semibold text-brand"
        >
          Бүртгүүлэх
        </Link>
      </form>
    </div>
  );
}
