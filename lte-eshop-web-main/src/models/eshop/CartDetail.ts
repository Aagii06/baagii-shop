import BaseModel from "../BaseModel";
import Cart from "./Cart";
import Post from "./Post";
import Branch from "../Branch";
import PostProduct from "./PostProduct";

export default class CartDetail extends BaseModel {
  declare id: string;

  declare cartId: string;

  declare branchId: number;

  declare postId?: string;

  declare postProductId?: string;

  declare productId: string;

  declare productCode: string;

  declare productName: string;

  declare variantId: string;

  declare variantCode: string;

  declare variantName: string;

  declare image?: string;

  declare price: number;

  declare qty: number;

  declare amount: number;

  declare cart?: Cart;

  declare branch?: Branch;

  declare post?: Post;

  declare postProduct?: PostProduct;
}
