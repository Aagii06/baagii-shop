"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import Select from "@/components/common/Select";
import { Textarea } from "@/components/ui/textarea";
import { getCities, getDistricts, getSubDistricts, type Area } from "@/lib/api/locations";
import { useEffect, useRef, useState } from "react";

/** Between the parts of a saved address: "Улаанбаатар, Баянзүрх, 1-р хороо, 5-р байр 12 тоот". */
const SEP = ", ";

interface Picked {
  cityId: number | null;
  districtId: number | null;
  subDistrictId: number | null;
  detail: string;
  districts: Area[];
  subDistricts: Area[];
}

const EMPTY: Picked = { cityId: null, districtId: null, subDistrictId: null, detail: "", districts: [], subDistricts: [] };

/**
 * Reads a saved address back into the selects. One that doesn't start with
 * names from the tree (typed in before there was a picker) lands in the
 * detail field whole.
 */
async function parse(value: string, cities: Area[]): Promise<Picked> {
  const parts = value.split(SEP);
  const city = cities.find((c) => c.name === parts[0]);
  if (!city) return { ...EMPTY, detail: value };
  const districts = await getDistricts(city.id);
  const district = districts.find((d) => d.name === parts[1]);
  if (!district) return { ...EMPTY, cityId: city.id, districts, detail: parts.slice(1).join(SEP) };
  const subDistricts = await getSubDistricts(district.id);
  const sub = subDistricts.find((s) => s.name === parts[2]);
  return {
    cityId: city.id,
    districtId: district.id,
    subDistrictId: sub?.id ?? null,
    detail: parts.slice(sub ? 3 : 2).join(SEP),
    districts,
    subDistricts,
  };
}

function AreaSelect({
  label,
  areas,
  value,
  onChange,
  disabled,
}: {
  label: string;
  areas: Area[];
  value: number | null;
  onChange: (id: number | null) => void;
  disabled?: boolean;
}) {
  return (
    <Select
      title={label}
      aria-label={label}
      value={value ?? ""}
      disabled={disabled}
      onChange={(v) => onChange(v ? Number(v) : null)}
    >
      <option value="">{label}</option>
      {areas.map((a) => (
        <option key={a.id} value={a.id}>
          {a.name}
        </option>
      ))}
    </Select>
  );
}

/**
 * An address picked from the location tree — Аймаг/Нийслэл → Сум/Дүүрэг →
 * Баг/Хороо — with the rest typed in under it. `value` is the address as
 * one line, and `onChange` gets `""` until at least the city is picked.
 */
export default function AddressPicker({
  value,
  onChange,
  ...aria
}: {
  value: string;
  onChange: (value: string) => void;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}) {
  const { t } = useLanguage();
  const [cities, setCities] = useState<Area[]>([]);
  const [picked, setPicked] = useState<Picked>(EMPTY);
  // What this picker last sent up: a different `value` was set from outside
  // (an address opened for editing, or cleared once added).
  const sent = useRef("");
  // Parents pass a new function each render; only a changed address is sent.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  const { cityId, districtId, subDistrictId, detail, districts, subDistricts } = picked;
  const name = (list: Area[], id: number | null) => list.find((a) => a.id === id)?.name;
  const cityName = name(cities, cityId);
  const districtName = name(districts, districtId);
  const subName = name(subDistricts, subDistrictId);
  // The city alone is enough; the parts below it are optional.
  const line = cityName ? [cityName, districtName, subName, detail.trim()].filter(Boolean).join(SEP) : "";

  useEffect(() => {
    getCities().then(setCities, () => setCities([]));
  }, []);

  useEffect(() => {
    if (line === sent.current) return;
    sent.current = line;
    onChangeRef.current(line);
  }, [line]);

  useEffect(() => {
    if (value === sent.current) return;
    sent.current = value;
    let live = true;
    (value ? getCities().then((all) => parse(value, all)) : Promise.resolve(EMPTY))
      .then((next) => live && setPicked(next), () => live && setPicked({ ...EMPTY, detail: value }));
    return () => {
      live = false;
    };
  }, [value]);

  async function pickCity(id: number | null) {
    setPicked({ ...EMPTY, cityId: id, detail });
    if (id) {
      const list = await getDistricts(id).catch(() => []);
      setPicked((p) => (p.cityId === id ? { ...p, districts: list } : p));
    }
  }

  async function pickDistrict(id: number | null) {
    setPicked((p) => ({ ...p, districtId: id, subDistrictId: null, subDistricts: [] }));
    if (id) {
      const list = await getSubDistricts(id).catch(() => []);
      setPicked((p) => (p.districtId === id ? { ...p, subDistricts: list } : p));
    }
  }

  return (
    <div role="group" aria-label={aria["aria-label"]} className="space-y-2">
      <div className="space-y-2">
        <AreaSelect label={t("st.city")} areas={cities} value={cityId} onChange={pickCity} />
        <AreaSelect
          label={t("st.district")}
          areas={districts}
          value={districtId}
          onChange={pickDistrict}
          disabled={!cityId}
        />
        <AreaSelect
          label={t("st.subDistrict")}
          areas={subDistricts}
          value={subDistrictId}
          onChange={(id) => setPicked((p) => ({ ...p, subDistrictId: id }))}
          disabled={!districtId || subDistricts.length === 0}
        />
      </div>
      <Textarea
        rows={3}
        className="min-h-24"
        value={detail}
        onChange={(e) => setPicked((p) => ({ ...p, detail: e.target.value }))}
        maxLength={200}
        placeholder={t("st.addressDetail")}
        aria-label={t("st.addressDetail")}
        aria-invalid={aria["aria-invalid"]}
        aria-describedby={aria["aria-describedby"]}
      />
    </div>
  );
}
