import { apiFetch, type ApiListResponse } from "./client";

/** Preset delivery instruction a shopper can tick at checkout. */
export interface DoNote {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getDoNotes() {
  const res = await apiFetch<ApiListResponse<DoNote>>("/doNote");
  return res.data?.rows ?? [];
}
