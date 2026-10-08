import BaseModel from "../BaseModel";

export default class SubDistrict extends BaseModel {
  declare id: number;

  declare districtId: number;

  declare code?: string;

  declare name: string;
}
