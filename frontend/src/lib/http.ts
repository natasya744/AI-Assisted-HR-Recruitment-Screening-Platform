import { supabase } from "@/lib/supabase";

export class ApiError extends Error {
  status: number;
  data: unknown;
  isNetworkError: boolean;

  constructor(message: string, status: number, data: unknown, isNetworkError: boolean) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    this.isNetworkError = isNetworkError;
  }
}

const DEFAULT_TIMEOUT = 120_000;

async function executeFetch(
  method: string,
  url: string,
  body: unknown,
  token: string | undefined,
  signal: AbortSignal,
  init?: RequestInit & { timeout?: number },
): Promise<Response> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (body !== undefined && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return fetch(url, {
    method,
    headers,
    body:
      body instanceof FormData
        ? body
        : body !== undefined
          ? JSON.stringify(body)
          : undefined,
    signal,
    ...init,
  });
}

async function doFetch(
  method: string,
  url: string,
  body?: unknown,
  init?: RequestInit & { timeout?: number },
): Promise<Response> {
  const timeout = init?.timeout ?? DEFAULT_TIMEOUT;

  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    let response = await executeFetch(method, url, body, token, controller.signal, init);

    // If token was rejected (e.g. expired or revoked session), try refreshing once
    if (response.status === 401 && token) {
      const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
      const newToken = refreshed.session?.access_token;

      if (!refreshError && newToken) {
        response = await executeFetch(method, url, body, newToken, controller.signal, init);
      }

      if (response.status === 401) {
        // Session no longer exists on Supabase; clear local auth state so UI redirects to /login
        await supabase.auth.signOut({ scope: "local" });
      }
    }

    if (!response.ok) {
      let errorData: unknown;
      try {
        errorData = await response.json();
      } catch {
        errorData = await response.text().catch(() => null);
      }
      throw new ApiError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData,
        false,
      );
    }

    return response;
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("Request timed out", 0, null, true);
    }
    throw new ApiError(
      error instanceof Error ? error.message : "Network error",
      0,
      null,
      true,
    );
  } finally {
    clearTimeout(timer);
  }
}

export async function apiRequest<T>(
  method: string,
  url: string,
  body?: unknown,
  init?: RequestInit & { timeout?: number },
): Promise<T> {
  const response = await doFetch(method, url, body, init);

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function apiRequestBlob(
  method: string,
  url: string,
  body?: unknown,
  init?: RequestInit & { timeout?: number },
): Promise<Blob> {
  const response = await doFetch(method, url, body, init);
  return response.blob();
}
