import { apiFetch } from "./client";

interface ApiListResponse<T> {
  success: boolean;
  message: string;
  data: {
    rows: T[];
    count: number;
    summary: unknown[];
  };
}

/** One level of the delivery location tree (city, district or khoroo). */
export interface AddressArea {
  id: number;
  code: string | null;
  name: string;
}

/** Address category (Гэр, Ажил, …) with the badge colours to show it in. */
export interface AddressType {
  id: number;
  code: string | null;
  name: string;
  style: { bgColor?: string; txtColor?: string } | null;
  icon: string | null;
}

export async function getAddressTypes(): Promise<AddressType[]> {
  const res = await apiFetch<ApiListResponse<AddressType>>(
    "/customerAddress/addressTypes"
  );
  return res.data.rows;
}

// `GET /customerAddress` (list) and `POST /customerAddress` (create) exist
// too, but both answer "Харилцагчийн мэдээлэл олдсонгүй" for a guest token,
// so they aren't wired in until checkout has a real customer session.

// The location tree is fetched one level at a time, each call keyed by the
// parent picked in the previous one: cities → districts → subDistricts.
// All three are GET and need a (guest) auth token; omitting the parent id
// fails with `success: false` ("Хот сонгоно уу" / "Дүүрэг сонгоно уу").

export async function getCities(): Promise<AddressArea[]> {
  const res = await apiFetch<ApiListResponse<AddressArea>>(
    "/customerAddress/cities"
  );
  return res.data.rows;
}

export async function getDistricts(cityId: number): Promise<AddressArea[]> {
  const res = await apiFetch<ApiListResponse<AddressArea>>(
    `/customerAddress/districts?cityId=${cityId}`
  );
  return res.data.rows;
}

export async function getSubDistricts(
  districtId: number
): Promise<AddressArea[]> {
  const res = await apiFetch<ApiListResponse<AddressArea>>(
    `/customerAddress/subDistricts?districtId=${districtId}`
  );
  return res.data.rows;
}
