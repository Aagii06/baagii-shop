import BaseModel from "../BaseModel";
import PostProduct from "./PostProduct";
import Branch from "../Branch";

export default class PostProductBranch extends BaseModel {
  declare id: string;

  declare postProductId: string;

  declare branchId: number;

  declare qty: number;

  declare orderQty: number;

  declare cartQty: number;

  declare remain: number;

  declare postProduct?: PostProduct;

  declare branch?: Branch;
}
