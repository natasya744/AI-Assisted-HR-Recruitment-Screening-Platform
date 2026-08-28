import { ApiError, apiRequest } from "./http";
import { env } from "./env";

type RequestInitWithTimeout = RequestInit & { timeout?: number };

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  init?: RequestInitWithTimeout,
): Promise<T> {
  return apiRequest<T>(method, `${env.apiBaseUrl}${path}`, body, init);
}

export const api = {
  get<T>(path: string, init?: RequestInitWithTimeout): Promise<T> {
    return request<T>("GET", path, undefined, init);
  },

  post<T>(path: string, body?: unknown, init?: RequestInitWithTimeout): Promise<T> {
    return request<T>("POST", path, body, init);
  },

  put<T>(path: string, body?: unknown, init?: RequestInitWithTimeout): Promise<T> {
    return request<T>("PUT", path, body, init);
  },

  patch<T>(path: string, body?: unknown, init?: RequestInitWithTimeout): Promise<T> {
    return request<T>("PATCH", path, body, init);
  },

  delete<T>(path: string, init?: RequestInitWithTimeout): Promise<T> {
    return request<T>("DELETE", path, undefined, init);
  },
};

export type { ApiError };
export { apiRequest } from "./http";