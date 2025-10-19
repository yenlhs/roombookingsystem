'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@workspace/supabase';
import { useAuth } from '../auth/context';

interface UserRole {
  role: 'admin' | 'user';
}

/**
 * Hook to check if the current user has admin role
 * Fetches user role from public.users table
 */
export function useAdmin() {
  const { user, loading: authLoading } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('No user ID available');
      }

      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) {
        throw error;
      }

      return data as UserRole;
    },
    enabled: !!user?.id && !authLoading,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  });

  return {
    isAdmin: data?.role === 'admin',
    role: data?.role,
    isLoading: authLoading || isLoading,
    error,
  };
}
