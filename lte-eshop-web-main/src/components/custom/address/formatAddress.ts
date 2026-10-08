import type CustomerAddress from "../../../models/customerAddress/CustomerAddress";

export function formatAddressLine(addr: CustomerAddress): string {
  return [
    addr.cityName,
    addr.districtName,
    addr.subDistrictName,
    addr.street,
    addr.apartment,
    addr.door,
    addr.address,
  ]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");
}
