import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { useSubscription } from "../../lib/hooks/use-subscription";
import { useCheckout } from "../../lib/hooks/use-checkout";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";

export default function SubscriptionScreen() {
  const router = useRouter();
  const { subscription, premiumTier, isLoading, isPremium } = useSubscription();
  const { startCheckout, isCheckingOut, openBillingPortal, isOpeningPortal } =
    useCheckout();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  // Debug logging
  console.log("Subscription screen - isPremium:", isPremium);
  console.log("Subscription screen - subscription:", subscription);
  console.log("Subscription screen - tier:", subscription?.tier);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Stack.Screen options={{ title: "Subscription" }} />
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  const handleUpgrade = () => {
    if (premiumTier) {
      setSelectedTier(premiumTier.id);
      startCheckout(premiumTier.id);
    }
  };

  const handleManageSubscription = () => {
    openBillingPortal();
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <Stack.Screen
        options={{
          title: "Subscription",
          headerBackTitle: "Back",
        }}
      />

      <View className="p-4">
        {/* Current Plan Card */}
        <View className="bg-white rounded-xl p-6 mb-4 shadow-sm">
          <Text className="text-sm text-gray-600 mb-1">Current Plan</Text>
          <Text className="text-3xl font-bold text-blue-600 mb-2">
            {isPremium ? "Premium" : "Free"}
          </Text>
          {isPremium && subscription?.current_period_end && (
            <Text className="text-sm text-gray-600">
              Renews on{" "}
              {new Date(subscription.current_period_end).toLocaleDateString(
                "en-US",
                {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                },
              )}
            </Text>
          )}
        </View>

        {/* Premium Upsell (for free users) */}
        {!isPremium && premiumTier && (
          <View className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-6 mb-4 shadow-md">
            <View className="flex-row items-center mb-3">
              <Ionicons name="star" size={32} color="white" />
              <Text className="text-white text-2xl font-bold ml-2">
                Go Premium
              </Text>
            </View>

            <Text className="text-white text-5xl font-bold mb-1">
              ${premiumTier.price_monthly}
            </Text>
            <Text className="text-white text-lg mb-6">per month</Text>

            {/* Features List */}
            <View className="space-y-3 mb-6">
              <FeatureItem
                icon="lock-open"
                text="Access to exclusive premium rooms"
              />
              <FeatureItem icon="calendar" text="Book up to 10 rooms at once" />
              <FeatureItem icon="star-outline" text="Priority booking" />
              <FeatureItem icon="headset" text="Premium support" />
            </View>

            {/* Upgrade Button */}
            <Pressable
              onPress={handleUpgrade}
              disabled={isCheckingOut}
              className="bg-white rounded-xl py-4 items-center active:opacity-80"
            >
              {isCheckingOut && selectedTier === premiumTier.id ? (
                <ActivityIndicator color="#3b82f6" />
              ) : (
                <Text className="text-blue-600 font-bold text-lg">
                  Upgrade to Premium
                </Text>
              )}
            </Pressable>

            <Text className="text-white text-xs text-center mt-4 opacity-80">
              Cancel anytime. Secure payment via Stripe.
            </Text>
          </View>
        )}

        {/* Manage Subscription (for premium users) */}
        {isPremium && (
          <View className="bg-white rounded-xl p-6 mb-4 shadow-sm">
            <View className="flex-row items-center mb-4">
              <Ionicons name="settings-outline" size={24} color="#3b82f6" />
              <Text className="text-lg font-semibold ml-2">
                Subscription Management
              </Text>
            </View>

            <Text className="text-gray-600 mb-4">
              Manage your subscription, update payment method, or cancel
              anytime.
            </Text>

            <Pressable
              onPress={handleManageSubscription}
              disabled={isOpeningPortal}
              className="bg-blue-600 rounded-xl py-4 items-center active:opacity-80"
            >
              {isOpeningPortal ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold text-base">
                  Manage Subscription
                </Text>
              )}
            </Pressable>
          </View>
        )}

        {/* Benefits Overview */}
        <View className="bg-white rounded-xl p-6 shadow-sm">
          <Text className="text-lg font-semibold mb-4">
            What you get with Premium
          </Text>

          <BenefitItem
            icon="home"
            title="Exclusive Rooms"
            description="Access to premium meeting rooms and event spaces"
          />
          <BenefitItem
            icon="time"
            title="Flexible Booking"
            description="Book multiple rooms simultaneously"
          />
          <BenefitItem
            icon="flash"
            title="Priority Access"
            description="Book popular rooms before anyone else"
          />
          <BenefitItem
            icon="chatbubbles"
            title="Premium Support"
            description="Get help from our support team 24/7"
          />
        </View>
      </View>
    </ScrollView>
  );
}

// Feature item component (for premium card)
function FeatureItem({ icon, text }: { icon: any; text: string }) {
  return (
    <View className="flex-row items-center">
      <Ionicons name={icon} size={22} color="white" />
      <Text className="text-white ml-3 text-base">{text}</Text>
    </View>
  );
}

// Benefit item component (for benefits list)
function BenefitItem({
  icon,
  title,
  description,
}: {
  icon: any;
  title: string;
  description: string;
}) {
  return (
    <View className="flex-row mb-4">
      <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3">
        <Ionicons name={icon} size={20} color="#3b82f6" />
      </View>
      <View className="flex-1">
        <Text className="font-semibold text-gray-900 mb-1">{title}</Text>
        <Text className="text-sm text-gray-600">{description}</Text>
      </View>
    </View>
  );
}
