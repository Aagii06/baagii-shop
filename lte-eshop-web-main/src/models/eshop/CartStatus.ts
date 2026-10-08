import BaseModel from "../BaseModel";

export default class CartStatus extends BaseModel {
  declare id: number;

  declare code: string;

  declare name: string;

  declare style?: Record<string, any>;

  declare icon?: string;
}
