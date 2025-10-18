import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createSubscriptionService } from "@workspace/supabase";
import { supabase } from "../supabase";
import type { UserSubscriptionWithTier, SubscriptionTier } from "@workspace/types";

/**
 * Hook to manage user subscription state
 */
export function useSubscription() {
	const subscriptionService = createSubscriptionService(supabase);

	// Get current user's subscription
	const {
		data: subscription,
		isLoading: isLoadingSubscription,
		error: subscriptionError,
	} = useQuery<UserSubscriptionWithTier | null>({
		queryKey: ["user-subscription"],
		queryFn: async () => {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) return null;
			return subscriptionService.getUserSubscription(user.id);
		},
	});

	// Get available subscription tiers
	const {
		data: tiers,
		isLoading: isLoadingTiers,
		error: tiersError,
	} = useQuery<SubscriptionTier[]>({
		queryKey: ["subscription-tiers"],
		queryFn: () => subscriptionService.getTiers(),
	});

	// Derived values
	const hasExclusiveAccess =
		subscription?.tier?.features?.exclusive_rooms === true;
	const isPremium =
		hasExclusiveAccess &&
		["active", "trialing"].includes(subscription?.status || "");
	const isLoading = isLoadingSubscription || isLoadingTiers;

	// Get premium tier
	const premiumTier = tiers?.find((t) => t.name === "premium");
	const freeTier = tiers?.find((t) => t.name === "free");

	// Check if subscription is expired or expiring soon
	const isExpired =
		subscription?.current_period_end &&
		new Date(subscription.current_period_end) < new Date();
	const expiresIn7Days =
		subscription?.current_period_end &&
		new Date(subscription.current_period_end) <
			new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

	return {
		subscription,
		tiers,
		premiumTier,
		freeTier,
		isLoading,
		isPremium,
		hasExclusiveAccess,
		isExpired,
		expiresIn7Days,
		error: subscriptionError || tiersError,
	};
}
