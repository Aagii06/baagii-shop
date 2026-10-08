import BaseModel from "./BaseModel";
import Branch from "./Branch";
export default class Company extends BaseModel {
  declare id: number;

  declare code: string;

  declare name: string;

  declare register?: string;

  declare image?: string;

  declare address?: string;

  declare phone?: string;

  declare email?: string;

  declare branches?: Partial<Branch>[];

  static defaultField = "";
}
