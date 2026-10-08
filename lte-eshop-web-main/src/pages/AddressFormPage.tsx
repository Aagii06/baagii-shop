import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { AddressForm } from "../components/custom/address";
import BackHeader from "../components/layout/main/header/BackHeader";
import { useAuth } from "../hooks/useAuth";
import type CustomerAddress from "../models/customerAddress/CustomerAddress";
import type { CustomerAddressWrite } from "../models/customerAddress/CustomerAddress";
import {
  createCustomerAddress,
  getCustomerAddress,
  updateCustomerAddress,
} from "../services/customerAddressService";

export function AddressFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = id != null;

  const [initial, setInitial] = useState<CustomerAddress | null>(null);
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      const res = await getCustomerAddress(Number(id));
      if (cancelled) return;

      if (!res.success || !res.data) {
        setLoadError(res.message || "Хаяг олдсонгүй.");
      } else {
        setInitial(res.data);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleSubmit = async (data: CustomerAddressWrite) => {
    setSubmitting(true);
    setError(null);
    const res = isEdit
      ? await updateCustomerAddress(Number(id), data)
      : await createCustomerAddress(data);
    setSubmitting(false);

    if (!res.success) {
      setError(res.message || "Хаяг хадгалахад алдаа гарлаа.");
      return;
    }

    navigate("/profile/addresses", { replace: true });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-surface">
      <BackHeader
        title={isEdit ? "Хаяг засах" : "Шинэ хаяг"}
        onBack={() => navigate("/profile/addresses")}
      />

      {loading ? (
        <p className="py-12 text-center text-sm text-gray-400">Ачаалж байна…</p>
      ) : loadError ? (
        <p className="px-5 py-12 text-center text-sm text-danger">{loadError}</p>
      ) : (
        <AddressForm
          key={initial?.id ?? "new"}
          initial={initial}
          submitting={submitting}
          error={error}
          submitLabel={isEdit ? "Хадгалах" : "Нэмэх"}
          onSubmit={(data) => void handleSubmit(data)}
        />
      )}
    </div>
  );
}
