import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { AddressCard } from "../components/custom/address";
import BackHeader from "../components/layout/main/header/BackHeader";
import { useAuth } from "../hooks/useAuth";
import type CustomerAddress from "../models/customerAddress/CustomerAddress";
import { getCustomerAddresses } from "../services/customerAddressService";

export function AddressesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      const res = await getCustomerAddresses();
      if (cancelled) return;

      if (!res.success || !res.data) {
        setError(res.message || "Хаяг ачааллахад алдаа гарлаа.");
        setAddresses([]);
      } else {
        setAddresses(res.data.rows ?? []);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-surface">
      <BackHeader title="Хаяг" onBack={() => navigate("/profile")} />

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pt-3 pb-4">
        {loading ? (
          <p className="py-12 text-center text-sm text-gray-400">
            Ачаалж байна…
          </p>
        ) : error ? (
          <p className="py-12 text-center text-sm text-danger">{error}</p>
        ) : addresses.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">
            Хаяг бүртгэгдээгүй байна
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {addresses.map((address) => (
              <AddressCard key={address.id} address={address} />
            ))}
          </div>
        )}
      </div>

      {!loading && !error ? (
        <div className="shrink-0 bg-white px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <Link
            to="/profile/addresses/new"
            className="block w-full rounded-xl bg-brand py-3.5 text-center text-[15px] font-semibold text-white active:bg-brand-dark"
          >
            Шинэ хаяг нэмэх
          </Link>
        </div>
      ) : null}
    </div>
  );
}
