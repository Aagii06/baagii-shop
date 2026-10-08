import BaseModel from "../BaseModel";

export default class Category extends BaseModel {
  declare id: number;
  declare parentId?: number;
  declare code?: string;
  declare name: string;
  declare image?: string;
  declare style?: Record<string, any>;
  declare children?: Category[];
}
