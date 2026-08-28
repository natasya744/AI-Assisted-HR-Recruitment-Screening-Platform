export type Environment = {
  apiBaseUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
};

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
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
};