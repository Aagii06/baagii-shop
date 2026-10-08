import BaseModel from "../BaseModel";
import Post from "./Post";
import PostProductBranch from "./PostProductBranch";

export default class PostProduct extends BaseModel {
  declare id: number;

  declare postId: number;

  declare productId: number;

  declare productCode: string;

  declare productName: string;

  declare variantId: number;

  declare variantCode: string;

  declare variantName: string;

  declare image?: string;

  declare images?: string[] | null;

  declare qty: number;

  declare orderQty: number;

  declare cartQty: number;

  declare remain: number;

  declare price: number;

  declare mainPrice: number;

  declare attr: Record<string, string>;

  declare post?: Post;

  declare postProductBranches?: Partial<PostProductBranch>[];
}
