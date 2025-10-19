import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSubscription } from "../lib/hooks/use-subscription";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

/**
 * Banner component to promote premium subscription
 * Only shows for free users
 */
export function SubscriptionBanner() {
  const { isPremium, isLoading } = useSubscription();
  const router = useRouter();

  // Don't show banner for premium users or while loading
  if (isPremium || isLoading) {
    return null;
  }

  return (
    <Pressable
      onPress={() => router.push("/subscription")}
      className="mx-4 mt-4 mb-2 overflow-hidden rounded-xl shadow-md active:opacity-90"
    >
      <LinearGradient
        colors={["#3b82f6", "#8b5cf6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="flex-row items-center p-4"
      >
        <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center">
          <Ionicons name="star" size={24} color="white" />
        </View>
        <View className="ml-4 flex-1">
          <Text className="text-white font-bold text-base mb-0.5">
            Unlock Premium Rooms
          </Text>
          <Text className="text-white/90 text-sm">
            Get access to exclusive spaces
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color="white" />
      </LinearGradient>
    </Pressable>
  );
}
