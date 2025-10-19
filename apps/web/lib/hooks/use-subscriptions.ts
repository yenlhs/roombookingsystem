"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase, createAdminSubscriptionService } from "@workspace/supabase";
import type {
  UserSubscriptionWithTier,
  SubscriptionStatus,
} from "@workspace/types";

interface UseSubscriptionsOptions {
  page?: number;
  perPage?: number;
  status?: SubscriptionStatus[];
  tierIds?: string[];
  search?: string;
  cancelAtPeriodEnd?: boolean;
  expiringInDays?: number;
}

interface SubscriptionsResult {
  data: UserSubscriptionWithTier[];
  total: number;
  page: number;
  totalPages: number;
}

/**
 * Hook to fetch user subscriptions with filtering for admin
 */
export function useSubscriptions(options: UseSubscriptionsOptions = {}) {
  const { data, isLoading, error, refetch } = useQuery<SubscriptionsResult>({
    queryKey: ["admin-subscriptions", options],
    queryFn: async () => {
      const service = createAdminSubscriptionService(supabase);
      return await service.getAllSubscriptionsAdmin(options);
    },
    staleTime: 30 * 1000, // Cache for 30 seconds
    retry: 1,
  });

  return {
    subscriptions: data?.data || [],
    total: data?.total || 0,
    page: data?.page || 1,
    totalPages: data?.totalPages || 0,
    isLoading,
    error,
    refetch,
  };
}
