import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "../../lib/supabase";
import {
  createBookingService,
  createRoomService,
  createNotificationService,
} from "@workspace/supabase";
import type {
  BookingWithDetails,
  TimeSlot,
  RoomAvailability,
} from "@workspace/types";

export default function EditBookingScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();

  const [booking, setBooking] = useState<BookingWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Booking form state
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [availability, setAvailability] = useState<RoomAvailability | null>(
    null,
  );
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [notes, setNotes] = useState("");

  // Step management
  const [step, setStep] = useState<"date" | "slot" | "confirm">("date");

  const bookingService = createBookingService(supabase);
  const roomService = createRoomService(supabase);
  const notificationService = createNotificationService(supabase);

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  const loadBooking = async () => {
    try {
      setError(null);
      const data = await bookingService.getBookingById(bookingId as string);
      setBooking(data);
      setSelectedDate(data.booking_date);
      setNotes(data.notes || "");

      // Set initial selected slot
      setSelectedSlot({
        start_time: data.start_time,
        end_time: data.end_time,
        is_available: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load booking");
    } finally {
      setLoading(false);
    }
  };

  const generateDateOptions = (): string[] => {
    const dates: string[] = [];
    const today = new Date();

    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split("T")[0]);
    }

    return dates;
  };

  const formatDateDisplay = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    const diffDays = Math.floor(
      (dateOnly.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";

    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string): string => {
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const handleDateSelect = async (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setLoadingSlots(true);
    setError(null);

    try {
      if (!booking) return;
      const availabilityData = await bookingService.getRoomAvailability(
        booking.room_id,
        date,
      );
      setAvailability(availabilityData);
      setStep("slot");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load time slots",
      );
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    if (!slot.is_available) return;
    setSelectedSlot(slot);
    setStep("confirm");
  };

  const handleUpdateBooking = async () => {
    if (!selectedSlot || !selectedDate || !booking) {
      Alert.alert("Error", "Please select a date and time slot");
      return;
    }

    try {
      setUpdating(true);
      setError(null);

      // Check if date/time changed to determine if we should send update notification
      const hasDateTimeChanged =
        selectedDate !== booking.booking_date ||
        selectedSlot.start_time !== booking.start_time ||
        selectedSlot.end_time !== booking.end_time;

      await bookingService.updateBooking({
        id: bookingId as string,
        booking_date: selectedDate,
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
        notes: notes.trim() || undefined,
      });

      // Send update notification only if date/time changed
      if (hasDateTimeChanged) {
        try {
          await notificationService.sendBookingNotification({
            bookingId: bookingId as string,
            notificationType: "booking_updated",
          });
          console.log("[Booking] Update notification sent");
        } catch (notifError) {
          console.warn(
            "[Booking] Failed to send update notification:",
            notifError,
          );
        }
      }

      Alert.alert("Success!", "Your booking has been updated", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Failed to update booking",
      );
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="text-gray-600 mt-4">Loading...</Text>
      </View>
    );
  }

  if (error && !booking) {
    return (
      <View className="flex-1 bg-slate-50 p-6">
        <TouchableOpacity onPress={() => router.back()} className="mb-6">
          <Text className="text-blue-600 font-semibold text-base">← Back</Text>
        </TouchableOpacity>
        <View className="bg-red-50 border border-red-200 rounded-lg p-4">
          <Text className="text-sm text-red-800">{error}</Text>
        </View>
      </View>
    );
  }

  if (!booking) return null;

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView className="flex-1">
        <View className="p-6 pb-24">
          {/* Back Button */}
          <TouchableOpacity onPress={() => router.back()} className="mb-6">
            <Text className="text-blue-600 font-semibold text-base">
              ← Back
            </Text>
          </TouchableOpacity>

          {/* Header */}
          <View className="mb-6">
            <Text className="text-3xl font-bold text-gray-900 mb-2">
              Edit Booking
            </Text>
            <Text className="text-xl text-gray-700">{booking.room?.name}</Text>
          </View>

          {/* Progress Steps */}
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-1 items-center">
              <View
                className={`w-10 h-10 rounded-full items-center justify-center ${
                  step === "date" ? "bg-blue-600" : "bg-green-600"
                }`}
              >
                <Text className="text-white font-bold">1</Text>
              </View>
              <Text className="text-xs mt-1 text-gray-600">Date</Text>
            </View>
            <View className="flex-1 h-0.5 bg-gray-300" />
            <View className="flex-1 items-center">
              <View
                className={`w-10 h-10 rounded-full items-center justify-center ${
                  step === "slot"
                    ? "bg-blue-600"
                    : step === "confirm"
                      ? "bg-green-600"
                      : "bg-gray-300"
                }`}
              >
                <Text
                  className={`${step === "date" ? "text-gray-500" : "text-white"} font-bold`}
                >
                  2
                </Text>
              </View>
              <Text className="text-xs mt-1 text-gray-600">Time</Text>
            </View>
            <View className="flex-1 h-0.5 bg-gray-300" />
            <View className="flex-1 items-center">
              <View
                className={`w-10 h-10 rounded-full items-center justify-center ${
                  step === "confirm" ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <Text
                  className={`${step === "confirm" ? "text-white" : "text-gray-500"} font-bold`}
                >
                  3
                </Text>
              </View>
              <Text className="text-xs mt-1 text-gray-600">Confirm</Text>
            </View>
          </View>

          {/* Error Message */}
          {error && (
            <View className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <Text className="text-sm text-red-800">{error}</Text>
            </View>
          )}

          {/* Step 1: Date Selection */}
          {step === "date" && (
            <View>
              <Text className="text-xl font-bold text-gray-900 mb-4">
                Select a Date
              </Text>
              <View className="gap-3">
                {generateDateOptions().map((date) => (
                  <TouchableOpacity
                    key={date}
                    onPress={() => handleDateSelect(date)}
                    className={`bg-white rounded-xl p-4 border-2 ${
                      selectedDate === date
                        ? "border-blue-600"
                        : "border-gray-200"
                    }`}
                  >
                    <Text className="text-lg font-semibold text-gray-900">
                      {formatDateDisplay(date)}
                    </Text>
                    <Text className="text-sm text-gray-600">{date}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Step 2: Time Slot Selection */}
          {step === "slot" && (
            <View>
              <TouchableOpacity
                onPress={() => setStep("date")}
                className="mb-4"
              >
                <Text className="text-blue-600 font-semibold">
                  ← Change Date
                </Text>
              </TouchableOpacity>

              <Text className="text-xl font-bold text-gray-900 mb-2">
                Select a Time Slot
              </Text>
              <Text className="text-base text-gray-600 mb-4">
                {formatDateDisplay(selectedDate)} • {selectedDate}
              </Text>

              {loadingSlots ? (
                <View className="py-8 items-center">
                  <ActivityIndicator size="large" color="#2563eb" />
                  <Text className="text-gray-600 mt-4">
                    Loading available slots...
                  </Text>
                </View>
              ) : availability && availability.slots.length > 0 ? (
                <View className="gap-3">
                  {availability.slots.map((slot, index) => {
                    // Check if this is the current booking's slot
                    const isCurrentSlot =
                      selectedDate === booking.booking_date &&
                      slot.start_time === booking.start_time &&
                      slot.end_time === booking.end_time;

                    const isAvailable = slot.is_available || isCurrentSlot;

                    return (
                      <TouchableOpacity
                        key={index}
                        onPress={() => isAvailable && handleSlotSelect(slot)}
                        disabled={!isAvailable}
                        className={`rounded-xl p-4 border-2 ${
                          !isAvailable
                            ? "bg-gray-100 border-gray-200"
                            : selectedSlot?.start_time === slot.start_time
                              ? "bg-blue-50 border-blue-600"
                              : "bg-white border-gray-200"
                        }`}
                      >
                        <View className="flex-row justify-between items-center">
                          <Text
                            className={`text-lg font-semibold ${
                              !isAvailable ? "text-gray-400" : "text-gray-900"
                            }`}
                          >
                            {formatTime(slot.start_time)} -{" "}
                            {formatTime(slot.end_time)}
                          </Text>
                          {!isAvailable && !isCurrentSlot && (
                            <View className="bg-red-100 px-3 py-1 rounded-full">
                              <Text className="text-xs font-semibold text-red-800 uppercase">
                                Booked
                              </Text>
                            </View>
                          )}
                          {isAvailable && (
                            <View className="bg-green-100 px-3 py-1 rounded-full">
                              <Text className="text-xs font-semibold text-green-800 uppercase">
                                Available
                              </Text>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <View className="bg-white rounded-xl p-8 items-center">
                  <Text className="text-4xl mb-3">😔</Text>
                  <Text className="text-lg font-bold text-gray-900 mb-2">
                    No slots available
                  </Text>
                  <Text className="text-sm text-gray-600 text-center">
                    Please try a different date
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Step 3: Confirmation */}
          {step === "confirm" && selectedSlot && (
            <View>
              <TouchableOpacity
                onPress={() => setStep("slot")}
                className="mb-4"
              >
                <Text className="text-blue-600 font-semibold">
                  ← Change Time
                </Text>
              </TouchableOpacity>

              <Text className="text-xl font-bold text-gray-900 mb-4">
                Confirm Changes
              </Text>

              {/* Booking Summary Card */}
              <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 mb-4">
                <Text className="text-lg font-bold text-gray-900 mb-4">
                  Updated Booking Details
                </Text>

                <View className="space-y-3">
                  <View className="flex-row items-center">
                    <Text className="text-2xl mr-3">🏢</Text>
                    <View className="flex-1">
                      <Text className="text-xs text-gray-500 uppercase">
                        Room
                      </Text>
                      <Text className="text-base font-semibold text-gray-900">
                        {booking.room?.name}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center">
                    <Text className="text-2xl mr-3">📅</Text>
                    <View className="flex-1">
                      <Text className="text-xs text-gray-500 uppercase">
                        Date
                      </Text>
                      <Text className="text-base font-semibold text-gray-900">
                        {formatDateDisplay(selectedDate)} • {selectedDate}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center">
                    <Text className="text-2xl mr-3">🕐</Text>
                    <View className="flex-1">
                      <Text className="text-xs text-gray-500 uppercase">
                        Time
                      </Text>
                      <Text className="text-base font-semibold text-gray-900">
                        {formatTime(selectedSlot.start_time)} -{" "}
                        {formatTime(selectedSlot.end_time)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Notes Field */}
              <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 mb-6">
                <Text className="text-base font-bold text-gray-900 mb-2">
                  Notes (Optional)
                </Text>
                <TextInput
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base bg-white text-gray-900"
                  placeholder="Add any special requirements or notes..."
                  placeholderTextColor="#9CA3AF"
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                  maxLength={500}
                />
                <Text className="text-xs text-gray-500 mt-2">
                  {notes.length}/500 characters
                </Text>
              </View>

              {/* Action Buttons */}
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => router.back()}
                  disabled={updating}
                  className="flex-1 bg-gray-200 rounded-2xl py-4 items-center"
                >
                  <Text className="text-gray-700 font-bold text-lg">
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleUpdateBooking}
                  disabled={updating}
                  className={`flex-1 bg-blue-600 rounded-2xl py-4 items-center shadow-sm ${
                    updating ? "opacity-70" : ""
                  }`}
                >
                  {updating ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white font-bold text-lg">
                      Update Booking
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
