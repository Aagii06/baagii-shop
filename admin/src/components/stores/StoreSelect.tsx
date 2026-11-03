"use client";

import { getStores } from "@/lib/api/stores";
import { useApi } from "@/lib/useApi";
import { ChevronDown } from "lucide-react";

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
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className="h-12 w-full appearance-none rounded-full border border-input bg-white px-5 pr-12 text-[15px] focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 aria-invalid:border-destructive"
      >
        <option value="">{placeholder}</option>
        {/* The saved store stays listed while the list loads. */}
        {!data && value && <option value={value}>…</option>}
        {data?.map((store) => (
          <option key={store.id} value={store.id}>
            {store.name}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}
