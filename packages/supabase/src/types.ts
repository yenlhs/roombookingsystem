// Re-export Database types from @workspace/types
import type { Database } from '@workspace/types';
export type { Database };

// Supabase specific types
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type Insertable<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type Updatable<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

// Helper type for Supabase responses
export type SupabaseResponse<T> = {
  data: T | null;
  error: Error | null;
};
