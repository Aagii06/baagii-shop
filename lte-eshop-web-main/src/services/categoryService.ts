import api from "./api";
import Category from "../models/eshop/Category";
import type { Result } from "../types/data";

export const getCategoryTree = async (): Promise<Result<Category[]>> =>
  api.get<Category[]>("/category/getCategoryTree");
