import BaseModel from "../BaseModel";
import PostAttrValue from "./PostAttrValue";
import Post from "./Post";

export default class PostAttr extends BaseModel {
  declare id: string;

  declare postId: string;

  declare attrId: number;

  declare attrName: string;

  declare orderNumber: number;

  declare viewType: "text" | "iconText" | "image";

  declare postAttrValues?: Partial<PostAttrValue>[];

  declare post?: Post;
}
