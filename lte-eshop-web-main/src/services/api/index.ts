import axios, { type ResponseType, type Method } from "axios";
import { parseCookies } from "nookies";
import type { Result } from "../../types/data";
import { serverBaseUrl } from "../../constant/config";

const api = axios.create();

api.interceptors.request.use((config) => {
  config.baseURL = `${serverBaseUrl}`;

  const jar = parseCookies();
  const token = jar?.jwt as string | undefined;

  config.headers = config.headers ?? {};
  if (token) {
    (config.headers as Record<string, string>)["authorization"] =
      "Bearer " + token;
  }
  return config;
});

export const call = async <T>({
  url,
  data,
  method,
  token,
  headers,
  responseType,
}: {
  url: string;
  data?: unknown;
  method?: Method;
  token?: string;
  headers?: Record<string, any>;
  responseType?: ResponseType;
}): Promise<Result<T>> => {
  try {
    if (!headers) {
      headers = {};
    }
    if (token) {
      headers.authorization = "Bearer " + token;
    }
    if (!responseType) {
      responseType = "json";
    }
    const res = await api({
      method: method || "POST",
      headers,
      url,
      data,
      responseType: responseType || "json",
    });

    return res.data as Result<T>;
  } catch (ex) {
    console.error(ex);
    return {
      data: null,
      message: "Хүсэлт илгээхэд алдаа гарлаа.",
      success: false,
    };
  }
};

export const get = <T>(
  url: string,
  data?: any,
  headers?: Record<string, any>,
) => call<T>({ url, method: "GET", data, headers });

export const post = <T>(
  url: string,
  data?: any,
  headers?: Record<string, any>,
) => call<T>({ url, method: "POST", data, headers });

export const put = <T>(
  url: string,
  data?: any,
  headers?: Record<string, any>,
) => call<T>({ url, method: "PUT", data, headers });

export const del = <T>(
  url: string,
  data?: any,
  headers?: Record<string, any>,
) => call<T>({ url, method: "DELETE", data, headers });

export default {
  call,
  get,
  post,
  put,
  del,
};
