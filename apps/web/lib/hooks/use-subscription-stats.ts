'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase, createSubscriptionService } from '@workspace/supabase';

interface SubscriptionStats {
  total_subscriptions: number;
  active_subscriptions: number;
  premium_subscriptions: number;
  mrr: number;
  churn_rate: number;
}

/**
 * Hook to fetch subscription statistics for admin dashboard
 */
export function useSubscriptionStats() {
  const { data, isLoading, error, refetch } = useQuery<SubscriptionStats>({
    queryKey: ['subscription-stats'],
    queryFn: async () => {
      const service = createSubscriptionService(supabase);
      return await service.getSubscriptionStats();
    },
    staleTime: 30 * 1000, // Cache for 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
    retry: 1,
  });

  return {
    stats: data,
    isLoading,
    error,
    refetch,
  };
}
