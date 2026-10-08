import BaseModel from "./BaseModel";
import Company from "./Company";

export default class Branch extends BaseModel {
  declare id: number;

  declare companyId: number;

  declare code: string;

  declare name: string;

  declare description?: string;

  declare address?: string;

  declare image?: string;

  declare company?: Company;

  static defaultField = "";
}
