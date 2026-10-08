import { Link } from "react-router-dom";
import type CustomerAddress from "../../../models/customerAddress/CustomerAddress";
import { ChevronRightIcon } from "../../layout/main/bottom/icons";
import { formatAddressLine } from "./formatAddress";

type AddressCardProps = {
  address: CustomerAddress;
};

export default function AddressCard({ address }: AddressCardProps) {
  const title = address.name || address.addressType?.name || "Хаяг";
  const line = formatAddressLine(address);
  const typeName = address.addressType?.name;

  return (
    <Link
      to={`/profile/addresses/${address.id}`}
      className="flex items-center gap-3 rounded-2xl bg-white px-3 py-3 shadow-sm"
    >
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-gray-900">
            {title}
          </span>
          {address.isMain ? (
            <span className="shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand">
              Үндсэн
            </span>
          ) : null}
        </span>
        {typeName && typeName !== title ? (
          <span className="mt-0.5 block text-xs text-gray-400">{typeName}</span>
        ) : null}
        <span className="mt-0.5 block text-xs text-gray-500">
          {line || "Дэлгэрэнгүй байхгүй"}
        </span>
      </span>
      <ChevronRightIcon className="h-4 w-4 shrink-0 text-gray-300" />
    </Link>
  );
}
