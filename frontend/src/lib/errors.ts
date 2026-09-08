import { ApiError } from "./http";

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const data = error.data as { detail?: unknown } | null;
    if (data && typeof data.detail === "string") return data.detail;
    if (data && Array.isArray(data.detail)) {
      return data.detail
        .map((item) => (item as { msg?: string }).msg ?? "")
        .filter(Boolean)
        .join(", ");
    }
    if (error.isNetworkError) return "Cannot reach the server. Please try again.";
    return error.message;
  }
  return error instanceof Error ? error.message : "Something went wrong.";
}