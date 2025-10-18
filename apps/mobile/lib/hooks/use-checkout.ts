import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Linking, Alert } from "react-native";
import { createSubscriptionService } from "@workspace/supabase";
import { supabase } from "../supabase";

/**
 * Hook to handle Stripe checkout flow
 */
export function useCheckout() {
	const queryClient = useQueryClient();
	const subscriptionService = createSubscriptionService(supabase);

	const checkoutMutation = useMutation({
		mutationFn: async (tierId: string) => {
			// Get the Supabase URL for redirect URLs
			const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://nladwgkecjkcjsdawzoc.supabase.co';

			const checkoutParams = {
				tier_id: tierId,
				// Stripe requires HTTPS URLs, not custom schemes
				// The subscription status will be updated via webhooks, so users just need to close the browser
				success_url: `${supabaseUrl}/functions/v1/subscription-success`,
				cancel_url: `${supabaseUrl}/functions/v1/subscription-cancel`,
			};

			console.log('Creating checkout session with params:', checkoutParams);

			// Create checkout session via Edge Function
			const session = await subscriptionService.createCheckoutSession(checkoutParams);

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

			// Show helpful message
			Alert.alert(
				"Payment Processing",
				"Your browser will open for payment. After completing the payment, you can return to the app. Your subscription will be activated automatically.",
				[{ text: "OK" }]
			);
		},
		onError: (error: Error) => {
			Alert.alert("Checkout Error", error.message);
		},
	});

	const portalMutation = useMutation({
		mutationFn: async () => {
			// Get the Supabase URL for return URL
			const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://nladwgkecjkcjsdawzoc.supabase.co';

			// Create billing portal session
			const portal = await subscriptionService.createPortalSession({
				return_url: `${supabaseUrl}/functions/v1/subscription-success`,
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
