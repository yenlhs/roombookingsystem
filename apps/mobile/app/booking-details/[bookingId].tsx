import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import {
  createBookingService,
  createNotificationService,
} from "@workspace/supabase";
import type { BookingWithDetails } from "@workspace/types";
import { lightImpact, mediumImpact, warningFeedback } from "../../lib/haptics";
import { Ionicons } from "@expo/vector-icons";

// Helper functions
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
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

const getDisplayStatus = (booking: BookingWithDetails): string => {
  const bookingDateTime = new Date(
    `${booking.booking_date}T${booking.start_time}`,
  );
  const now = new Date();

  if (booking.status === "cancelled") {
    return "Cancelled";
  }

  if (
    booking.status === "completed" ||
    (booking.status === "confirmed" && bookingDateTime < now)
  ) {
    return "Past";
  }

  if (booking.status === "confirmed" && bookingDateTime > now) {
    return "Upcoming";
  }

  return booking.status;
};

const getStatusColor = (displayStatus: string) => {
  switch (displayStatus.toLowerCase()) {
    case "upcoming":
      return "bg-blue-100";
    case "past":
      return "bg-gray-100";
    case "cancelled":
      return "bg-red-100";
    default:
      return "bg-gray-100";
  }
};

const getStatusTextColor = (displayStatus: string) => {
  switch (displayStatus.toLowerCase()) {
    case "upcoming":
      return "text-blue-800";
    case "past":
      return "text-gray-800";
    case "cancelled":
      return "text-red-800";
    default:
      return "text-gray-800";
  }
};

const isUpcoming = (booking: BookingWithDetails): boolean => {
  const bookingDateTime = new Date(
    `${booking.booking_date}T${booking.start_time}`,
  );
  return bookingDateTime > new Date() && booking.status === "confirmed";
};

export default function BookingDetailsScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<BookingWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bookingService = createBookingService(supabase);
  const notificationService = createNotificationService(supabase);

  useEffect(() => {
    if (bookingId) {
      loadBooking();
    }
  }, [bookingId]);

  const loadBooking = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await bookingService.getBookingById(bookingId);
      setBooking(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load booking");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = () => {
    if (!booking) return;

    Alert.alert(
      "Cancel Booking",
      `Are you sure you want to cancel this booking?\n\nRoom: ${booking.room?.name}\nDate: ${formatDate(booking.booking_date)}\nTime: ${formatTime(booking.start_time)} - ${formatTime(booking.end_time)}`,
      [
        {
          text: "No",
          style: "cancel",
          onPress: () => lightImpact(),
        },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              mediumImpact();
              await bookingService.cancelBooking({ id: booking.id });

              // Send cancellation notification
              try {
                await notificationService.sendBookingNotification({
                  bookingId: booking.id,
                  notificationType: "booking_cancelled",
                });
                console.log("[Booking] Cancellation notification sent");
              } catch (notifError) {
                console.warn(
                  "[Booking] Failed to send cancellation notification:",
                  notifError,
                );
              }

              Alert.alert("Success", "Booking cancelled successfully", [
                {
                  text: "OK",
                  onPress: () => router.back(),
                },
              ]);
            } catch (err) {
              Alert.alert(
                "Error",
                err instanceof Error ? err.message : "Failed to cancel booking",
              );
            }
          },
        },
      ],
    );
  };

  const handleEditBooking = () => {
    if (!booking) return;
    lightImpact();
    router.push(`/edit-booking/${booking.id}` as any);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <Stack.Screen options={{ title: "Booking Details" }} />
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="text-gray-600 mt-4">Loading booking details...</Text>
      </View>
    );
  }

  if (error || !booking) {
    return (
      <View className="flex-1 bg-slate-50">
        <Stack.Screen options={{ title: "Booking Details" }} />
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-4xl mb-3">⚠️</Text>
          <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
            {error || "Booking not found"}
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-blue-600 rounded-lg px-6 py-3 mt-4"
            activeOpacity={0.7}
          >
            <Text className="text-white font-bold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const displayStatus = getDisplayStatus(booking);

  return (
    <View className="flex-1 bg-slate-50">
      <Stack.Screen
        options={{
          title: "Booking Details",
          headerBackTitle: "Back",
        }}
      />
      <ScrollView className="flex-1 p-6">
        {/* Room Name & Status Card */}
        <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-4">
          <View className="flex-row justify-between items-start mb-4">
            <View className="flex-1 mr-4">
              <Text className="text-2xl font-bold text-gray-900 mb-1">
                {booking.room?.name || "Unknown Room"}
              </Text>
              <Text className="text-base text-gray-600">
                {formatDate(booking.booking_date)}
              </Text>
            </View>
            <View
              className={`px-4 py-2 rounded-full ${getStatusColor(displayStatus)}`}
            >
              <Text
                className={`text-sm font-semibold ${getStatusTextColor(displayStatus)} uppercase`}
              >
                {displayStatus}
              </Text>
            </View>
          </View>
        </View>

        {/* Booking Details Card */}
        <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-4">
          <Text className="text-lg font-bold text-gray-900 mb-4">
            Booking Information
          </Text>

          {/* Time */}
          <View className="flex-row items-center mb-4 pb-4 border-b border-gray-100">
            <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3">
              <Ionicons name="time-outline" size={20} color="#2563eb" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                Time
              </Text>
              <Text className="text-base text-gray-900 font-medium">
                {formatTime(booking.start_time)} -{" "}
                {formatTime(booking.end_time)}
              </Text>
            </View>
          </View>

          {/* Room Capacity */}
          {booking.room?.capacity && (
            <View className="flex-row items-center mb-4 pb-4 border-b border-gray-100">
              <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3">
                <Ionicons name="people-outline" size={20} color="#2563eb" />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                  Capacity
                </Text>
                <Text className="text-base text-gray-900 font-medium">
                  {booking.room.capacity} seats
                </Text>
              </View>
            </View>
          )}

          {/* Notes */}
          {booking.notes && (
            <View className="flex-row items-start mb-4 pb-4 border-b border-gray-100">
              <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3">
                <Ionicons
                  name="document-text-outline"
                  size={20}
                  color="#2563eb"
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                  Notes
                </Text>
                <Text className="text-base text-gray-900">{booking.notes}</Text>
              </View>
            </View>
          )}

          {/* Booking ID */}
          <View className="flex-row items-center">
            <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3">
              <Ionicons name="receipt-outline" size={20} color="#2563eb" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                Booking ID
              </Text>
              <Text className="text-sm text-gray-700 font-mono">
                {booking.id}
              </Text>
            </View>
          </View>
        </View>

        {/* Cancellation Reason */}
        {booking.status === "cancelled" && booking.cancellation_reason && (
          <View className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-4">
            <View className="flex-row items-center mb-2">
              <Ionicons name="information-circle" size={20} color="#dc2626" />
              <Text className="text-sm font-semibold text-red-800 ml-2">
                Cancellation Reason
              </Text>
            </View>
            <Text className="text-base text-red-900">
              {booking.cancellation_reason}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        {isUpcoming(booking) && (
          <View className="flex-row gap-3 mb-6">
            <TouchableOpacity
              onPress={handleEditBooking}
              className="flex-1 bg-blue-600 rounded-lg py-4 items-center"
              activeOpacity={0.7}
            >
              <Text className="text-white font-bold text-base">
                Edit Booking
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCancelBooking}
              className="flex-1 bg-white border-2 border-red-200 rounded-lg py-4 items-center"
              activeOpacity={0.7}
            >
              <Text className="text-red-600 font-bold text-base">Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
