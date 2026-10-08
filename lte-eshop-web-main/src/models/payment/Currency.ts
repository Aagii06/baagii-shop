import BaseModel from "../BaseModel";

export default class Currency extends BaseModel {
  declare id: number;
  declare code: string;
  declare name: string;
  declare nameEng?: string;
  declare symbol?: string;
  declare icon?: string;
  declare rate?: number;
}
