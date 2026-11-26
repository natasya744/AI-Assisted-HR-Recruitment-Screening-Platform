export type AppMode = "public" | "internal";

export type Environment = {
  apiBaseUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  appMode: AppMode;
};

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function requireAppMode(value: string | undefined): AppMode {
  const raw = requireEnv("VITE_APP_MODE", value);
  if (raw !== "public" && raw !== "internal") {
    throw new Error(`Invalid VITE_APP_MODE: ${raw}. Expected "public" or "internal".`);
  }
  return raw;
}

export const env: Environment = {
  apiBaseUrl: requireEnv(
    "VITE_API_BASE_URL",
    import.meta.env.VITE_API_BASE_URL,
  ),
  supabaseUrl: requireEnv(
    "VITE_SUPABASE_URL",
    import.meta.env.VITE_SUPABASE_URL,
  ),
  supabaseAnonKey: requireEnv(
    "VITE_SUPABASE_ANON_KEY",
    import.meta.env.VITE_SUPABASE_ANON_KEY,
  ),
  appMode: requireAppMode(import.meta.env.VITE_APP_MODE),
};
