import BaseModel from "../BaseModel";

export default class District extends BaseModel {
  declare id: number;

  declare cityId: number;

  declare code?: string;

  declare name: string;
}
