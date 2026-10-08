import { useEffect, useState, type FormEvent } from "react";
import type AddressType from "../../../models/customerAddress/AddressType";
import type City from "../../../models/customerAddress/City";
import type CustomerAddress from "../../../models/customerAddress/CustomerAddress";
import type { CustomerAddressWrite } from "../../../models/customerAddress/CustomerAddress";
import type District from "../../../models/customerAddress/District";
import type SubDistrict from "../../../models/customerAddress/SubDistrict";
import {
  getAddressTypes,
  getCities,
  getDistricts,
  getSubDistricts,
} from "../../../services/customerAddressService";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-900 outline-none focus:border-brand disabled:bg-gray-100 disabled:text-gray-400";

type AddressFormProps = {
  initial?: CustomerAddress | null;
  submitting: boolean;
  error: string | null;
  submitLabel: string;
  onSubmit: (data: CustomerAddressWrite) => void;
};

export default function AddressForm({
  initial,
  submitting,
  error,
  submitLabel,
  onSubmit,
}: AddressFormProps) {
  const [types, setTypes] = useState<AddressType[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [subDistricts, setSubDistricts] = useState<SubDistrict[]>([]);
  const [lookupsError, setLookupsError] = useState<string | null>(null);
  const [lookupsReady, setLookupsReady] = useState(false);

  const [name, setName] = useState(initial?.name ?? "");
  const [addressTypeId, setAddressTypeId] = useState<number | null>(
    initial?.addressTypeId ?? null,
  );
  const [cityId, setCityId] = useState<number | null>(initial?.cityId ?? null);
  const [districtId, setDistrictId] = useState<number | null>(
    initial?.districtId ?? null,
  );
  const [subDistrictId, setSubDistrictId] = useState<number | null>(
    initial?.subDistrictId ?? null,
  );
  const [street, setStreet] = useState(initial?.street ?? "");
  const [apartment, setApartment] = useState(initial?.apartment ?? "");
  const [door, setDoor] = useState(initial?.door ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [isMain, setIsMain] = useState(Boolean(initial?.isMain));
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [typesRes, citiesRes] = await Promise.all([
        getAddressTypes(),
        getCities(),
      ]);
      if (cancelled) return;

      if (!typesRes.success || !typesRes.data) {
        setLookupsError(typesRes.message || "Хаягийн төрөл ачааллахад алдаа гарлаа.");
        setLookupsReady(true);
        return;
      }
      if (!citiesRes.success || !citiesRes.data) {
        setLookupsError(citiesRes.message || "Хот ачааллахад алдаа гарлаа.");
        setLookupsReady(true);
        return;
      }

      setTypes(typesRes.data.rows ?? []);
      setCities(citiesRes.data.rows ?? []);
      setLookupsReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (addressTypeId == null && types[0]?.id != null) {
      setAddressTypeId(types[0].id);
    }
  }, [types, addressTypeId]);

  useEffect(() => {
    if (cityId == null) {
      setDistricts([]);
      return;
    }

    let cancelled = false;
    (async () => {
      const res = await getDistricts(cityId);
      if (cancelled) return;
      setDistricts(res.success && res.data ? (res.data.rows ?? []) : []);
    })();

    return () => {
      cancelled = true;
    };
  }, [cityId]);

  useEffect(() => {
    if (districtId == null) {
      setSubDistricts([]);
      return;
    }

    let cancelled = false;
    (async () => {
      const res = await getSubDistricts(districtId);
      if (cancelled) return;
      setSubDistricts(res.success && res.data ? (res.data.rows ?? []) : []);
    })();

    return () => {
      cancelled = true;
    };
  }, [districtId]);

  const handleCityChange = (next: number | null) => {
    setCityId(next);
    setDistrictId(null);
    setSubDistrictId(null);
  };

  const handleDistrictChange = (next: number | null) => {
    setDistrictId(next);
    setSubDistrictId(null);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (addressTypeId == null) {
      setFormError("Хаягийн төрөл сонгоно уу.");
      return;
    }

    const city = cities.find((c) => c.id === cityId);
    const district = districts.find((d) => d.id === districtId);
    const subDistrict = subDistricts.find((s) => s.id === subDistrictId);

    setFormError(null);
    onSubmit({
      addressTypeId,
      name: name.trim() || undefined,
      cityId: cityId ?? undefined,
      cityName: city?.name,
      districtId: districtId ?? undefined,
      districtName: district?.name,
      subDistrictId: subDistrictId ?? undefined,
      subDistrictName: subDistrict?.name,
      street: street.trim() || undefined,
      apartment: apartment.trim() || undefined,
      door: door.trim() || undefined,
      note: note.trim() || undefined,
      address: address.trim() || undefined,
      isMain,
    });
  };

  if (!lookupsReady) {
    return (
      <p className="py-12 text-center text-sm text-gray-400">Ачаалж байна…</p>
    );
  }

  if (lookupsError) {
    return (
      <p className="px-5 py-12 text-center text-sm text-danger">{lookupsError}</p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <p className="mb-2 text-xs font-medium text-gray-500">Хаягийн төрөл</p>
        <div className="flex flex-wrap gap-2">
          {types.map((type) => {
            const selected = type.id === addressTypeId;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => setAddressTypeId(type.id)}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                  selected
                    ? "bg-brand text-white"
                    : "bg-white text-gray-700 shadow-sm"
                }`}
              >
                {type.name}
              </button>
            );
          })}
        </div>

        <label className="mt-4 block text-xs font-medium text-gray-500">
          Хаягийн нэр
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Гэр, Ажил"
            className={inputClass}
          />
        </label>

        <label className="mt-4 block text-xs font-medium text-gray-500">
          Хот / аймаг
          <select
            value={cityId ?? ""}
            onChange={(e) =>
              handleCityChange(e.target.value ? Number(e.target.value) : null)
            }
            className={inputClass}
          >
            <option value="">Сонгоно уу</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-4 block text-xs font-medium text-gray-500">
          Дүүрэг / сум
          <select
            value={districtId ?? ""}
            disabled={cityId == null}
            onChange={(e) =>
              handleDistrictChange(
                e.target.value ? Number(e.target.value) : null,
              )
            }
            className={inputClass}
          >
            <option value="">Сонгоно уу</option>
            {districts.map((district) => (
              <option key={district.id} value={district.id}>
                {district.name}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-4 block text-xs font-medium text-gray-500">
          Хороо / баг
          <select
            value={subDistrictId ?? ""}
            disabled={districtId == null}
            onChange={(e) =>
              setSubDistrictId(e.target.value ? Number(e.target.value) : null)
            }
            className={inputClass}
          >
            <option value="">Сонгоно уу</option>
            {subDistricts.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-4 block text-xs font-medium text-gray-500">
          Гудамж
          <input
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            className={inputClass}
          />
        </label>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="text-xs font-medium text-gray-500">
            Байр
            <input
              value={apartment}
              onChange={(e) => setApartment(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="text-xs font-medium text-gray-500">
            Тоот
            <input
              value={door}
              onChange={(e) => setDoor(e.target.value)}
              className={inputClass}
            />
          </label>
        </div>

        <label className="mt-4 block text-xs font-medium text-gray-500">
          Бүтэн хаяг
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </label>

        <label className="mt-4 block text-xs font-medium text-gray-500">
          Тэмдэглэл
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="mt-4 flex items-center gap-2 rounded-2xl bg-white px-3 py-3 text-sm font-medium text-gray-800 shadow-sm">
          <input
            type="checkbox"
            checked={isMain}
            onChange={(e) => setIsMain(e.target.checked)}
            className="h-4 w-4 accent-brand"
          />
          Үндсэн хаяг болгох
        </label>

        {formError || error ? (
          <p className="mt-3 text-center text-sm text-danger">
            {formError || error}
          </p>
        ) : null}
      </div>

      <div className="shrink-0 bg-white px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-brand py-3.5 text-[15px] font-semibold text-white active:bg-brand-dark disabled:opacity-50"
        >
          {submitting ? "Хадгалж байна…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
