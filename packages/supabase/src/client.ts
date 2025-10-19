import { createClient } from "@supabase/supabase-js";
import type { Database } from "@workspace/types";

// Environment variables will be provided by the consuming app
// These are placeholders and should be overridden
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  "";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  "";

/**
 * Create a Supabase client
 * This function can be used in both web and mobile apps
 */
export function createSupabaseClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

/**
 * Create a Supabase client with custom configuration
 */
export function createSupabaseClientWithConfig(url: string, anonKey: string) {
  return createClient<Database>(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

// Export a singleton instance (will be initialized by the consuming app)
export const supabase = createSupabaseClient();

// Export the type for the client
export type SupabaseClient = ReturnType<typeof createSupabaseClient>;
