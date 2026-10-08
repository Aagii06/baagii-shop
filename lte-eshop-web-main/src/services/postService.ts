import api from "./api";
import Post from "../models/eshop/Post";
import type { Result, ListResult } from "../types/data";

export const getPosts = async ({
  categoryId,
}: {
  categoryId?: number;
} = {}): Promise<Result<ListResult<Post>>> => {
  const query =
    categoryId != null ? `?categoryId=${encodeURIComponent(categoryId)}` : "";
  return api.get<ListResult<Post>>(`/post${query}`);
};

export const getPost = async (id: number): Promise<Result<Post>> =>
  api.get<Post>(`/post/${id}`);
