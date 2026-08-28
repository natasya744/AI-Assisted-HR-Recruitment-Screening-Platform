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

const DEFAULT_TIMEOUT = 15_000;

export async function apiRequest<T>(
  method: string,
  url: string,
  body?: unknown,
  init?: RequestInit & { timeout?: number },
): Promise<T> {
  const timeout = init?.timeout ?? DEFAULT_TIMEOUT;

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (body !== undefined && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method,
      headers,
      body:
        body instanceof FormData
          ? body
          : body !== undefined
            ? JSON.stringify(body)
            : undefined,
      signal: controller.signal,
      ...init,
    });

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

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
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