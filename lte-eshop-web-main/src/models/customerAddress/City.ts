import BaseModel from "../BaseModel";

export default class City extends BaseModel {
  declare id: number;

  declare code?: string;

  declare name: string;
}
