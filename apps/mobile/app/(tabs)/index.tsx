import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import Animated from "react-native-reanimated";
import { useRouter } from "expo-router";
import { useAuth } from "../../lib/auth/context";
import { useSlideUp, useListItemAnimation } from "../../lib/animations";
import { supabase } from "../../lib/supabase";
import { createBookingService } from "@workspace/supabase";
import type { BookingWithDetails } from "@workspace/types";
import { lightImpact } from "../../lib/haptics";

// Helper functions
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatTime = (timeString: string): string => {
  const [hours, minutes] = timeString.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

// Simplified Booking Card for Home Screen
function UpcomingBookingCard({
  booking,
  index,
  onPress,
}: {
  booking: BookingWithDetails;
  index: number;
  onPress: (booking: BookingWithDetails) => void;
}) {
  const animatedStyle = useListItemAnimation(index);

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        onPress={() => {
          lightImpact();
          onPress(booking);
        }}
        activeOpacity={0.7}
      >
        <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
          {/* Room Name & Date */}
          <View className="mb-3">
            <Text className="text-xl font-bold text-gray-900 mb-1">
              {booking.room?.name || "Unknown Room"}
            </Text>
            <Text className="text-sm text-gray-600">
              {formatDate(booking.booking_date)}
            </Text>
          </View>

          {/* Time & Details */}
          <View className="border-t border-gray-100 pt-3 space-y-2">
            <View className="flex-row items-center">
              <Text className="text-2xl mr-2">🕐</Text>
              <Text className="text-sm text-gray-700 font-medium">
                {formatTime(booking.start_time)} -{" "}
                {formatTime(booking.end_time)}
              </Text>
            </View>

            {booking.room?.capacity && (
              <View className="flex-row items-center">
                <Text className="text-2xl mr-2">👥</Text>
                <Text className="text-sm text-gray-700 font-medium">
                  Capacity: {booking.room.capacity} seats
                </Text>
              </View>
            )}

            {booking.notes && (
              <View className="flex-row items-start">
                <Text className="text-2xl mr-2">📝</Text>
                <Text className="text-sm text-gray-700 flex-1">
                  {booking.notes}
                </Text>
              </View>
            )}
          </View>

          {/* Status Badge */}
          <View className="mt-3 pt-3 border-t border-gray-100">
            <View className="bg-blue-100 px-3 py-1 rounded-full self-start">
              <Text className="text-xs font-semibold text-blue-800 uppercase">
                Upcoming
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [upcomingBookings, setUpcomingBookings] = useState<
    BookingWithDetails[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const bookingService = createBookingService(supabase);

  const welcomeCardAnimation = useSlideUp(0, 500);

  useEffect(() => {
    loadUpcomingBookings();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("home-bookings-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
        },
        (payload) => {
          console.log("Booking change received on home:", payload);
          loadUpcomingBookings();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadUpcomingBookings = async () => {
    try {
      setLoading(true);
      const bookings = await bookingService.getMyUpcomingBookings();
      setUpcomingBookings(bookings);
    } catch (err) {
      console.error("Failed to load upcoming bookings:", err);
      Alert.alert("Error", "Failed to load upcoming bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUpcomingBookings();
    setRefreshing(false);
  };

  const handleBookingPress = (booking: BookingWithDetails) => {
    // Navigate to booking detail screen
    router.push(`/booking-details/${booking.id}` as any);
  };

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView
        className="flex-1 p-6"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Welcome Card */}
        <Animated.View
          style={welcomeCardAnimation}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-6"
        >
          <Text className="text-3xl font-bold text-gray-900 mb-3">
            Welcome Home
          </Text>
          <Text className="text-base text-gray-600 mb-2">
            Here are your upcoming bookings
          </Text>
          <Text className="text-sm text-gray-500">{user?.email}</Text>
        </Animated.View>

        {/* Upcoming Bookings Section */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-gray-900">
              Upcoming Bookings
            </Text>
            {upcomingBookings.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  lightImpact();
                  router.push("/(tabs)/bookings");
                }}
              >
                <Text className="text-blue-600 font-semibold">View All</Text>
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <View className="bg-white rounded-2xl p-12 items-center justify-center shadow-sm border border-gray-200">
              <ActivityIndicator size="large" color="#2563eb" />
              <Text className="text-gray-500 mt-4">Loading bookings...</Text>
            </View>
          ) : upcomingBookings.length === 0 ? (
            <View className="bg-white rounded-2xl p-8 items-center justify-center shadow-sm border border-gray-200">
              <Text className="text-6xl mb-4">📅</Text>
              <Text className="text-lg font-semibold text-gray-900 mb-2">
                No Upcoming Bookings
              </Text>
              <Text className="text-sm text-gray-600 text-center mb-4">
                You don't have any upcoming room bookings
              </Text>
              <TouchableOpacity
                onPress={() => {
                  lightImpact();
                  router.push("/(tabs)/rooms");
                }}
                className="bg-blue-600 rounded-lg px-6 py-3"
              >
                <Text className="text-white font-semibold">Browse Rooms</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="gap-4">
              {upcomingBookings.map((booking, index) => (
                <UpcomingBookingCard
                  key={booking.id}
                  booking={booking}
                  index={index}
                  onPress={handleBookingPress}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
