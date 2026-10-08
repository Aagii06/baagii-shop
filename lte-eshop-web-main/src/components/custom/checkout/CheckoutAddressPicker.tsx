import { Link } from "react-router-dom";
import type CustomerAddress from "../../../models/customerAddress/CustomerAddress";
import { formatAddressLine } from "../address/formatAddress";
import { RadioOffIcon, RadioOnIcon } from "./icons";

type CheckoutAddressPickerProps = {
  loggedIn: boolean;
  addresses: CustomerAddress[];
  selectedId: number | null;
  loading: boolean;
  error: string | null;
  onSelect: (id: number) => void;
  onAdd: () => void;
};

export default function CheckoutAddressPicker({
  loggedIn,
  addresses,
  selectedId,
  loading,
  error,
  onSelect,
  onAdd,
}: CheckoutAddressPickerProps) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-3 px-0.5">
        <h2 className="text-[15px] font-semibold text-gray-900">
          Хүргэлтийн хаяг
        </h2>
        {loggedIn ? (
          <button
            type="button"
            onClick={onAdd}
            className="text-sm font-semibold text-brand"
          >
            Хаяг нэмэх
          </button>
        ) : null}
      </div>

      {!loggedIn ? (
        <div className="rounded-2xl bg-white px-4 py-5 text-center shadow-sm">
          <p className="text-sm text-gray-500">
            Хаяг сонгохын тулд нэвтэрнэ үү
          </p>
          <Link
            to="/login"
            className="mt-3 inline-block rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white"
          >
            Нэвтрэх
          </Link>
        </div>
      ) : loading ? (
        <p className="rounded-2xl bg-white py-8 text-center text-sm text-gray-400 shadow-sm">
          Ачаалж байна…
        </p>
      ) : error ? (
        <p className="rounded-2xl bg-white px-3 py-8 text-center text-sm text-danger shadow-sm">
          {error}
        </p>
      ) : addresses.length === 0 ? (
        <button
          type="button"
          onClick={onAdd}
          className="w-full rounded-2xl border border-dashed border-brand/40 bg-white px-3 py-8 text-sm font-semibold text-brand shadow-sm"
        >
          Хаяг нэмэх
        </button>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <ul className="divide-y divide-gray-100">
            {addresses.map((address) => {
              const selected = selectedId === address.id;
              const title =
                address.name || address.addressType?.name || "Хаяг";
              const line = formatAddressLine(address);
              return (
                <li key={address.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(address.id)}
                    className={`flex w-full items-center gap-3 px-3 py-3 text-left ${
                      selected ? "bg-orange-50/70" : ""
                    }`}
                  >
                    {selected ? (
                      <RadioOnIcon className="h-5 w-5 shrink-0 text-brand" />
                    ) : (
                      <RadioOffIcon className="h-5 w-5 shrink-0 text-gray-300" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span
                          className={`truncate text-sm font-semibold ${
                            selected ? "text-brand" : "text-gray-900"
                          }`}
                        >
                          {title}
                        </span>
                        {address.isMain ? (
                          <span className="shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand">
                            Үндсэн
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-0.5 block text-xs text-gray-500">
                        {line || "Дэлгэрэнгүй байхгүй"}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
