import BaseModel from "../BaseModel";
import PostAttr from "./PostAttr";

export default class PostAttrValue extends BaseModel {
  declare id: number;

  declare postAttrId: string;

  declare attrValueId?: number;

  declare value: string;

  declare color?: string;

  declare image?: string;

  declare images?: string[];

  declare orderNumber: number;

  declare postAttr?: PostAttr;
}
