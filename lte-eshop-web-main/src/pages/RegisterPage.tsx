import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ChevronLeftIcon } from "../components/custom/post/detail";
import { useAuth } from "../hooks/useAuth";

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, user } = useAuth();
  const [userName, setUserName] = useState("");
  const [error, setError] = useState<string | null>(null);
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

    setSubmitting(true);
    setError(null);
    const res = await register(name);
    setSubmitting(false);

    if (!res.success) {
      setError(res.message || "Бүртгүүлэхэд алдаа гарлаа.");
      return;
    }

    navigate("/login", {
      replace: true,
      state: {
        userName: name,
        message: res.message || "Бүртгэл амжилттай. Нэвтэрнэ үү.",
      },
    });
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
          Бүртгүүлэх
        </h1>
      </header>

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pt-8 pb-6"
      >
        <p className="text-center text-2xl font-bold text-gray-900">
          Бүртгүүлэх
        </p>
        <p className="mt-1 text-center text-sm text-gray-400">
          Утасны дугаараараа бүртгүүлнэ үү
        </p>

        <label className="mt-8 text-xs font-medium text-gray-500">
          Утасны дугаар
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            value={userName}
            onChange={(e) =>
              setUserName(e.target.value.replace(/\D/g, "").slice(0, 12))
            }
            placeholder="99112233"
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
          {submitting ? "Бүртгэж байна…" : "Бүртгүүлэх"}
        </button>
      </form>
    </div>
  );
}
