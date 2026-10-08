import api from "./api";
import AppUser from "../models/AppUser";
import type { Result } from "../types/data";

export const login = async (
  userName: string,
  pin: string,
): Promise<Result<{ user: AppUser; token: string }>> =>
  api.post<{ user: AppUser; token: string }>("/auth/login", { userName, pin });

export const register = async (userName: string): Promise<Result<AppUser>> =>
  api.post<AppUser>("/auth/register", { userName });

export const loginGuest = async (): Promise<
  Result<{ guestId: string; token: string }>
> => api.post<{ guestId: string; token: string }>("/auth/loginGuest");

export type AuthUserData = {
  user: AppUser;
};

export const getUserData = async (): Promise<Result<AuthUserData>> =>
  api.get<AuthUserData>("/auth/getUserData");
