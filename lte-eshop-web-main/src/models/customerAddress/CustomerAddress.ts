import BaseModel from "../BaseModel";
import AddressType from "./AddressType";

export type CustomerAddressWrite = {
  name?: string;
  addressTypeId: number;
  cityId?: number;
  cityName?: string;
  districtId?: number;
  districtName?: string;
  subDistrictId?: number;
  subDistrictName?: string;
  street?: string;
  apartment?: string;
  door?: string;
  note?: string;
  address?: string;
  lat?: string;
  long?: string;
  isMain?: boolean;
};

export default class CustomerAddress extends BaseModel {
  declare id: number;

  declare name?: string;

  declare customerId: number;

  declare customerCode: string;

  declare customerName: string;

  declare customerPhone: string;

  declare addressTypeId: number;

  declare cityId?: number;

  declare cityName?: string;

  declare districtId?: number;

  declare districtName?: string;

  declare subDistrictId?: number;

  declare subDistrictName?: string;

  declare street?: string;

  declare apartment?: string;

  declare door?: string;

  declare note?: string;

  declare address?: string;

  declare lat?: string;

  declare long?: string;

  declare isMain: boolean;

  declare addressType?: AddressType;
}
