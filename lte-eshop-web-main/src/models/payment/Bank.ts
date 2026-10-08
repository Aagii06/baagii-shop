import BaseModel from "../BaseModel";

export default class Bank extends BaseModel {
  declare id: number;
  declare code?: string;
  declare name: string;
  declare nameEng: string;
  declare icon?: string;
}
