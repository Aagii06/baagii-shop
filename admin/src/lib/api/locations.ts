import { apiFetch, type ApiListResponse } from "./client";

// The location tree (../backend `/location`, the same one the web shop's
// address form reads), one level at a time:
//   GET /location/cities                         Аймаг/Нийслэл
//   GET /location/districts?cityId={id}          Сум/Дүүрэг
//   GET /location/subDistricts?districtId={id}   Баг/Хороо

export interface Area {
  id: number;
  code: string | null;
  name: string;
}

// The tree never changes while the admin is open: each level is fetched once.
const cache = new Map<string, Promise<Area[]>>();

function areas(path: string): Promise<Area[]> {
  let rows = cache.get(path);
  if (!rows) {
    rows = apiFetch<ApiListResponse<Area>>(path).then((res) => res.data?.rows ?? []);
    rows.catch(() => cache.delete(path));
    cache.set(path, rows);
  }
  return rows;
}

export const getCities = () => areas("/location/cities");
export const getDistricts = (cityId: number) => areas(`/location/districts?cityId=${cityId}`);
export const getSubDistricts = (districtId: number) => areas(`/location/subDistricts?districtId=${districtId}`);
