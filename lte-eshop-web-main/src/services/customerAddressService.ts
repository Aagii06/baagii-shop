import api from "./api";
import AddressType from "../models/customerAddress/AddressType";
import City from "../models/customerAddress/City";
import CustomerAddress, {
  type CustomerAddressWrite,
} from "../models/customerAddress/CustomerAddress";
import District from "../models/customerAddress/District";
import SubDistrict from "../models/customerAddress/SubDistrict";
import type { Result, ListResult } from "../types/data";

export type { CustomerAddressWrite };

export const getCities = async (): Promise<Result<ListResult<City>>> =>
  api.get<ListResult<City>>("/customerAddress/cities");

export const getDistricts = async (
  cityId: number,
): Promise<Result<ListResult<District>>> =>
  api.get<ListResult<District>>(
    `/customerAddress/districts?cityId=${encodeURIComponent(cityId)}`,
  );

export const getSubDistricts = async (
  districtId: number,
): Promise<Result<ListResult<SubDistrict>>> =>
  api.get<ListResult<SubDistrict>>(
    `/customerAddress/subDistricts?districtId=${encodeURIComponent(districtId)}`,
  );

export const getAddressTypes = async (): Promise<
  Result<ListResult<AddressType>>
> => api.get<ListResult<AddressType>>("/customerAddress/addressTypes");

export const getCustomerAddresses = async (): Promise<
  Result<ListResult<CustomerAddress>>
> => api.get<ListResult<CustomerAddress>>("/customerAddress");

export const getCustomerAddress = async (
  id: number,
): Promise<Result<CustomerAddress>> =>
  api.get<CustomerAddress>(`/customerAddress/${id}`);

export const createCustomerAddress = async (
  data: CustomerAddressWrite,
): Promise<Result<CustomerAddress>> =>
  api.post<CustomerAddress>("/customerAddress", data);

export const updateCustomerAddress = async (
  id: number,
  data: CustomerAddressWrite,
): Promise<Result<CustomerAddress>> =>
  api.put<CustomerAddress>(`/customerAddress/${id}`, data);
