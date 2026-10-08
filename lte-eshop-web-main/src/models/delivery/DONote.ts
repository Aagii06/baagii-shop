import BaseModel from "../BaseModel";

export default class DONote extends BaseModel {
  declare id: number;

  declare name: string;

  declare description?: string;
}
