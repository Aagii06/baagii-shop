"use client";

import { getStores } from "@/lib/api/stores";
import { useApi } from "@/lib/useApi";
import Select from "@/components/common/Select";

/**
 * Picks a seller store from `/store`. `placeholder` is the empty choice —
 * "the shop's own" on a product, "pick one" where a store is required.
 */
export default function StoreSelect({
  value,
  onChange,
  placeholder,
  id,
  invalid,
  describedBy,
}: {
  /** Selected store id, or "". */
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  id?: string;
  invalid?: boolean;
  describedBy?: string;
}) {
  const { data } = useApi(getStores);

  return (
    <Select
      id={id}
      title={placeholder}
      value={value}
      onChange={onChange}
      aria-invalid={invalid}
      aria-describedby={describedBy}
    >
      <option value="">{placeholder}</option>
      {/* The saved store stays listed while the list loads. */}
      {!data && value && <option value={value}>…</option>}
      {data?.map((store) => (
        <option key={store.id} value={store.id}>
          {store.name}
        </option>
      ))}
    </Select>
  );
}
