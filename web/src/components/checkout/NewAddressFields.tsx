"use client";

import {
  getAddressTypes,
  getCities,
  getDistricts,
  getSubDistricts,
  type AddressArea,
  type AddressType,
} from "@/lib/api/customerAddress";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import {
  useEffect,
  useId,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

export interface NewAddress {
  addressType: AddressType | null;
  city: AddressArea | null;
  district: AddressArea | null;
  subDistrict: AddressArea | null;
}

export const EMPTY_NEW_ADDRESS: NewAddress = {
  addressType: null,
  city: null,
  district: null,
  subDistrict: null,
};

interface Loaded<T> {
  key: number;
  attempt: number;
  items: T[];
  error: boolean;
}

interface ListResult<T> {
  items: T[];
  loading: boolean;
  error: boolean;
  retry: () => void;
}

const NONE: never[] = [];

// Loads the list under parent `key` (`null` = parent not picked yet, nothing
// to load). Results are tagged with the key they were fetched for, so a
// previous parent's list never shows while the new one is loading.
function useList<T>(
  key: number | null,
  load: (key: number) => Promise<T[]>
): ListResult<T> {
  const [state, setState] = useState<Loaded<T> | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (key === null) return;
    let cancelled = false;
    load(key).then(
      (items) => {
        if (!cancelled) setState({ key, attempt, items, error: false });
      },
      () => {
        if (!cancelled) setState({ key, attempt, items: [], error: true });
      }
    );
    return () => {
      cancelled = true;
    };
  }, [key, attempt, load]);

  const loaded =
    key !== null && state?.key === key && state.attempt === attempt
      ? state
      : null;

  return {
    items: loaded?.items ?? NONE,
    loading: key !== null && !loaded,
    error: loaded?.error ?? false,
    retry: () => setAttempt((n) => n + 1),
  };
}

interface NewAddressFieldsProps {
  value: NewAddress;
  onChange: Dispatch<SetStateAction<NewAddress>>;
}

// Address type plus the Аймаг/Нийслэл → Сум/Дүүрэг → Баг/Хороо pickers.
// Each level is fetched only once its parent is chosen, and changing a
// level clears everything below it.
export default function NewAddressFields({
  value,
  onChange,
}: NewAddressFieldsProps) {
  const { t } = useLanguage();
  const types = useList(0, getAddressTypes);
  const cities = useList(0, getCities);
  const districts = useList(value.city?.id ?? null, getDistricts);
  const subDistricts = useList(value.district?.id ?? null, getSubDistricts);

  // Preselect the first address type once the list arrives.
  useEffect(() => {
    if (types.items.length === 0) return;
    onChange((v) =>
      v.addressType ? v : { ...v, addressType: types.items[0] }
    );
  }, [types.items, onChange]);

  return (
    <div className="space-y-4">
      {types.items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {types.items.map((type) => {
            const selected = value.addressType?.id === type.id;
            return (
              <button
                type="button"
                key={type.id}
                aria-pressed={selected}
                onClick={() => onChange((v) => ({ ...v, addressType: type }))}
                style={
                  selected
                    ? {
                        backgroundColor: type.style?.bgColor,
                        borderColor: type.style?.bgColor,
                        color: type.style?.txtColor,
                      }
                    : undefined
                }
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-foreground hover:border-primary/40"
                )}
              >
                {type.name}
              </button>
            );
          })}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <AreaSelect
          label={t("checkout.address.city")}
          list={cities}
          value={value.city}
          parentMissing={false}
          onSelect={(city) =>
            onChange((v) => ({ ...v, city, district: null, subDistrict: null }))
          }
        />
        <AreaSelect
          label={t("checkout.address.district")}
          list={districts}
          value={value.district}
          parentMissing={!value.city}
          onSelect={(district) =>
            onChange((v) => ({ ...v, district, subDistrict: null }))
          }
        />
        <AreaSelect
          label={t("checkout.address.subDistrict")}
          list={subDistricts}
          value={value.subDistrict}
          parentMissing={!value.district}
          onSelect={(subDistrict) => onChange((v) => ({ ...v, subDistrict }))}
        />
      </div>
    </div>
  );
}

function AreaSelect({
  label,
  list,
  value,
  parentMissing,
  onSelect,
}: {
  label: string;
  list: ListResult<AddressArea>;
  value: AddressArea | null;
  parentMissing: boolean;
  onSelect: (area: AddressArea | null) => void;
}) {
  const { t } = useLanguage();
  const id = useId();
  const empty =
    !parentMissing && !list.loading && !list.error && list.items.length === 0;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {/* Disabled controls skip `required`, so only disable when there is
          nothing to pick: the parent is unset (its own select blocks the
          submit) or the level has no entries. While loading it stays enabled
          and empty, so the form can't be sent before the list settles. */}
      <select
        id={id}
        required
        disabled={parentMissing || empty}
        value={value?.id ?? ""}
        onChange={(e) =>
          onSelect(
            list.items.find((a) => a.id === Number(e.target.value)) ?? null
          )
        }
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
      >
        <option value="">
          {list.loading
            ? t("checkout.address.loading")
            : empty
              ? t("checkout.address.noOptions")
              : t("checkout.address.select")}
        </option>
        {list.items.map((area) => (
          <option key={area.id} value={area.id}>
            {area.name}
          </option>
        ))}
      </select>
      {list.error && (
        <button
          type="button"
          onClick={list.retry}
          className="text-xs text-destructive hover:underline"
        >
          {t("checkout.address.loadError")}
        </button>
      )}
    </div>
  );
}
