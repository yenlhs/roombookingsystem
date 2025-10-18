import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Linking, Alert } from "react-native";
import { createSubscriptionService } from "@workspace/supabase";
import { useSupabase } from "../auth/context";

/**
 * Hook to handle Stripe checkout flow
 */
export function useCheckout() {
	const supabase = useSupabase();
	const queryClient = useQueryClient();
	const subscriptionService = createSubscriptionService(supabase);

	const checkoutMutation = useMutation({
		mutationFn: async (tierId: string) => {
			// Create checkout session via Edge Function
			const session = await subscriptionService.createCheckoutSession({
				tier_id: tierId,
				// For mobile, we'll open in browser and redirect back
				success_url: "myapp://subscription/success",
				cancel_url: "myapp://subscription/cancel",
			});

			// Open Stripe checkout in browser
			if (session.url) {
				const canOpen = await Linking.canOpenURL(session.url);
				if (canOpen) {
					await Linking.openURL(session.url);
				} else {
					throw new Error("Cannot open checkout URL");
				}
			} else {
				throw new Error("No checkout URL returned");
			}

			return session;
		},
		onSuccess: () => {
			// Invalidate subscription queries to refetch latest data
			queryClient.invalidateQueries({ queryKey: ["user-subscription"] });
		},
		onError: (error: Error) => {
			Alert.alert("Checkout Error", error.message);
		},
	});

	const portalMutation = useMutation({
		mutationFn: async () => {
			// Create billing portal session
			const portal = await subscriptionService.createPortalSession({
				return_url: "myapp://subscription",
			});

			// Open Stripe portal in browser
			if (portal.url) {
				const canOpen = await Linking.canOpenURL(portal.url);
				if (canOpen) {
					await Linking.openURL(portal.url);
				} else {
					throw new Error("Cannot open portal URL");
				}
			} else {
				throw new Error("No portal URL returned");
			}

			return portal;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["user-subscription"] });
		},
		onError: (error: Error) => {
			Alert.alert("Portal Error", error.message);
		},
	});

	return {
		startCheckout: checkoutMutation.mutate,
		isCheckingOut: checkoutMutation.isPending,
		openBillingPortal: portalMutation.mutate,
		isOpeningPortal: portalMutation.isPending,
	};
}
