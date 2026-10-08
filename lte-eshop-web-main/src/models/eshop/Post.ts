import BaseModel from "../BaseModel";
import Company from "../Company";
import PostProduct from "./PostProduct";
import PostAttr from "./PostAttr";
import CartType from "./CartType";
import Category from "./Category";

export default class Post extends BaseModel {
  declare id: string;

  declare companyId: number;

  declare code?: string;

  declare categoryId?: number;

  declare productId: string;

  declare productCode: string;

  declare productName: string;

  declare name: string;

  declare date: string;

  declare note?: string;

  declare startDate?: string;

  declare endDate?: string;

  declare isStock: boolean;

  declare isActive: boolean;

  declare mainPrice: number;

  declare price: number;

  declare qty: number;

  declare orderQty: number;

  declare cartQty: number;

  declare remain: number;

  declare images?: string[];

  declare deepLink?: string;

  declare isHot?: boolean;

  declare cartTypeId: number;

  declare company?: Company;

  declare cartType?: CartType;

  declare postProducts?: Partial<PostProduct>[];

  declare postAttrs?: Partial<PostAttr>[];

  declare category?: Category;
}
