import api from "./api";
import DONote from "../models/delivery/DONote";
import type { Result, ListResult } from "../types/data";

export const getDONotes = async (): Promise<Result<ListResult<DONote>>> =>
  api.get<ListResult<DONote>>("/doNote");
